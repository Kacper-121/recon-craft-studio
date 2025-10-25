from pydantic import BaseModel, Field, validator
from typing import List
from datetime import datetime
import ipaddress
import re


class Target(BaseModel):
    """Authorized scan target."""
    id: str
    value: str  # IP, CIDR, or hostname
    tags: List[str] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    @validator('value')
    def validate_target(cls, v):
        """Validate target format (IP, CIDR, or hostname)."""
        v = v.strip()

        # Try to parse as IP address
        try:
            ipaddress.ip_address(v)
            return v
        except ValueError:
            pass

        # Try to parse as CIDR
        try:
            ipaddress.ip_network(v, strict=False)
            return v
        except ValueError:
            pass

        # Validate as hostname
        hostname_pattern = r'^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$'
        if re.match(hostname_pattern, v):
            return v

        raise ValueError(f"Invalid target format: {v}. Must be IP, CIDR, or hostname")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TargetCreate(BaseModel):
    """Create target request."""
    value: str
    tags: List[str] = Field(default_factory=list)

    @validator('value')
    def validate_target(cls, v):
        """Validate target format."""
        return Target.validate_target(v)


class TargetBulkCreate(BaseModel):
    """Bulk create targets request."""
    targets: List[str]
