"""Service layer exports for backward compatibility.

This module re-exports all services from the services/ folder.
All new code should import from services/ directly, but this
maintains compatibility with existing code.

Deprecated: Import from backend_app.services directly instead.
"""

from __future__ import annotations

# Re-export everything from services module
from .services import (
    AiService,
    ConflictError,
    ExternalServiceError,
    GameService,
    LobbyService,
    MatchmakingService,
    NotFoundError,
    ServiceError,
    ValidationError,
    ai_service,
    game_service,
    generate_id,
    lobby_service,
    matchmaking_service,
    normalize_name,
)

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
    # Service classes
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
