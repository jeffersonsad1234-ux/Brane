import os
import uuid
import time
import threading
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from worker.models import UGCJobRequest, UGCJobResponse, JobInfo, JobStatus
from worker.queue import queue, save_job, load_job
from config import OUTPUT_DIR

app = FastAPI(title="Brane Media Worker — UGC AI Ads", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MOCK_JOBS_DIR = os.path.join(os.path.dirname(__file__), "mock_jobs")
os.makedirs(MOCK_JOBS_DIR, exist_ok=True)


def _mock_job_path(job_id: str) -> str:
    return os.path.join(MOCK_JOBS_DIR, f"{job_id}.json")


def _simulate_ugc_job(job_id: str, delay_done: int = 12):
    import json
    time.sleep(3)
    path = _mock_job_path(job_id)
    if os.path.exists(path):
        with open(path, "r") as f:
            data = json.load(f)
        data["status"] = "running"
        data["progress"] = 0.3
        data["logs"].append("🎬 Gerando cenas UGC...")
        with open(path, "w") as f:
            json.dump(data, f)

    time.sleep(4)
    if os.path.exists(path):
        with open(path, "r") as f:
            data = json.load(f)
        data["status"] = "rendering"
        data["progress"] = 0.7
        data["logs"].append("🎞️ Renderizando vídeo...")
        with open(path, "w") as f:
            json.dump(data, f)

    time.sleep(delay_done - 7)
    if os.path.exists(path):
        with open(path, "r") as f:
            data = json.load(f)
        video_url = f"{MOCK_BASE_URL}/api/videos/{job_id}.mp4"
        data["status"] = "done"
        data["progress"] = 1.0
        data["videoUrl"] = video_url
        data["logs"].append(f"✅ UGC vídeo pronto: {video_url}")
        with open(path, "w") as f:
            json.dump(data, f)


MOCK_BASE_URL = os.environ.get("MOCK_BASE_URL", "http://localhost:3200")


@app.get("/health")
def health():
    qs = queue.status()
    return {"status": "ok", "queue": qs}


# ── Mock endpoints for frontend integration ──

@app.post("/api/jobs")
def create_mock_job(req: UGCJobRequest):
    if not req.productName.strip():
        raise HTTPException(400, "productName is required")
    if not req.productImageUrl.strip():
        raise HTTPException(400, "productImageUrl is required")
    if req.price <= 0:
        raise HTTPException(400, "price must be > 0")
    if not req.affiliateLink.strip():
        raise HTTPException(400, "affiliateLink is required")

    job_id = uuid.uuid4().hex[:12]
    now = datetime.now(timezone.utc).isoformat()

    mock_data = {
        "jobId": job_id,
        "status": "pending",
        "progress": 0.0,
        "videoUrl": None,
        "error": None,
        "logs": ["📥 Job UGC recebido — iniciando processamento simulado"],
        "createdAt": now,
    }

    import json
    with open(_mock_job_path(job_id), "w") as f:
        json.dump(mock_data, f)

    t = threading.Thread(target=_simulate_ugc_job, args=(job_id,), daemon=True)
    t.start()

    return {
        "jobId": job_id,
        "status": "pending",
        "message": "Job UGC criado. Acompanhe em GET /api/jobs/{jobId}",
    }


@app.get("/api/jobs/{job_id}")
def get_mock_job(job_id: str):
    import json
    path = _mock_job_path(job_id)
    if not os.path.exists(path):
        raise HTTPException(404, "Job não encontrado")
    with open(path, "r") as f:
        return json.load(f)


# ── Existing real job endpoints (kept for full pipeline) ──

@app.post("/jobs", response_model=UGCJobResponse)
def create_job(req: UGCJobRequest):
    if not req.productName.strip():
        raise HTTPException(400, "productName is required")
    if not req.productImageUrl.strip():
        raise HTTPException(400, "productImageUrl is required")
    if req.price <= 0:
        raise HTTPException(400, "price must be > 0")
    if not req.affiliateLink.strip():
        raise HTTPException(400, "affiliateLink is required")

    job_id = uuid.uuid4().hex[:12]
    now = datetime.now(timezone.utc).isoformat()

    job = JobInfo(
        jobId=job_id,
        status=JobStatus.pending,
        progress=0.0,
        logs=["📥 Job criado — aguardando processamento"],
        createdAt=now,
        request_data=req.model_dump(),
    )
    save_job(job)
    queue.enqueue(job_id)

    return UGCJobResponse(
        jobId=job_id,
        status=JobStatus.pending,
        message="Job criado. Use GET /jobs/{jobId} para acompanhar.",
    )


@app.get("/jobs/{job_id}", response_model=JobInfo)
def get_job(job_id: str):
    job = load_job(job_id)
    if not job:
        raise HTTPException(404, "Job não encontrado")
    return job


@app.get("/videos/{filename}")
def get_video(filename: str):
    safe = os.path.basename(filename)
    path = os.path.join(OUTPUT_DIR, safe)
    if not os.path.exists(path):
        raise HTTPException(404, "Vídeo não encontrado")
    return FileResponse(path, media_type="video/mp4")


@app.get("/jobs")
def list_jobs(limit: int = 20):
    import glob, json
    jobs_dir = os.path.join(os.path.dirname(__file__), "jobs")
    files = sorted(glob.glob(os.path.join(jobs_dir, "*.json")), reverse=True)[:limit]
    jobs = []
    for f in files:
        with open(f, "r", encoding="utf-8") as fh:
            jobs.append(json.load(fh))
    return jobs


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=3200, reload=True)
