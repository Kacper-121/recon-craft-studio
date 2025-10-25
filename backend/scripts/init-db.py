#!/usr/bin/env python
"""
Initialize database with sample data for development/testing.
"""
import asyncio
import sys
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.services.auth_service import AuthService


async def init_database():
    """Initialize the database with sample data."""
    print("🚀 Initializing ReconCraft Backend Database...")

    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]

    print(f"✅ Connected to MongoDB: {settings.MONGODB_DB_NAME}")

    # Create admin API key
    auth_service = AuthService(db)

    print("\n📝 Creating admin API key...")
    api_key = await auth_service.create_api_key({
        "userId": "admin",
        "name": "Admin Key"
    })

    print(f"""
╔════════════════════════════════════════════════════════════╗
║                    ADMIN API KEY                           ║
╠════════════════════════════════════════════════════════════╣
║  Key: {api_key.key}  ║
║  User: {api_key.userId}                                               ║
║  Name: {api_key.name}                                        ║
╠════════════════════════════════════════════════════════════╣
║  ⚠️  IMPORTANT: Save this key - it won't be shown again!   ║
╚════════════════════════════════════════════════════════════╝
    """)

    # Create sample targets
    print("\n📌 Creating sample authorized targets...")

    sample_targets = [
        {
            "id": "target-1",
            "value": "192.168.1.0/24",
            "tags": ["internal", "test"],
            "createdAt": datetime.utcnow()
        },
        {
            "id": "target-2",
            "value": "10.0.0.1",
            "tags": ["demo", "safe"],
            "createdAt": datetime.utcnow()
        }
    ]

    await db.targets.insert_many(sample_targets)
    print(f"✅ Created {len(sample_targets)} sample targets")

    # Create sample workflow
    print("\n🔧 Creating sample workflow...")

    sample_workflow = {
        "id": "workflow-demo",
        "name": "Demo Quick Scan",
        "nodes": [
            {
                "id": "start-1",
                "kind": "start",
                "label": "Start",
                "category": "utility",
                "config": {},
                "position": {"x": 0, "y": 0}
            },
            {
                "id": "nmap-1",
                "kind": "nmap",
                "label": "Network Scan",
                "category": "recon",
                "config": {
                    "scanType": "quick",
                    "ports": "1-1000"
                },
                "position": {"x": 250, "y": 0}
            },
            {
                "id": "slack-1",
                "kind": "slackAlert",
                "label": "Notify Team",
                "category": "output",
                "config": {
                    "message": "Scan completed"
                },
                "position": {"x": 500, "y": 0}
            }
        ],
        "edges": [
            {
                "id": "edge-1",
                "source": "start-1",
                "target": "nmap-1"
            },
            {
                "id": "edge-2",
                "source": "nmap-1",
                "target": "slack-1"
            }
        ],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "authorizedTargets": True
    }

    await db.workflows.insert_one(sample_workflow)
    print("✅ Created sample workflow")

    print("\n🎉 Database initialization complete!")
    print("\n📚 Next steps:")
    print("   1. Use the API key above to authenticate")
    print("   2. Access API docs: http://localhost:8000/api/docs")
    print("   3. Try the sample workflow with demo mode")
    print("\n💡 Example:")
    print(f"   export API_KEY='{api_key.key}'")
    print("   curl -X POST http://localhost:8000/api/auth/token \\")
    print("     -H 'Content-Type: application/json' \\")
    print("     -d '{\"apiKey\": \"'$API_KEY'\"}'")

    client.close()


if __name__ == "__main__":
    try:
        asyncio.run(init_database())
    except Exception as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)
