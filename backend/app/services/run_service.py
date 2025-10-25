from typing import List
from datetime import datetime
import uuid
from motor.motor_asyncio import AsyncIOMotorDatabase
from redis import Redis
from rq import Queue
from app.models.run import Run, RunStatus, RunStep, StepStatus
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class RunService:
    """Service for managing workflow runs."""

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
        """Create a new run and queue it for execution."""
        run_id = str(uuid.uuid4())

        # Get workflow to initialize steps
        workflow_doc = await self.db.workflows.find_one({"id": workflow_id})

        # Initialize steps from workflow nodes
        steps = []
        for node in workflow_doc.get("nodes", []):
            step = RunStep(
                nodeId=node["id"],
                name=node["label"],
                status=StepStatus.PENDING,
                logs=[],
                findings=[]
            )
            steps.append(step)

        # Create run object
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

        # Save to database
        await self.runs_collection.insert_one(run.dict())

        # Queue the run for execution
        try:
            redis_conn = Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None
            )
            queue = Queue(settings.RQ_QUEUE_NAME, connection=redis_conn)

            # Enqueue the job
            queue.enqueue(
                'app.workers.run_executor.execute_run',
                run_id,
                workflow_doc,
                targets,
                run_mode,
                job_timeout='1h',
                result_ttl=settings.RQ_RESULT_TTL
            )

            logger.info("Run queued for execution", run_id=run_id, workflow_id=workflow_id)

        except Exception as e:
            logger.error("Failed to queue run", run_id=run_id, error=str(e))
            # Update run status to failed
            await self.runs_collection.update_one(
                {"id": run_id},
                {"$set": {"status": RunStatus.FAILED, "error": str(e)}}
            )
            raise

        return run

    async def update_run_status(self, run_id: str, status: RunStatus, error: str = None):
        """Update the status of a run."""
        update_data = {"status": status}

        if status in [RunStatus.SUCCEEDED, RunStatus.FAILED]:
            update_data["endedAt"] = datetime.utcnow()

        if error:
            update_data["error"] = error

        await self.runs_collection.update_one(
            {"id": run_id},
            {"$set": update_data}
        )

        logger.info("Run status updated", run_id=run_id, status=status)

    async def add_step_log(self, run_id: str, step_id: str, log: str):
        """Add a log entry to a specific step."""
        await self.runs_collection.update_one(
            {"id": run_id, "steps.nodeId": step_id},
            {"$push": {"steps.$.logs": log}}
        )

    async def update_step_status(self, run_id: str, step_id: str, status: StepStatus, error: str = None):
        """Update the status of a specific step."""
        update_data = {"steps.$.status": status}

        if status == StepStatus.RUNNING:
            update_data["steps.$.startedAt"] = datetime.utcnow()
        elif status in [StepStatus.SUCCEEDED, StepStatus.FAILED]:
            update_data["steps.$.completedAt"] = datetime.utcnow()

        if error:
            update_data["steps.$.error"] = error

        await self.runs_collection.update_one(
            {"id": run_id, "steps.nodeId": step_id},
            {"$set": update_data}
        )

        logger.info("Step status updated", run_id=run_id, step_id=step_id, status=status)
