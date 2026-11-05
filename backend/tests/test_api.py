import json
import uuid

import main

VIDEO = ("clip.mp4", b"\x00\x00\x00\x18ftypmp42", "video/mp4")
PHOTO = ("me.png", b"\x89PNG\r\n\x1a\n", "image/png")


def test_health_falls_back_to_memory_store(client):
    body = client.get("/health").json()
    assert body["status"] == "ok"
    assert body["redis"] is False


def test_dub_creates_a_queued_job(client):
    job_id = str(uuid.uuid4())
    response = client.post("/api/dub", files={"file": VIDEO}, data={"target_language": "hi", "job_id": job_id})
    assert response.json()["job_id"] == job_id
    job = client.get(f"/api/jobs/{job_id}").json()
    assert job["status"] == "queued"
    assert job["target_language"] == "hi"
    assert (main.UPLOAD_DIR / f"{job_id}.mp4").exists()
    (main.UPLOAD_DIR / f"{job_id}.mp4").unlink()


def test_dub_rejects_non_video(client):
    files = {"file": ("notes.txt", b"hi", "text/plain")}
    assert client.post("/api/dub", files=files).status_code == 400


def test_job_id_cannot_escape_upload_folder(client):
    response = client.post("/api/dub", files={"file": VIDEO}, data={"job_id": "../../main"})
    assert response.status_code == 400


def test_unknown_extension_is_replaced(client):
    files = {"file": ("clip.mp4.sh", VIDEO[1], "video/mp4")}
    job_id = client.post("/api/dub", files=files).json()["job_id"]
    saved = main.UPLOAD_DIR / f"{job_id}.mp4"
    assert saved.exists()
    saved.unlink()


def test_create_rejects_non_image(client):
    files = {"file": ("clip.mp4", VIDEO[1], "video/mp4")}
    assert client.post("/api/create", files=files, data={"prompt": "hello"}).status_code == 400


def test_create_creates_a_queued_job(client):
    job_id = client.post("/api/create", files={"file": PHOTO}, data={"prompt": "say hi"}).json()["job_id"]
    job = client.get(f"/api/create/{job_id}").json()
    assert job["status"] == "queued"
    assert job["prompt"] == "say hi"
    (main.UPLOAD_DIR / f"{job_id}_photo.png").unlink()


def test_unknown_job_is_404(client):
    assert client.get(f"/api/jobs/{uuid.uuid4()}").status_code == 404


def test_download_waits_for_completion(client):
    job_id = str(uuid.uuid4())
    main.store_set(f"job:{job_id}", json.dumps({"job_id": job_id, "status": "processing", "file_name": "a.mp4"}))
    assert client.get(f"/api/download/{job_id}").status_code == 400


def test_debug_route_is_gone(client):
    assert client.get("/api/test-did").status_code == 404
