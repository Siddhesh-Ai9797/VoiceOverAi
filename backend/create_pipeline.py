"""
VoiceOverAI — Photo to Video Pipeline
GPT-4o generates script -> ElevenLabs synthesizes voice -> D-ID generates video
"""

import os
import json
import time
import io
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env.local")

LANGUAGE_MAP = {
    "en": "English",   "hi": "Hindi",    "ta": "Tamil",
    "te": "Telugu",    "bn": "Bengali",  "mr": "Marathi",
    "es": "Spanish",   "fr": "French",   "de": "German",
    "ja": "Japanese",  "zh": "Mandarin", "ko": "Korean",
    "ar": "Arabic",
}

def get_did_auth() -> str:
    api_key = os.getenv("DID_API_KEY", "")
    if api_key.startswith("Basic ") or api_key.startswith("Bearer "):
        return api_key
    return f"Basic {api_key}"

def generate_script(prompt: str, language_code: str, style: str, duration: int) -> str:
    from openai import OpenAI
    client     = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    lang_name  = LANGUAGE_MAP.get(language_code, "English")
    word_count = duration * 2

    style_tones = {
        "talking_head": "professional and engaging, like a confident presenter",
        "animated":     "energetic and expressive",
        "lip_sync":     "natural and conversational",
    }
    tone = style_tones.get(style, "professional and engaging")

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": f"You are a scriptwriter. Write a {tone} script in {lang_name}. Exactly {word_count} words. Only the script text, nothing else."},
            {"role": "user",   "content": f"Write a script about: {prompt}"},
        ],
        max_tokens=500,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


def synthesize_voice(script: str, language_code: str, output_dir: str) -> str:
    """Synthesize voice using OpenAI TTS."""
    from openai import OpenAI
    client      = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    output_path = os.path.join(output_dir, "voice.mp3")
    response    = client.audio.speech.create(
        model="tts-1",
        voice="alloy",
        input=script,
    )
    response.stream_to_file(output_path)
    return output_path


def resize_image(image_path: str, output_dir: str) -> str:
    from PIL import Image
    img      = Image.open(image_path).convert("RGB")
    max_size = 1024
    ratio    = min(max_size / img.width, max_size / img.height, 1.0)
    img      = img.resize((int(img.width * ratio), int(img.height * ratio)), Image.LANCZOS)
    out_path = os.path.join(output_dir, "photo.jpg")
    quality  = 85
    while True:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality)
        if buf.tell() < 3 * 1024 * 1024 or quality <= 40:
            break
        quality -= 10
    with open(out_path, "wb") as f:
        f.write(buf.getvalue())
    print(f"Image resized: {buf.tell()//1024}KB")
    return out_path


def generate_talking_video(image_path: str, audio_path: str,
                            style: str, output_dir: str) -> str:
    auth    = get_did_auth()
    headers = {"Authorization": auth, "accept": "application/json"}

    # 1. Resize image
    resized = resize_image(image_path, output_dir)

    # 2. Upload image
    with open(resized, "rb") as f:
        img_res = requests.post(
            "https://api.d-id.com/images",
            headers=headers,
            files={"image": ("photo.jpg", f, "image/jpeg")},
            timeout=60,
        )
    if not img_res.ok:
        raise Exception(f"D-ID image upload failed {img_res.status_code}: {img_res.text[:300]}")
    image_url = img_res.json()["url"]

    # 3. Upload audio
    with open(audio_path, "rb") as f:
        aud_res = requests.post(
            "https://api.d-id.com/audios",
            headers=headers,
            files={"audio": ("voice.mp3", f, "audio/mpeg")},
            timeout=60,
        )
    if not aud_res.ok:
        raise Exception(f"D-ID audio upload failed {aud_res.status_code}: {aud_res.text[:300]}")
    audio_url = aud_res.json()["url"]

    # 4. Create talk
    json_headers = {**headers, "Content-Type": "application/json"}

    driver_map = {
        "talking_head": "bank://classics/main",
        "animated":     "bank://classics/main",
        "lip_sync":     "bank://classics/main",
    }
    driver_url = driver_map.get(style, "bank://classics/main")

    payload = {
        "source_url": image_url,
        "script": {"type": "audio", "audio_url": audio_url},
        "config": {"fluent": True, "pad_audio": 0.0},
    }
    create_res = requests.post(
        "https://api.d-id.com/talks",
        headers=json_headers,
        json=payload,
        timeout=60,
    )
    if not create_res.ok:
        raise Exception(f"D-ID talk creation failed {create_res.status_code}: {create_res.text[:300]}")
    talk_id = create_res.json()["id"]

    # 5. Poll for completion
    for _ in range(60):
        time.sleep(3)
        poll = requests.get(
            f"https://api.d-id.com/talks/{talk_id}",
            headers=headers,
            timeout=30,
        )
        data   = poll.json()
        status = data.get("status")
        print(f"D-ID status: {status}")

        if status == "done":
            video_url   = data["result_url"]
            output_path = os.path.join(output_dir, "created_video.mp4")
            video_res   = requests.get(video_url, timeout=120)
            with open(output_path, "wb") as f:
                f.write(video_res.content)
            return output_path

        if status == "error":
            raise Exception(f"D-ID error: {data.get('error', {})}")

    raise Exception("D-ID timed out after 3 minutes")


def run_create_pipeline(job_id, image_path, prompt,
                         language_code, style, duration, redis_client):
    import tempfile
    import shutil

    def update(status, step, progress, extra=None):
        data = redis_client.get(f"job:{job_id}")
        job  = json.loads(data) if data else {}
        job.update(status=status, current_step=step, progress=progress)
        if extra:
            job.update(extra)
        redis_client.setex(f"job:{job_id}", 86400, json.dumps(job))

    with tempfile.TemporaryDirectory() as tmp:
        try:
            update("generating_script", "script", 15)
            script = generate_script(prompt, language_code, style, duration)
            update("generating_script", "script", 25, {"script": script})

            update("synthesizing_voice", "voice", 40)
            audio_path = synthesize_voice(script, language_code, tmp)

            update("generating_video", "video", 60)
            video_path = generate_talking_video(image_path, audio_path, style, tmp)

            output_dir = Path(__file__).parent / "outputs"
            output_dir.mkdir(exist_ok=True)
            final_path = str(output_dir / f"{job_id}_created.mp4")
            shutil.copy2(video_path, final_path)

            update("complete", "done", 100, {
                "output_url": f"/api/download/create/{job_id}",
                "script":     script,
            })
            return final_path

        except Exception as e:
            update("failed", "error", 0, {"error": str(e)})
            raise
