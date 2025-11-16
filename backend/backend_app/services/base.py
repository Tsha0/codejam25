"""Base utilities and exceptions for services."""

from __future__ import annotations

import re
from uuid import uuid4


class ServiceError(Exception):
    """Base class for service errors."""


class ValidationError(ServiceError):
    """Raised when input fails validation."""


class NotFoundError(ServiceError):
    """Raised when a document is missing."""


class ConflictError(ServiceError):
    """Raised when an operation cannot be completed due to state."""


def normalize_name(value: str, field: str = "name") -> str:
    """Normalize and validate a name field.
    
    Args:
        value: The name to validate
        field: The field name for error messages
        
    Returns:
        The normalized name
        
    Raises:
        ValidationError: If name is invalid
    """
    if value is None or not isinstance(value, str):
        raise ValidationError(f"{field} is required.")
    cleaned = re.sub(r"\s+", " ", value).strip()
    if not (1 <= len(cleaned) <= 64):
        raise ValidationError(f"{field} must be 1-64 characters.")
    return cleaned


def generate_id(prefix: str) -> str:
    """Generate a unique ID with a prefix.
    
    Args:
        prefix: The prefix for the ID (e.g., 'game', 'lobby')
        
    Returns:
        A unique ID string like 'game_abc12345'
    """
    return f"{prefix}_{uuid4().hex[:8]}"
