import os
import sys

import pytest

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)
os.environ["REDIS_HOST"] = "redis-not-running-in-tests.invalid"


@pytest.fixture
def client(monkeypatch):
    from fastapi.testclient import TestClient

    import main

    async def no_pipeline(*args, **kwargs):
        return None

    # The real pipelines call Whisper, DeepL, OpenAI TTS, D-ID and FFmpeg.
    monkeypatch.setattr(main, "run_pipeline_async", no_pipeline)
    monkeypatch.setattr(main, "run_create_pipeline_async", no_pipeline)
    main.IN_MEMORY_STORE.clear()
    return TestClient(main.app)
