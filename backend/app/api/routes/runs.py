# app/api/routes/runs.py
import uuid
import asyncio
from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status, Body
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.logging import get_logger
from app.models.run import RunResponse, RunStatus
from app.core.database import get_database
from app.workers.run_executor import execute_run_async

logger = get_logger(__name__)
router = APIRouter()


# -------------------------------
# Inline execution (no save)
# -------------------------------
@router.post("/execute", response_model=RunResponse, status_code=status.HTTP_201_CREATED)
async def execute_inline_workflow(
    payload: Dict[str, Any] = Body(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Execute a workflow provided inline in the request body without saving it to db.workflows.

    Example body:
    {
      "workflow": {
        "id": "temp",
        "name": "Temp run",
        "nodes": [...],
        "edges": [...]
      },
      "targets": ["127.0.0.1"],
      "runMode": "demo",
      "authorizeTargets": true
    }
    """
    if "workflow" not in payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing 'workflow' in payload",
        )

    workflow_doc = payload["workflow"]
    targets = payload.get("targets", [])
    run_mode = payload.get("runMode", "demo")
    authorize = payload.get("authorizeTargets", False)

    if not isinstance(workflow_doc, dict) or not isinstance(targets, list):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload format",
        )

    run_id = str(uuid.uuid4())
    now = datetime.utcnow()

    # Build step placeholders
    steps = []
    for n in workflow_doc.get("nodes", []):
        steps.append(
            {
                "nodeId": n.get("id"),
                "name": n.get("label") or n.get("kind"),
                "status": RunStatus.QUEUED if hasattr(RunStatus, "QUEUED") else "queued",
                "logs": [],
                "findings": [],
                "startedAt": None,
                "completedAt": None,
            }
        )

    run_doc = {
        "id": run_id,
        "workflowId": workflow_doc.get("id", f"inline-{run_id}"),
        "workflowName": workflow_doc.get("name", "Inline Workflow"),
        "targets": targets,
        "runMode": run_mode,
        "authorizeTargets": authorize,
        "status": RunStatus.QUEUED if hasattr(RunStatus, "QUEUED") else "queued",
        "createdAt": now,
        "startedAt": None,
        "endedAt": None,
        "steps": steps,
    }

    await db.runs.insert_one(run_doc)

    # Start async execution
    asyncio.create_task(execute_run_async(run_id, workflow_doc, targets, run_mode))

    logger.info(
        "Inline workflow execution started",
        extra={"run_id": run_id, "workflow_name": run_doc["workflowName"]},
    )

    return RunResponse(
        runId=run_id,
        status=RunStatus.QUEUED if hasattr(RunStatus, "QUEUED") else "queued",
        message="Inline run started",
    )
