from typing import Optional
from datetime import datetime, timedelta
import secrets
import uuid
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.auth import APIKey, APIKeyCreate, APIKeyResponse, TokenResponse, AuditLog
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.logging import get_logger

logger = get_logger(__name__)


class AuthService:
    """Authentication service."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.api_keys_collection = db.api_keys
        self.audit_logs_collection = db.audit_logs

    async def create_api_key(self, request: APIKeyCreate) -> APIKeyResponse:
        """Create a new API key."""
        # Generate a secure API key
        raw_key = f"rcs_{secrets.token_urlsafe(32)}"
        hashed_key = get_password_hash(raw_key)

        api_key = APIKey(
            id=str(uuid.uuid4()),
            key=hashed_key,
            userId=request.userId,
            name=request.name,
            createdAt=datetime.utcnow(),
            isActive=True
        )

        # Store in database
        await self.api_keys_collection.insert_one(api_key.dict())

        logger.info("API key created", user_id=request.userId, key_id=api_key.id)

        # Return response with plain text key (only shown once)
        return APIKeyResponse(
            id=api_key.id,
            key=raw_key,
            userId=api_key.userId,
            name=api_key.name,
            createdAt=api_key.createdAt
        )

    async def verify_api_key(self, api_key: str) -> Optional[APIKey]:
        """Verify an API key and return the associated key object."""
        # Find all active keys
        cursor = self.api_keys_collection.find({"isActive": True})

        async for key_doc in cursor:
            if verify_password(api_key, key_doc["key"]):
                # Update last used timestamp
                await self.api_keys_collection.update_one(
                    {"id": key_doc["id"]},
                    {"$set": {"lastUsedAt": datetime.utcnow()}}
                )

                return APIKey(**key_doc)

        return None

    async def create_access_token(self, api_key: str) -> Optional[TokenResponse]:
        """Create JWT token from API key."""
        verified_key = await self.verify_api_key(api_key)

        if not verified_key:
            return None

        # Create JWT token
        access_token = create_access_token(
            data={"sub": verified_key.userId, "api_key": api_key}
        )

        logger.info("Access token created", user_id=verified_key.userId)

        return TokenResponse(
            accessToken=access_token,
            tokenType="bearer",
            expiresIn=30 * 60  # 30 minutes
        )

    async def log_audit_event(
        self,
        user_id: str,
        action: str,
        resource: str,
        resource_id: Optional[str] = None,
        details: dict = None,
        ip_address: Optional[str] = None
    ):
        """Log an audit event."""
        audit_log = AuditLog(
            id=str(uuid.uuid4()),
            userId=user_id,
            action=action,
            resource=resource,
            resourceId=resource_id,
            details=details or {},
            timestamp=datetime.utcnow(),
            ipAddress=ip_address
        )

        await self.audit_logs_collection.insert_one(audit_log.dict())

        logger.info(
            "Audit event logged",
            user_id=user_id,
            action=action,
            resource=resource
        )
