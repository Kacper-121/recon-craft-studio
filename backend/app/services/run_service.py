# app/services/run_service.py
import asyncio
import uuid
from datetime import datetime
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.run import Run, RunStatus, RunStep, StepStatus
from app.core.logging import get_logger
from app.workers.run_executor import execute_run_async  # we'll reuse the same async runner

logger = get_logger(__name__)

class RunService:
    """Service for managing workflow runs without external workers."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.runs_collection = db.runs

    async def create_run(
        self,
        workflow_id: str,
        workflow_name: str,
        targets: List[str],
        authorize_targets: bool,
        run_mode: str,
        user_id: str
    ) -> Run:
        """Create a run and execute it in background."""
        run_id = str(uuid.uuid4())

        # Fetch workflow and init steps
        workflow_doc = await self.db.workflows.find_one({"id": workflow_id})
        steps = [
            RunStep(
                nodeId=node["id"],
                name=node["label"],
                status=StepStatus.PENDING,
                logs=[],
                findings=[]
            )
            for node in workflow_doc.get("nodes", [])
        ]

        run = Run(
            id=run_id,
            workflowId=workflow_id,
            workflowName=workflow_name,
            status=RunStatus.QUEUED,
            targets=targets,
            authorizeTargets=authorize_targets,
            runMode=run_mode,
            startedAt=datetime.utcnow(),
            steps=steps,
            userId=user_id
        )

        await self.runs_collection.insert_one(run.dict())
        logger.info("Run created", run_id=run_id)

        # 🔹 Start async background task (non-blocking)
        asyncio.create_task(
            execute_run_async(run_id, workflow_doc, targets, run_mode)
        )

        return run
