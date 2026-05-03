"""
VoiceOverAI Pipeline
Whisper v3 → DeepL → ElevenLabs → FFmpeg
Each step updates Redis so the frontend can poll progress.
"""

import os
import json
import time
import uuid
import tempfile
import subprocess
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env.local")

# ── Language code map (frontend code → DeepL/ElevenLabs code) ──
LANGUAGE_MAP = {
    "hi": {"deepl": "HI",    "eleven": "hi",    "name": "Hindi"    },
    "ta": {"deepl": "TA",    "eleven": "ta",    "name": "Tamil"    },
    "te": {"deepl": "TE",    "eleven": "te",    "name": "Telugu"   },
    "bn": {"deepl": "BN",    "eleven": "bn",    "name": "Bengali"  },
    "mr": {"deepl": "MR",    "eleven": "mr",    "name": "Marathi"  },
    "es": {"deepl": "ES",    "eleven": "es",    "name": "Spanish"  },
    "fr": {"deepl": "FR",    "eleven": "fr",    "name": "French"   },
    "de": {"deepl": "DE",    "eleven": "de",    "name": "German"   },
    "ja": {"deepl": "JA",    "eleven": "ja",    "name": "Japanese" },
    "zh": {"deepl": "ZH",    "eleven": "zh",    "name": "Mandarin" },
    "ko": {"deepl": "KO",    "eleven": "ko",    "name": "Korean"   },
    "ar": {"deepl": "AR",    "eleven": "ar",    "name": "Arabic"   },
}

def update_job(redis_client, job_id: str, **kwargs):
    """Update job status in Redis."""
    key  = f"job:{job_id}"
    data = redis_client.get(key)
    job  = json.loads(data) if data else {}
    job.update(kwargs)
    redis_client.setex(key, 86400, json.dumps(job))  # expires in 24h

def check_ffmpeg() -> bool:
    """Check if FFmpeg is installed."""
    try:
        subprocess.run(["ffmpeg", "-version"],
                       capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def extract_audio(video_path: str, output_dir: str) -> str:
    """Step 1: Extract audio track from video using FFmpeg."""
    audio_path = os.path.join(output_dir, "audio.wav")
    subprocess.run([
        "ffmpeg", "-i", video_path,
        "-vn",                    # no video
        "-acodec", "pcm_s16le",   # WAV format
        "-ar", "16000",           # 16kHz (Whisper requirement)
        "-ac", "1",               # mono
        "-y", audio_path
    ], capture_output=True, check=True)
    return audio_path

def transcribe_audio(audio_path: str) -> dict:
    """Step 2: Transcribe audio using OpenAI Whisper v3."""
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    with open(audio_path, "rb") as f:
        result = client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )
    return {"text": result.text, "segments": result.segments}

def translate_text(text: str, target_lang_code: str) -> str:
    """Step 3: Translate transcript using DeepL."""
    import deepl
    translator = deepl.Translator(os.getenv("DEEPL_API_KEY"))
    deepl_code = LANGUAGE_MAP.get(target_lang_code, {}).get("deepl", "DE")
    result     = translator.translate_text(text, target_lang=deepl_code)
    return result.text

def clone_and_synthesize(text: str, audio_path: str,
                          target_lang_code: str, output_dir: str) -> str:
    """Step 4: Synthesize speech in target language using ElevenLabs."""
    from elevenlabs import ElevenLabs
    client      = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
    eleven_lang = LANGUAGE_MAP.get(target_lang_code, {}).get("eleven", "de")
    output_path = os.path.join(output_dir, "dubbed_audio.mp3")

    # Use multilingual model with a high quality default voice
    # Voice ID: Adam (works across all languages)
    audio_gen = client.text_to_speech.convert(
        voice_id="pNInz6obpgDQGcFmaJgB",
        text=text,
        model_id="eleven_multilingual_v2",
        voice_settings={
            "stability": 0.5,
            "similarity_boost": 0.75,
        },
    )
    with open(output_path, "wb") as out:
        for chunk in audio_gen:
            out.write(chunk)

    return output_path

def compose_video(video_path: str, dubbed_audio: str, output_dir: str) -> str:
    """Step 5: Merge dubbed audio back into the video using FFmpeg."""
    output_path = os.path.join(output_dir, "dubbed_final.mp4")
    subprocess.run([
        "ffmpeg",
        "-i", video_path,
        "-i", dubbed_audio,
        "-c:v", "copy",          # keep original video stream
        "-c:a", "aac",           # encode audio as AAC
        "-map", "0:v:0",         # video from original
        "-map", "1:a:0",         # audio from dubbed
        "-shortest",             # cut to shortest stream
        "-y", output_path
    ], capture_output=True, check=True)
    return output_path

def run_pipeline(job_id: str, video_path: str,
                 target_lang: str, voice_mode: str,
                 redis_client) -> str:
    """
    Main pipeline orchestrator.
    Runs all steps and updates Redis at each stage.
    Returns the output file path.
    """
    with tempfile.TemporaryDirectory() as tmp:
        try:
            # Step 1 — Extract audio
            update_job(redis_client, job_id,
                       status="extracting", current_step="extract", progress=10)
            audio_path = extract_audio(video_path, tmp)

            # Step 2 — Transcribe
            update_job(redis_client, job_id,
                       status="transcribing", current_step="transcribe", progress=25)
            transcript = transcribe_audio(audio_path)

            # Step 3 — Translate
            update_job(redis_client, job_id,
                       status="translating", current_step="translate", progress=45)
            translated = translate_text(transcript["text"], target_lang)

            # Step 4 — Voice clone + synthesize
            if voice_mode == "clone":
                update_job(redis_client, job_id,
                           status="cloning", current_step="voice", progress=65)
                dubbed_audio = clone_and_synthesize(
                    translated, audio_path, target_lang, tmp)
            else:
                # Standard TTS without voice cloning
                from elevenlabs import ElevenLabs
                client      = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
                eleven_lang = LANGUAGE_MAP.get(target_lang, {}).get("eleven", "de")
                dubbed_audio = os.path.join(tmp, "dubbed_audio.mp3")
                audio_gen   = client.text_to_speech.convert(
                    voice_id="pNInz6obpgDQGcFmaJgB",   # default ElevenLabs voice
                    text=translated,
                    model_id="eleven_turbo_v2_5",
                    language_code=eleven_lang,
                )
                with open(dubbed_audio, "wb") as f:
                    for chunk in audio_gen:
                        f.write(chunk)

            # Step 5 — Compose final video
            update_job(redis_client, job_id,
                       status="composing", current_step="compose", progress=85)
            output_video = compose_video(video_path, dubbed_audio, tmp)

            # Copy output to persistent location
            output_dir  = Path(__file__).parent / "outputs"
            output_dir.mkdir(exist_ok=True)
            final_path  = str(output_dir / f"{job_id}_dubbed.mp4")

            import shutil
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
