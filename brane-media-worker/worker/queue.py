import json
import os
import time
import threading
from typing import Optional
from .models import JobStatus, JobInfo

JOBS_DIR = os.path.join(os.path.dirname(__file__), "..", "jobs")


def _job_path(job_id: str) -> str:
    return os.path.join(JOBS_DIR, f"{job_id}.json")


def save_job(job: JobInfo):
    os.makedirs(JOBS_DIR, exist_ok=True)
    with open(_job_path(job.jobId), "w", encoding="utf-8") as f:
        f.write(job.model_dump_json(indent=2))


def load_job(job_id: str) -> Optional[JobInfo]:
    path = _job_path(job_id)
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return JobInfo.model_validate_json(f.read())


class JobQueue:
    def __init__(self):
        self._lock = threading.Lock()
        self._pending: list[str] = []
        self._running: Optional[str] = None

    def enqueue(self, job_id: str):
        with self._lock:
            self._pending.append(job_id)

    def dequeue(self) -> Optional[str]:
        with self._lock:
            if not self._pending:
                return None
            job_id = self._pending.pop(0)
            self._running = job_id
            return job_id

    def complete(self, job_id: str):
        with self._lock:
            if self._running == job_id:
                self._running = None

    def fail(self, job_id: str):
        with self._lock:
            if self._running == job_id:
                self._running = None

    def status(self) -> dict:
        with self._lock:
            return {
                "pending": len(self._pending),
                "running": self._running,
            }


queue = JobQueue()
