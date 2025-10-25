import pytest
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from httpx import AsyncClient
from app.main import app
from app.core.config import settings


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def test_db():
    """Create a test database connection."""
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[f"{settings.MONGODB_DB_NAME}_test"]

    yield db

    # Cleanup
    await client.drop_database(f"{settings.MONGODB_DB_NAME}_test")
    client.close()


@pytest.fixture
async def client():
    """Create a test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def sample_workflow():
    """Sample workflow for testing."""
    return {
        "name": "Test Workflow",
        "nodes": [
            {
                "id": "1",
                "kind": "start",
                "label": "Start",
                "category": "utility",
                "config": {},
                "position": {"x": 0, "y": 0}
            },
            {
                "id": "2",
                "kind": "nmap",
                "label": "Nmap Scan",
                "category": "recon",
                "config": {"scanType": "quick"},
                "position": {"x": 200, "y": 0}
            }
        ],
        "edges": [
            {
                "id": "e1-2",
                "source": "1",
                "target": "2"
            }
        ],
        "authorizedTargets": True
    }


@pytest.fixture
def sample_target():
    """Sample target for testing."""
    return {
        "value": "192.168.1.1",
        "tags": ["test", "internal"]
    }
