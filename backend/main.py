"""
VoiceOverAI FastAPI Backend
Endpoints:
  POST /api/dub          — upload video, start job
  GET  /api/jobs/{id}    — poll job status
  GET  /api/download/{id}— download completed video
  GET  /health           — health check
"""

import os
import json
import uuid
import asyncio
import aiofiles
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env.local")

# ── Redis connection ──
try:
    import redis
    redis_client = redis.Redis(host=os.getenv("REDIS_HOST", "localhost"),
                               port=int(os.getenv("REDIS_PORT", "6379")),
                               db=0, decode_responses=True)
    redis_client.ping()
    REDIS_AVAILABLE = True
    print("✅ Redis connected")
except Exception:
    redis_client = None
    REDIS_AVAILABLE = False
    print("⚠️  Redis not available — using in-memory store (dev mode)")

# ── Upload path safety ──
# job_id and the file name both come from the request, and both end up in a
# file path, so they are checked before use.
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def safe_job_id(job_id: str | None) -> str:
    """Returns a new UUID, or the given one if it is a valid UUID. Rejects anything else."""
    if not job_id:
        return str(uuid.uuid4())
    try:
        return str(uuid.UUID(job_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job id.")


def safe_extension(filename: str | None, allowed: set, default: str) -> str:
    ext = Path(filename or "").suffix.lower()
    return ext if ext in allowed else default


# ── In-memory fallback for dev (when Redis isn't running) ──
IN_MEMORY_STORE: dict = {}

def store_set(key: str, value: str, ttl: int = 86400):
    if REDIS_AVAILABLE:
        redis_client.setex(key, ttl, value)
    else:
        IN_MEMORY_STORE[key] = value

def store_get(key: str) -> str | None:
    if REDIS_AVAILABLE:
        return redis_client.get(key)
    return IN_MEMORY_STORE.get(key)

# ── Upload dir ──
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR = Path(__file__).parent / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

# ── App ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 VoiceOverAI backend starting...")
    yield
    print("👋 VoiceOverAI backend shutting down")

app = FastAPI(
    title="VoiceOverAI API",
    description="AI Video Dubbing — Whisper + DeepL + ElevenLabs",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS — allow Next.js dev server ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001",
                   "https://voiceoverai.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ────────────────────────────────────────────
# ROUTES
# ────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "redis":  REDIS_AVAILABLE,
        "version":"0.1.0",
    }


@app.post("/api/dub")
async def start_dub(
    file:            UploadFile = File(...),
    target_language: str        = Form("hi"),
    voice_mode:      str        = Form("clone"),
    job_id:          str        = Form(None),
):
    """Receive video upload and kick off the dubbing pipeline."""

    # Validate file type
    allowed = {"video/mp4","video/quicktime","video/x-msvideo",
               "video/x-matroska","video/webm"}
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Upload a video file.")

    # Validate file size (2 GB max)
    MAX_SIZE = 2 * 1024 * 1024 * 1024
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 2 GB limit.")

    # Save to disk
    job_id     = safe_job_id(job_id)
    ext        = safe_extension(file.filename, VIDEO_EXTENSIONS, ".mp4")
    video_path = UPLOAD_DIR / f"{job_id}{ext}"

    async with aiofiles.open(video_path, "wb") as f:
        await f.write(contents)

    # Store initial job state
    job = {
        "job_id":          job_id,
        "file_name":       file.filename,
        "target_language": target_language,
        "voice_mode":      voice_mode,
        "status":          "queued",
        "progress":        0,
        "current_step":    "queued",
        "output_url":      None,
        "error":           None,
        "created_at":      datetime.utcnow().isoformat(),
    }
    store_set(f"job:{job_id}", json.dumps(job))

    # Run pipeline in background (non-blocking)
    asyncio.create_task(
        run_pipeline_async(job_id, str(video_path),
                           target_language, voice_mode)
    )

    return {"job_id": job_id, "message": "Dubbing started"}


@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str):
    """Poll job status — called every 2s by the frontend."""
    data = store_get(f"job:{job_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")
    return json.loads(data)


@app.get("/api/download/{job_id}")
def download_video(job_id: str):
    """Stream the completed dubbed video to the browser."""
    data = store_get(f"job:{job_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")

    job = json.loads(data)
    if job.get("status") != "complete":
        raise HTTPException(status_code=400, detail="Video not ready yet")

    output_path = OUTPUT_DIR / f"{job_id}_dubbed.mp4"
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="Output file not found")

    return FileResponse(
        path=str(output_path),
        media_type="video/mp4",
        filename=f"{job['file_name'].rsplit('.', 1)[0]}_dubbed.mp4",
    )


# ────────────────────────────────────────────
# PIPELINE RUNNER (async wrapper)
# ────────────────────────────────────────────

