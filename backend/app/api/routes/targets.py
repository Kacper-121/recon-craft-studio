from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
from datetime import datetime
from app.models.target import Target, TargetCreate, TargetBulkCreate
from app.core.database import get_database
from app.core.security import get_current_user
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/targets", tags=["targets"])


@router.get("", response_model=List[Target])
async def list_targets(
    db: AsyncIOMotorDatabase = Depends(get_database),
    # current_user: dict = Depends(get_current_user)
):
    """List all authorized targets."""
    targets = []
    cursor = db.targets.find()

    async for target_doc in cursor:
        targets.append(Target(**target_doc))

    logger.info("Targets listed", count=len(targets))
    return targets


@router.post("", response_model=Target, status_code=status.HTTP_201_CREATED)
async def create_target(
    target: TargetCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    # current_user: dict = Depends(get_current_user)
):
    """Add a new authorized target."""
    # Check if target already exists
    existing = await db.targets.find_one({"value": target.value})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Target already exists"
        )

    new_target = Target(
        id=str(uuid.uuid4()),
        value=target.value,
        tags=target.tags,
        createdAt=datetime.utcnow()
    )

    await db.targets.insert_one(new_target.dict())

    logger.info("Target created", target_id=new_target.id, value=target.value)
    return new_target


@router.post("/bulk", response_model=List[Target], status_code=status.HTTP_201_CREATED)
async def bulk_create_targets(
    request: TargetBulkCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    # current_user: dict = Depends(get_current_user)
):
    """Bulk import targets."""
    created_targets = []

    for target_value in request.targets:
        # Skip if already exists
        existing = await db.targets.find_one({"value": target_value})
        if existing:
            continue

        try:
            new_target = Target(
                id=str(uuid.uuid4()),
                value=target_value.strip(),
                tags=[],
                createdAt=datetime.utcnow()
            )

            await db.targets.insert_one(new_target.dict())
            created_targets.append(new_target)

        except Exception as e:
            logger.warning("Failed to create target", value=target_value, error=str(e))
            continue

    logger.info("Bulk targets created", count=len(created_targets))
    return created_targets


@router.delete("/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_target(
    target_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    # current_user: dict = Depends(get_current_user)
):
    """Delete an authorized target."""
    result = await db.targets.delete_one({"id": target_id})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target not found"
        )

    logger.info("Target deleted", target_id=target_id)
    return None
