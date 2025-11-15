"""Service layer for backend application.

This module provides all service classes and singleton instances for:
- Game management
- Lobby management  
- Matchmaking queue
- AI processing

Usage:
    from backend_app.services import game_service, matchmaking_service
    game = game_service.create_game(["Player1", "Player2"])
"""

from __future__ import annotations

import os

# Import exceptions and utilities
from .base import (
    ConflictError,
    NotFoundError,
    ServiceError,
    ValidationError,
    generate_id,
    normalize_name,
)

# Import service classes
from .gemini_api import AiService
from .game_service import GameService
from .lobby_service import LobbyService
from .matchmaking_service import MatchmakingService

# Create singleton instances
game_service = GameService()
lobby_service = LobbyService()
matchmaking_service = MatchmakingService(game_service)
# Initialize AI service with Gemini API key from environment
ai_service = AiService(game_service, api_key=os.getenv("GEMINI_API_KEY"))

# Export all
__all__ = [
    # Exceptions
    "ServiceError",
    "ValidationError",
    "NotFoundError",
    "ConflictError",
    # Utilities
    "normalize_name",
    "generate_id",
    # Services
    "GameService",
    "LobbyService",
    "MatchmakingService",
    "AiService",
    # Singleton instances
    "game_service",
    "lobby_service",
    "matchmaking_service",
    "ai_service",
]