async def run_pipeline_async(job_id: str, video_path: str,
                              target_lang: str, voice_mode: str):
    """
    Runs the AI pipeline in a thread so it doesn't block the server.
    In production this moves to a Celery worker.
    """
    import json
    from functools import partial

    def update(status, step, progress):
        data = store_get(f"job:{job_id}")
        job  = json.loads(data) if data else {}
        job.update(status=status, current_step=step, progress=progress)
        store_set(f"job:{job_id}", json.dumps(job))

    api_keys_set = all([
        os.getenv("OPENAI_API_KEY"),
        os.getenv("DEEPL_API_KEY"),
        os.getenv("ELEVENLABS_API_KEY"),
    ])

    if not api_keys_set:
        # ── DEMO MODE (no real API keys yet) ──
        # Simulates the pipeline so you can test the frontend
        steps = [
            ("uploading",    "upload",     8,  1.2),
            ("extracting",   "extract",   18,  1.0),
            ("transcribing", "transcribe", 35,  1.8),
            ("translating",  "translate",  52,  1.4),
            ("cloning",      "voice",      70,  2.2),
            ("lipsyncing",   "lipsync",    88,  2.6),
            ("composing",    "compose",    96,  0.9),
        ]
        for status, step, progress, wait in steps:
            update(status, step, progress)
            await asyncio.sleep(wait)

        update("complete", "done", 100)
        # Store a mock output URL
        data = store_get(f"job:{job_id}")
        job  = json.loads(data)
        job["output_url"] = f"/api/download/{job_id}"
        store_set(f"job:{job_id}", json.dumps(job))
        return

    # ── REAL PIPELINE (API keys present) ──
    loop = asyncio.get_event_loop()
    try:
        if REDIS_AVAILABLE:
            rc = redis_client
        else:
            # Pass a simple dict-like object for the pipeline
            class DictStore:
                def get(self, k):   return IN_MEMORY_STORE.get(k)
                def setex(self, k, ttl, v): IN_MEMORY_STORE[k] = v
            rc = DictStore()

        from pipeline import run_pipeline
        await loop.run_in_executor(
            None,
            partial(run_pipeline, job_id, video_path,
                    target_lang, voice_mode, rc)
        )
    except Exception as e:
        data = store_get(f"job:{job_id}")
        job  = json.loads(data) if data else {}
        job.update(status="failed", error=str(e))
        store_set(f"job:{job_id}", json.dumps(job))


# ────────────────────────────────────────────
# CREATE — Photo to Video
# ────────────────────────────────────────────

@app.post("/api/create")
async def start_create(
    file:          UploadFile = File(...),
    prompt:        str        = Form(...),
    language_code: str        = Form("en"),
    style:         str        = Form("talking_head"),
    duration:      int        = Form(30),
    job_id:        str        = Form(None),
):
    """Receive photo upload and kick off the create pipeline."""

    allowed_images = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_images:
        raise HTTPException(status_code=400, detail="Please upload a JPG, PNG or WEBP image.")

    contents   = await file.read()
    job_id     = safe_job_id(job_id)
    ext        = safe_extension(file.filename, IMAGE_EXTENSIONS, ".jpg")
    image_path = UPLOAD_DIR / f"{job_id}_photo{ext}"

    async with aiofiles.open(image_path, "wb") as f:
        await f.write(contents)

    job = {
        "job_id":        job_id,
        "type":          "create",
        "file_name":     file.filename,
        "prompt":        prompt,
        "language_code": language_code,
        "style":         style,
        "duration":      duration,
        "status":        "queued",
        "progress":      0,
        "current_step":  "queued",
        "output_url":    None,
        "script":        None,
        "error":         None,
        "created_at":    datetime.utcnow().isoformat(),
    }
    store_set(f"job:{job_id}", json.dumps(job))

    asyncio.create_task(
        run_create_pipeline_async(
            job_id, str(image_path), prompt, language_code, style, duration
        )
    )

    return {"job_id": job_id, "message": "Video creation started"}


@app.get("/api/create/{job_id}")
def get_create_status(job_id: str):
    """Poll create job status."""
    data = store_get(f"job:{job_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")
    return json.loads(data)


@app.get("/api/download/create/{job_id}")
def download_created_video(job_id: str):
    """Download the created video."""
    data = store_get(f"job:{job_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = json.loads(data)
    if job.get("status") != "complete":
        raise HTTPException(status_code=400, detail="Video not ready yet")
    output_path = OUTPUT_DIR / f"{job_id}_created.mp4"
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="Output file not found")
    return FileResponse(
        path=str(output_path),
        media_type="video/mp4",
        filename="voiceoverai_created.mp4",
    )


async def run_create_pipeline_async(
    job_id: str, image_path: str,
    prompt: str, language_code: str,
    style: str, duration: int,
):
    """Run create pipeline — uses demo mode if no API keys."""
    import json

    api_keys_set = all([
        os.getenv("OPENAI_API_KEY"),
        os.getenv("ELEVENLABS_API_KEY"),
        os.getenv("DID_API_KEY"),
    ])

    if not api_keys_set:
        # Demo mode
        steps = [
            ("generating_script", "script", 20, 2.0),
            ("synthesizing_voice","voice",  50, 2.5),
            ("generating_video",  "video",  80, 4.0),
        ]
        for status, step, progress, wait in steps:
            data = store_get(f"job:{job_id}")
            job  = json.loads(data) if data else {}
            job.update(status=status, current_step=step, progress=progress)
            store_set(f"job:{job_id}", json.dumps(job))
            await asyncio.sleep(wait)

        data = store_get(f"job:{job_id}")
        job  = json.loads(data)
        job.update(
            status="complete", progress=100,
            output_url=f"/api/download/create/{job_id}",
            script="This is a demo script generated by VoiceOverAI.",
        )
        store_set(f"job:{job_id}", json.dumps(job))
        return

    # Real pipeline
    loop = asyncio.get_event_loop()
    try:
        if REDIS_AVAILABLE:
            rc = redis_client
        else:
            class DictStore:
                def get(self, k):        return IN_MEMORY_STORE.get(k)
                def setex(self, k, t, v): IN_MEMORY_STORE[k] = v
            rc = DictStore()

        from create_pipeline import run_create_pipeline
        from functools import partial
        await loop.run_in_executor(
            None,
            partial(run_create_pipeline, job_id, image_path,
                    prompt, language_code, style, duration, rc)
        )
    except Exception as e:
        data = store_get(f"job:{job_id}")
        job  = json.loads(data) if data else {}
        job.update(status="failed", error=str(e))
        store_set(f"job:{job_id}", json.dumps(job))
