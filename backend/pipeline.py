"""
VoiceOverAI Pipeline
Whisper -> DeepL -> OpenAI TTS -> FFmpeg
"""

import os
import json
import subprocess
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env.local")

LANGUAGE_MAP = {
    "hi": {"deepl": "HI", "name": "Hindi"},
    "ta": {"deepl": "TA", "name": "Tamil"},
    "te": {"deepl": "TE", "name": "Telugu"},
    "bn": {"deepl": "BN", "name": "Bengali"},
    "mr": {"deepl": "MR", "name": "Marathi"},
    "es": {"deepl": "ES", "name": "Spanish"},
    "fr": {"deepl": "FR", "name": "French"},
    "de": {"deepl": "DE", "name": "German"},
    "ja": {"deepl": "JA", "name": "Japanese"},
    "zh": {"deepl": "ZH", "name": "Mandarin"},
    "ko": {"deepl": "KO", "name": "Korean"},
    "ar": {"deepl": "AR", "name": "Arabic"},
}

def update_job(redis_client, job_id: str, **kwargs):
    key  = f"job:{job_id}"
    data = redis_client.get(key)
    job  = json.loads(data) if data else {}
    job.update(kwargs)
    redis_client.setex(key, 86400, json.dumps(job))

def extract_audio(video_path: str, output_dir: str) -> str:
    audio_path = os.path.join(output_dir, "audio.wav")
    subprocess.run([
        "ffmpeg", "-i", video_path,
        "-vn", "-acodec", "pcm_s16le",
        "-ar", "16000", "-ac", "1",
        "-y", audio_path
    ], capture_output=True, check=True)
    return audio_path

def transcribe_audio(audio_path: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    with open(audio_path, "rb") as f:
        result = client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            response_format="text",
        )
    return result

def translate_text(text: str, target_lang_code: str) -> str:
    import deepl
    translator = deepl.Translator(os.getenv("DEEPL_API_KEY"))
    deepl_code = LANGUAGE_MAP.get(target_lang_code, {}).get("deepl", "DE")
    result     = translator.translate_text(text, target_lang=deepl_code)
    return result.text

def synthesize_voice(text: str, output_dir: str) -> str:
    """Synthesize voice using OpenAI TTS — works from any server, no restrictions."""
    from openai import OpenAI
    client      = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    output_path = os.path.join(output_dir, "dubbed_audio.mp3")
    response    = client.audio.speech.create(
        model="tts-1",
        voice="alloy",
        input=text,
    )
    response.stream_to_file(output_path)
    return output_path

def compose_video(video_path: str, dubbed_audio: str, output_dir: str) -> str:
    output_path = os.path.join(output_dir, "dubbed_final.mp4")
    subprocess.run([
        "ffmpeg",
        "-i", video_path,
        "-i", dubbed_audio,
        "-c:v", "copy",
        "-c:a", "aac",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        "-y", output_path
    ], capture_output=True, check=True)
    return output_path

def run_pipeline(job_id: str, video_path: str,
                 target_lang: str, voice_mode: str,
                 redis_client) -> str:
    import tempfile
    import shutil

    with tempfile.TemporaryDirectory() as tmp:
        try:
            update_job(redis_client, job_id,
                       status="extracting", current_step="extract", progress=10)
            audio_path = extract_audio(video_path, tmp)

            update_job(redis_client, job_id,
                       status="transcribing", current_step="transcribe", progress=25)
            transcript = transcribe_audio(audio_path)

            update_job(redis_client, job_id,
                       status="translating", current_step="translate", progress=45)
            translated = translate_text(transcript, target_lang)

            update_job(redis_client, job_id,
                       status="cloning", current_step="voice", progress=65)
            dubbed_audio = synthesize_voice(translated, tmp)

            update_job(redis_client, job_id,
                       status="composing", current_step="compose", progress=85)
            output_video = compose_video(video_path, dubbed_audio, tmp)

            output_dir  = Path(__file__).parent / "outputs"
            output_dir.mkdir(exist_ok=True)
            final_path  = str(output_dir / f"{job_id}_dubbed.mp4")
            shutil.copy2(output_video, final_path)

            update_job(redis_client, job_id,
                       status="complete", current_step="done",
                       progress=100,
                       output_url=f"/api/download/{job_id}")
            return final_path

        except Exception as e:
            update_job(redis_client, job_id,
                       status="failed", error=str(e))
            raise
