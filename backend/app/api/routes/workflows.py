from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
from datetime import datetime
from app.models.workflow import Workflow, WorkflowCreate, WorkflowUpdate
from app.core.database import get_database
from app.core.security import get_current_user
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("", response_model=List[Workflow])
async def list_workflows(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """List all workflows."""
    workflows = []
    cursor = db.workflows.find()

    async for workflow_doc in cursor:
        workflows.append(Workflow(**workflow_doc))

    logger.info("Workflows listed", count=len(workflows), user_id=current_user["user_id"])
    return workflows


@router.get("/{workflow_id}", response_model=Workflow)
async def get_workflow(
    workflow_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific workflow."""
    workflow_doc = await db.workflows.find_one({"id": workflow_id})

    if not workflow_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    logger.info("Workflow retrieved", workflow_id=workflow_id, user_id=current_user["user_id"])
    return Workflow(**workflow_doc)


@router.post("", response_model=Workflow, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow: WorkflowCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Create or update a workflow."""
    now = datetime.utcnow()

    # Check if workflow with same name exists
    existing = await db.workflows.find_one({"name": workflow.name})

    if existing:
        # Update existing workflow
        workflow_id = existing["id"]
        updated_workflow = Workflow(
            id=workflow_id,
            name=workflow.name,
            nodes=workflow.nodes,
            edges=workflow.edges,
            createdAt=existing["createdAt"],
            updatedAt=now,
            authorizedTargets=workflow.authorizedTargets
        )

        await db.workflows.update_one(
            {"id": workflow_id},
            {"$set": updated_workflow.dict()}
        )

        logger.info("Workflow updated", workflow_id=workflow_id, user_id=current_user["user_id"])
        return updated_workflow
    else:
        # Create new workflow
        new_workflow = Workflow(
            id=str(uuid.uuid4()),
            name=workflow.name,
            nodes=workflow.nodes,
            edges=workflow.edges,
            createdAt=now,
            updatedAt=now,
            authorizedTargets=workflow.authorizedTargets
        )

        await db.workflows.insert_one(new_workflow.dict())

        logger.info("Workflow created", workflow_id=new_workflow.id, user_id=current_user["user_id"])
        return new_workflow


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Delete a workflow."""
    result = await db.workflows.delete_one({"id": workflow_id})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    logger.info("Workflow deleted", workflow_id=workflow_id, user_id=current_user["user_id"])
    return None


@router.post("/{workflow_id}/duplicate", response_model=Workflow, status_code=status.HTTP_201_CREATED)
async def duplicate_workflow(
    workflow_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Duplicate a workflow."""
    # Get original workflow
    workflow_doc = await db.workflows.find_one({"id": workflow_id})

    if not workflow_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    # Create duplicate with new ID and name
    now = datetime.utcnow()
    duplicated = Workflow(
        id=str(uuid.uuid4()),
        name=f"{workflow_doc['name']} (Copy)",
        nodes=workflow_doc['nodes'],
        edges=workflow_doc['edges'],
        createdAt=now,
        updatedAt=now,
        authorizedTargets=workflow_doc.get('authorizedTargets', False)
    )

    await db.workflows.insert_one(duplicated.dict())

    logger.info("Workflow duplicated", original_id=workflow_id, new_id=duplicated.id, user_id=current_user["user_id"])
    return duplicated
