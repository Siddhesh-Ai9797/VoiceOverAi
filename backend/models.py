from pydantic import BaseModel
from typing import Optional
from enum import Enum

class JobStatus(str, Enum):
    QUEUED      = "queued"
    UPLOADING   = "uploading"
    EXTRACTING  = "extracting"
    TRANSCRIBING= "transcribing"
    TRANSLATING = "translating"
    CLONING     = "cloning"
    LIPSYNCING  = "lipsyncing"
    COMPOSING   = "composing"
    COMPLETE    = "complete"
    FAILED      = "failed"

class JobStep(BaseModel):
    id:        str
    label:     str
    tech:      str
    status:    str   # pending | active | done | error
    progress:  int = 0

class Job(BaseModel):
    job_id:         str
    file_name:      str
    target_language:str
    voice_mode:     str
    status:         JobStatus = JobStatus.QUEUED
    progress:       int = 0
    current_step:   str = "queued"
    output_url:     Optional[str] = None
    error:          Optional[str] = None
    created_at:     str = ""

class DubResponse(BaseModel):
    job_id:  str
    message: str

class StatusResponse(BaseModel):
    job_id:         str
    status:         str
    progress:       int
    current_step:   str
    output_url:     Optional[str] = None
    error:          Optional[str] = None
