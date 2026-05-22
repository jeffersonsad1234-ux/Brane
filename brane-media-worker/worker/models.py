from pydantic import BaseModel
from typing import Optional, List, Literal
from enum import Enum


class JobStatus(str, Enum):
    pending = "pending"
    running = "running"
    done = "done"
    failed = "failed"


class UGCJobRequest(BaseModel):
    productName: str
    productImageUrl: str
    price: float
    oldPrice: Optional[float] = None
    affiliateLink: str
    description: Optional[str] = ""
    category: Optional[str] = "tecnologia"
    tone: Optional[Literal["entusiasmado", "calmo", "urgente", "divertido"]] = "entusiasmado"
    avatarStyle: Optional[Literal["profissional", "jovem", "influencer", "minimalista"]] = "profissional"
    callbackUrl: Optional[str] = None


class UGCJobResponse(BaseModel):
    jobId: str
    status: JobStatus
    message: str


class JobInfo(BaseModel):
    jobId: str
    status: JobStatus
    progress: float = 0.0
    videoUrl: Optional[str] = None
    error: Optional[str] = None
    logs: List[str] = []
    createdAt: str = ""
    request_data: Optional[dict] = None
