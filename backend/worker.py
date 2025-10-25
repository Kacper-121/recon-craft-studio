"""
RQ Worker entry point.
Run this script to start a worker that processes queued jobs.
"""
from redis import Redis
from rq import Worker, Queue, Connection
from app.core.config import settings
from app.core.logging import setup_logging, get_logger

setup_logging()
logger = get_logger(__name__)


def main():
    """Start RQ worker."""
    redis_conn = Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None
    )

    logger.info("Starting RQ worker", queue=settings.RQ_QUEUE_NAME)

    with Connection(redis_conn):
        worker = Worker([settings.RQ_QUEUE_NAME])
        worker.work(with_scheduler=True)


if __name__ == "__main__":
    main()
