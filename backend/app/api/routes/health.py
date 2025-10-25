from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from redis import Redis
from app.core.database import get_database
from app.core.config import settings
from app.core.logging import get_logger
from datetime import datetime

logger = get_logger(__name__)
router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Health check endpoint."""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.APP_NAME,
        "version": settings.API_VERSION,
        "checks": {}
    }

    # Check MongoDB
    try:
        await db.client.admin.command('ping')
        health_status["checks"]["mongodb"] = "healthy"
    except Exception as e:
        health_status["checks"]["mongodb"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    # Check Redis
    try:
        redis_conn = Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
            socket_connect_timeout=2
        )
        redis_conn.ping()
        health_status["checks"]["redis"] = "healthy"
    except Exception as e:
        health_status["checks"]["redis"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    return health_status


@router.get("/metrics")
async def get_metrics(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get basic application metrics."""
    metrics = {
        "timestamp": datetime.utcnow().isoformat(),
        "counters": {}
    }

    # Count workflows
    workflows_count = await db.workflows.count_documents({})
    metrics["counters"]["workflows_total"] = workflows_count

    # Count runs by status
    runs_total = await db.runs.count_documents({})
    runs_queued = await db.runs.count_documents({"status": "queued"})
    runs_running = await db.runs.count_documents({"status": "running"})
    runs_succeeded = await db.runs.count_documents({"status": "succeeded"})
    runs_failed = await db.runs.count_documents({"status": "failed"})

    metrics["counters"]["runs_total"] = runs_total
    metrics["counters"]["runs_queued"] = runs_queued
    metrics["counters"]["runs_running"] = runs_running
    metrics["counters"]["runs_succeeded"] = runs_succeeded
    metrics["counters"]["runs_failed"] = runs_failed

    # Count targets
    targets_count = await db.targets.count_documents({})
    metrics["counters"]["targets_total"] = targets_count

    # Count API keys
    api_keys_count = await db.api_keys.count_documents({"isActive": True})
    metrics["counters"]["api_keys_active"] = api_keys_count

    # Calculate success rate
    if runs_total > 0:
        success_rate = (runs_succeeded / runs_total) * 100
        metrics["success_rate"] = round(success_rate, 2)
    else:
        metrics["success_rate"] = 0.0

    return metrics
