from __future__ import annotations

from typing import Any, Dict

from .extensions import socketio


def _emit(namespace: str, event: str, payload: Dict[str, Any]) -> None:
    socketio.emit(event, payload, namespace=namespace)


def lobby_namespace(lobby_id: str) -> str:
    return f"/ws/lobby/{lobby_id}"


def emit_lobby_event(lobby_id: str, event: str, payload: Dict[str, Any]) -> None:
    _emit(lobby_namespace(lobby_id), event, payload)


def game_namespace(game_id: str) -> str:
    return f"/ws/game/{game_id}"


def emit_game_event(game_id: str, event: str, payload: Dict[str, Any]) -> None:
    _emit(game_namespace(game_id), event, payload)

