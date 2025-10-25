from pydantic import BaseModel, Field, HttpUrl
from typing import Optional
from enum import Enum


class IntegrationType(str, Enum):
    """Integration types."""
    SLACK = "slack"
    DISCORD = "discord"


class Integration(BaseModel):
    """Integration configuration."""
    type: IntegrationType
    webhookUrl: HttpUrl
    enabled: bool = True


class SlackIntegration(BaseModel):
    """Slack integration settings."""
    webhookUrl: HttpUrl
    enabled: bool = True


class DiscordIntegration(BaseModel):
    """Discord integration settings."""
    webhookUrl: HttpUrl
    enabled: bool = True


class IntegrationsSettings(BaseModel):
    """All integrations settings."""
    slack: Optional[SlackIntegration] = None
    discord: Optional[DiscordIntegration] = None


class Settings(BaseModel):
    """User settings."""
    theme: str = "dark"
    integrations: IntegrationsSettings = Field(default_factory=IntegrationsSettings)
