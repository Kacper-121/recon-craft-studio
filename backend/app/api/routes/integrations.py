from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.integration import SlackIntegration, DiscordIntegration, Settings, IntegrationsSettings
from app.core.database import get_database
from app.core.security import get_current_user
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.post("/slack", response_model=SlackIntegration, status_code=status.HTTP_200_OK)
async def save_slack_integration(
    slack: SlackIntegration,
    db: AsyncIOMotorDatabase = Depends(get_database),
    # current_user: dict = Depends(get_current_user)
):
    """Save Slack webhook integration."""
    # Get or create user settings
    settings_doc = await db.settings.find_one({"userId": current_user["user_id"]})

    if settings_doc:
        # Update existing
        await db.settings.update_one(
            {"userId": current_user["user_id"]},
            {"$set": {"integrations.slack": slack.dict()}}
        )
    else:
        # Create new
        settings = Settings(
            theme="dark",
            integrations=IntegrationsSettings(slack=slack)
        )
        await db.settings.insert_one({
            "userId": current_user["user_id"],
            **settings.dict()
        })

    logger.info("Slack integration saved")
    return slack


@router.get("/slack", response_model=SlackIntegration)
async def get_slack_integration(
    db: AsyncIOMotorDatabase = Depends(get_database),
    # current_user: dict = Depends(get_current_user)
):
    """Get Slack integration settings."""
    settings_doc = await db.settings.find_one({"userId": current_user["user_id"]})

    if not settings_doc or not settings_doc.get("integrations", {}).get("slack"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slack integration not configured"
        )

    return SlackIntegration(**settings_doc["integrations"]["slack"])


@router.post("/discord", response_model=DiscordIntegration, status_code=status.HTTP_200_OK)
async def save_discord_integration(
    discord: DiscordIntegration,
    db: AsyncIOMotorDatabase = Depends(get_database),
    # current_user: dict = Depends(get_current_user)
):
    """Save Discord webhook integration."""
    # Get or create user settings
    settings_doc = await db.settings.find_one({"userId": current_user["user_id"]})

    if settings_doc:
        # Update existing
        await db.settings.update_one(
            {"userId": current_user["user_id"]},
            {"$set": {"integrations.discord": discord.dict()}}
        )
    else:
        # Create new
        settings = Settings(
            theme="dark",
            integrations=IntegrationsSettings(discord=discord)
        )
        await db.settings.insert_one({
            "userId": current_user["user_id"],
            **settings.dict()
        })

    logger.info("Discord integration saved")
    return discord


@router.get("/discord", response_model=DiscordIntegration)
async def get_discord_integration(
    db: AsyncIOMotorDatabase = Depends(get_database),
    # current_user: dict = Depends(get_current_user)
):
    """Get Discord integration settings."""
    settings_doc = await db.settings.find_one({"userId": current_user["user_id"]})

    if not settings_doc or not settings_doc.get("integrations", {}).get("discord"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discord integration not configured"
        )

    return DiscordIntegration(**settings_doc["integrations"]["discord"])
