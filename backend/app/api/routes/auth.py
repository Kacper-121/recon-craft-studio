from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.auth import APIKeyCreate, APIKeyResponse, TokenRequest, TokenResponse
from app.services.auth_service import AuthService
from app.core.database import get_database
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/api-keys", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    request: APIKeyCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new API key."""
    auth_service = AuthService(db)
    api_key = await auth_service.create_api_key(request)
    return api_key


@router.post("/token", response_model=TokenResponse)
async def create_token(
    request: TokenRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Exchange API key for JWT token."""
    auth_service = AuthService(db)
    token = await auth_service.create_access_token(request.apiKey)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )

    return token
