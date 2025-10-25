from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class RunStatus(str, Enum):
    """Run execution status."""
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class StepStatus(str, Enum):
    """Step execution status."""
    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class FindingSeverity(str, Enum):
    """Finding severity level."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Finding(BaseModel):
    """Security finding from tool execution."""
    id: str
    severity: FindingSeverity
    title: str
    description: str
    service: Optional[str] = None
    port: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RunStep(BaseModel):
    """Individual step in workflow execution."""
    nodeId: str
    name: str
    status: StepStatus
    logs: List[str] = Field(default_factory=list)
    findings: List[Finding] = Field(default_factory=list)
    startedAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    error: Optional[str] = None


class RunSeverityCounts(BaseModel):
    """Count of findings by severity."""
    low: int = 0
    medium: int = 0
    high: int = 0
    critical: int = 0


class RunSummary(BaseModel):
    """Summary of run results."""
    findingsCount: int = 0
    severities: RunSeverityCounts = Field(default_factory=RunSeverityCounts)


class Run(BaseModel):
    """Workflow execution run."""
    id: str
    workflowId: str
    workflowName: str
    status: RunStatus
    targets: List[str] = Field(default_factory=list)
    authorizeTargets: bool = False
    runMode: str = "live"  # "live" or "demo"
    startedAt: datetime = Field(default_factory=datetime.utcnow)
    endedAt: Optional[datetime] = None
    duration: Optional[int] = None  # in seconds
    steps: List[RunStep] = Field(default_factory=list)
    summary: Optional[RunSummary] = None
    userId: Optional[str] = None
    error: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class RunCreate(BaseModel):
    """Create run request."""
    workflowId: str
    targets: List[str]
    authorizeTargets: bool = False
    runMode: str = "live"


class RunResponse(BaseModel):
    """Run creation response."""
    runId: str
    status: RunStatus
    message: str = "Run queued successfully"
