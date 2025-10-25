from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class APIKey(BaseModel):
    """API Key model."""
    id: str
    key: str  # This will be hashed
    userId: str
    name: Optional[str] = None
    createdAt: datetime
    lastUsedAt: Optional[datetime] = None
    expiresAt: Optional[datetime] = None
    isActive: bool = True


class APIKeyCreate(BaseModel):
    """Create API key request."""
    userId: str
    name: Optional[str] = None


class APIKeyResponse(BaseModel):
    """API key creation response."""
    id: str
    key: str  # Plain text key (only returned on creation)
    userId: str
    name: Optional[str] = None
    createdAt: datetime


class TokenRequest(BaseModel):
    """Token creation request."""
    apiKey: str


class TokenResponse(BaseModel):
    """Token response."""
    accessToken: str
    tokenType: str = "bearer"
    expiresIn: int  # seconds


class AuditLog(BaseModel):
    """Audit log entry."""
    id: str
    userId: str
    action: str
    resource: str
    resourceId: Optional[str] = None
    details: dict = {}
    timestamp: datetime
    ipAddress: Optional[str] = None
