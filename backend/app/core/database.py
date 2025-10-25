from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class DatabaseManager:
    """MongoDB database manager using Motor (async)."""

    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None

    async def connect(self):
        """Connect to MongoDB."""
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URI)

            # Extract DB name from URI (fallback to 'reconcraft')
            db_name = settings.MONGODB_URI.rsplit("/", 1)[-1].split("?")[0] or "reconcraft"
            self.db = self.client[db_name]

            # Test the connection
            await self.client.admin.command("ping")
            logger.info("Connected to MongoDB", database=db_name)

            # Create indexes
            await self.create_indexes()

        except Exception as e:
            logger.error("Failed to connect to MongoDB", error=str(e))
            raise

    async def disconnect(self):
        """Disconnect from MongoDB."""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")

    async def create_indexes(self):
        """Create database indexes for better performance."""
        if self.db is None:
            return

        await self.db.workflows.create_index("id", unique=True)
        await self.db.workflows.create_index("createdAt")
        await self.db.workflows.create_index("updatedAt")

        await self.db.runs.create_index("id", unique=True)
        await self.db.runs.create_index("workflowId")
        await self.db.runs.create_index("status")
        await self.db.runs.create_index("startedAt")

        await self.db.targets.create_index("id", unique=True)
        await self.db.targets.create_index("value", unique=True)
        await self.db.targets.create_index("tags")

        await self.db.api_keys.create_index("key", unique=True)
        await self.db.api_keys.create_index("userId")

        await self.db.audit_logs.create_index("timestamp")
        await self.db.audit_logs.create_index("userId")
        await self.db.audit_logs.create_index("action")

        logger.info("Database indexes created")


# Global database instance
db_manager = DatabaseManager()


async def get_database() -> AsyncIOMotorDatabase:
    """Get the database instance."""
    if db_manager.db is None:
        raise RuntimeError("Database not initialized")
    return db_manager.db
