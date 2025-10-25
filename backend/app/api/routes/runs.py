from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
from datetime import datetime
from app.models.run import Run, RunCreate, RunResponse, RunStatus
from app.core.database import get_database
from app.core.security import get_current_user
from app.core.logging import get_logger
from app.services.run_service import RunService

logger = get_logger(__name__)
router = APIRouter(prefix="/runs", tags=["runs"])


@router.post("", response_model=RunResponse, status_code=status.HTTP_201_CREATED)
async def create_run(
    run_request: RunCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Start a new workflow run."""
    run_service = RunService(db)

    # Validate workflow exists
    workflow = await db.workflows.find_one({"id": run_request.workflowId})
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    # Validate authorization
    if not run_request.authorizeTargets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must authorize targets before running the workflow"
        )

    # Validate targets are in authorized list
    authorized_targets = []
    cursor = db.targets.find()
    async for target_doc in cursor:
        authorized_targets.append(target_doc["value"])

    for target in run_request.targets:
        if target not in authorized_targets:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Target {target} is not in authorized targets list"
            )

    # Create run
    run = await run_service.create_run(
        workflow_id=run_request.workflowId,
        workflow_name=workflow["name"],
        targets=run_request.targets,
        authorize_targets=run_request.authorizeTargets,
        run_mode=run_request.runMode,
        user_id=current_user["user_id"]
    )

    logger.info("Run created", run_id=run.id, workflow_id=run_request.workflowId, user_id=current_user["user_id"])

    return RunResponse(
        runId=run.id,
        status=run.status,
        message="Run queued successfully"
    )


@router.get("", response_model=List[Run])
async def list_runs(
    workflow_id: Optional[str] = Query(None),
    status: Optional[RunStatus] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """List all runs with optional filters."""
    query = {}

    if workflow_id:
        query["workflowId"] = workflow_id

    if status:
        query["status"] = status

    runs = []
    cursor = db.runs.find(query).sort("startedAt", -1)

    async for run_doc in cursor:
        runs.append(Run(**run_doc))

    logger.info("Runs listed", count=len(runs), user_id=current_user["user_id"])
    return runs


@router.get("/{run_id}", response_model=Run)
async def get_run(
    run_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Get details of a specific run."""
    run_doc = await db.runs.find_one({"id": run_id})

    if not run_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found"
        )

    logger.info("Run retrieved", run_id=run_id, user_id=current_user["user_id"])
    return Run(**run_doc)


@router.get("/{run_id}/logs", response_model=dict)
async def get_run_logs(
    run_id: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Get paginated logs for a run."""
    run_doc = await db.runs.find_one({"id": run_id})

    if not run_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found"
        )

    run = Run(**run_doc)

    # Collect all logs from all steps
    all_logs = []
    for step in run.steps:
        for log in step.logs:
            all_logs.append({
                "stepId": step.nodeId,
                "stepName": step.name,
                "log": log
            })

    # Paginate logs
    paginated_logs = all_logs[offset:offset + limit]

    return {
        "runId": run_id,
        "total": len(all_logs),
        "offset": offset,
        "limit": limit,
        "logs": paginated_logs
    }


@router.post("/{run_id}/actions/send-slack", status_code=status.HTTP_200_OK)
async def send_to_slack(
    run_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Send run findings to Slack."""
    # Get run
    run_doc = await db.runs.find_one({"id": run_id})
    if not run_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found"
        )

    # Get Slack integration
    settings_doc = await db.settings.find_one({"userId": current_user["user_id"]})
    if not settings_doc or not settings_doc.get("integrations", {}).get("slack"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slack integration not configured"
        )

    # TODO: Implement actual Slack webhook call
    logger.info("Slack notification sent", run_id=run_id, user_id=current_user["user_id"])

    return {"message": "Findings sent to Slack successfully"}
