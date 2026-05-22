import os
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from worker.models import UGCJobRequest, UGCJobResponse, JobInfo, JobStatus
from worker.queue import queue, save_job, load_job
from worker.generator import start_job_worker
from config import OUTPUT_DIR

app = FastAPI(title="Brane Media Worker — UGC AI Ads", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    start_job_worker()


@app.get("/health")
def health():
    qs = queue.status()
    return {"status": "ok", "queue": qs}


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
    import glob
    jobs_dir = os.path.join(os.path.dirname(__file__), "jobs")
    files = sorted(glob.glob(os.path.join(jobs_dir, "*.json")), reverse=True)[:limit]
    jobs = []
    for f in files:
        with open(f, "r", encoding="utf-8") as fh:
            import json
            jobs.append(json.load(fh))
    return jobs


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=3200, reload=True)
