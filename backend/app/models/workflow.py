from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class NodeKind(str, Enum):
    """Node types in workflow."""
    START = "start"
    NMAP = "nmap"
    HTTP_PROBE = "httpProbe"
    PARSER_RULES = "parserRules"
    GITLEAKS = "gitleaks"
    SLACK_ALERT = "slackAlert"
    DISCORD_ALERT = "discordAlert"
    REPORT_EXPORT = "reportExport"
    DELAY = "delay"
    CONDITION = "condition"


class NodeCategory(str, Enum):
    """Node categories."""
    UTILITY = "utility"
    RECON = "recon"
    ANALYSIS = "analysis"
    SECURITY = "security"
    OUTPUT = "output"


class Position(BaseModel):
    """Node position on canvas."""
    x: float
    y: float


class WorkflowNode(BaseModel):
    """Workflow node definition."""
    id: str
    kind: NodeKind
    label: str
    category: NodeCategory
    config: Dict[str, Any] = Field(default_factory=dict)
    position: Position


class WorkflowEdge(BaseModel):
    """Workflow edge (connection between nodes)."""
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    label: Optional[str] = None
    type: Optional[str] = None


class Workflow(BaseModel):
    """Workflow model."""
    id: str
    name: str
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    authorizedTargets: bool = False

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class WorkflowCreate(BaseModel):
    """Create workflow request."""
    name: str
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    authorizedTargets: bool = False


class WorkflowUpdate(BaseModel):
    """Update workflow request."""
    name: Optional[str] = None
    nodes: Optional[List[WorkflowNode]] = None
    edges: Optional[List[WorkflowEdge]] = None
    authorizedTargets: Optional[bool] = None
