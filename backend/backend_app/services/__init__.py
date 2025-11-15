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
from .gemini_api import AiService, ExternalServiceError
from .game_service import GameService
from .lobby_service import LobbyService
from .matchmaking_service import MatchmakingService

# Create singleton instances
import os
from pathlib import Path

# Load .env file if it exists (before reading environment variables)
try:
    from dotenv import load_dotenv
    # Try loading from multiple locations (in order of preference)
    # 1. Backend directory (backend/.env)
    backend_dir = Path(__file__).parent.parent.parent
    env_file = backend_dir / ".env"
    if env_file.exists():
        load_dotenv(env_file, override=False)
    
    # 2. Project root (codejam25/.env)
    project_root = backend_dir.parent
    env_file = project_root / ".env"
    if env_file.exists():
        load_dotenv(env_file, override=False)
    
    # 3. Current working directory
    load_dotenv(override=False)
except ImportError:
    # python-dotenv not installed, skip .env loading
    pass

game_service = GameService()
lobby_service = LobbyService()
matchmaking_service = MatchmakingService(game_service)

# Get Gemini API key from environment variables
_gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if _gemini_api_key:
    _gemini_api_key = _gemini_api_key.strip()
    if not _gemini_api_key:
        _gemini_api_key = None
ai_service = AiService(game_service, api_key=_gemini_api_key)
# Export all
__all__ = [
    # Exceptions
    "ServiceError",
    "ValidationError",
    "NotFoundError",
    "ConflictError",
    "ExternalServiceError",
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
