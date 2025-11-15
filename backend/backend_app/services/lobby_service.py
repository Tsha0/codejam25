"""Lobby service for managing player lobbies."""

from __future__ import annotations

from dataclasses import replace
from threading import Lock
from typing import Dict, Optional, Tuple

from ..events import emit_lobby_event
from ..schemas import Lobby, utc_now
from .base import ConflictError, NotFoundError, ValidationError, generate_id, normalize_name


class LobbyService:
    """Service for managing 2-player lobbies.
    
    Handles lobby creation, joining, leaving, readiness, and starting games.
    """
    
    def __init__(self) -> None:
        self._lobbies: Dict[str, Lobby] = {}
        self._lock = Lock()

    def create_lobby(self, host_name: str) -> Lobby:
        """Create a new lobby with a host.
        
        Args:
            host_name: Name of the lobby host
            
        Returns:
            The created lobby
            
        Raises:
            ValidationError: If host name is invalid
        """
        host = normalize_name(host_name, field="host_name")
        lobby_id = generate_id("lobby")
        timestamp = utc_now()
        
        lobby = Lobby(
            id=lobby_id,
            host=host,
            players=[host],
            ready_state={host: False},
            status="waiting",
            created_at=timestamp,
            updated_at=timestamp,
        )
        
        with self._lock:
            self._lobbies[lobby_id] = lobby

        emit_lobby_event(lobby_id, "player_joined", {"lobby": lobby.to_dict(), "player": host})
        return lobby

    def join_lobby(self, lobby_id: str, player_name: str) -> Lobby:
        """Join an existing lobby.
        
        Args:
            lobby_id: The lobby ID
            player_name: Name of joining player
            
        Returns:
            The updated lobby
            
        Raises:
            NotFoundError: If lobby doesn't exist
            ConflictError: If player already in lobby or lobby is full
            ValidationError: If player name is invalid
        """
        player = normalize_name(player_name, field="player_name")
        
        with self._lock:
            lobby = self._lobbies.get(lobby_id)
            if not lobby:
                raise NotFoundError("Lobby not found.")
            if player in lobby.players:
                raise ConflictError("Player already in lobby.")
            if lobby.is_full:
                raise ConflictError("Lobby is full.")

            lobby.players.append(player)
            lobby.ready_state[player] = False
            lobby.status = "full"
            lobby = replace(
                lobby, 
                players=list(lobby.players), 
                ready_state=dict(lobby.ready_state), 
                status=lobby.status, 
                updated_at=utc_now()
            )
            self._lobbies[lobby_id] = lobby

        emit_lobby_event(lobby_id, "player_joined", {"lobby": lobby.to_dict(), "player": player})
        if lobby.is_full:
            emit_lobby_event(lobby_id, "lobby_full", {"lobby": lobby.to_dict()})
        return lobby

    def leave_lobby(self, lobby_id: str, player_name: str) -> Tuple[Optional[Lobby], bool]:
        """Leave a lobby.
        
        Args:
            lobby_id: The lobby ID
            player_name: Name of leaving player
            
        Returns:
            Tuple of (lobby or None if deleted, was_deleted)
            
        Raises:
            NotFoundError: If lobby doesn't exist
            ValidationError: If player not in lobby
        """
        player = normalize_name(player_name, field="player_name")
        
        with self._lock:
            lobby = self._lobbies.get(lobby_id)
            if not lobby:
                raise NotFoundError("Lobby not found.")
            if player not in lobby.players:
                raise ValidationError("Player not part of this lobby.")

            lobby.players = [p for p in lobby.players if p != player]
            lobby.ready_state.pop(player, None)
            deleted = False

            if player == lobby.host or not lobby.players:
                deleted = True
                self._lobbies.pop(lobby_id, None)
            else:
                lobby.status = "waiting" if not lobby.is_full else "full"
                lobby = replace(
                    lobby,
                    players=list(lobby.players),
                    ready_state=dict(lobby.ready_state),
                    status=lobby.status,
                    updated_at=utc_now(),
                )
                self._lobbies[lobby_id] = lobby

        emit_lobby_event(lobby_id, "player_left", {"lobbyId": lobby_id, "player": player})
        return (lobby if not deleted else None, deleted)

    def toggle_ready(self, lobby_id: str, player_name: str) -> Lobby:
        """Toggle a player's ready state.
        
        Args:
            lobby_id: The lobby ID
            player_name: Name of player
            
        Returns:
            The updated lobby
            
        Raises:
            NotFoundError: If lobby doesn't exist
            ValidationError: If player not in lobby
        """
        player = normalize_name(player_name, field="player_name")
        
        with self._lock:
            lobby = self._lobbies.get(lobby_id)
            if not lobby:
                raise NotFoundError("Lobby not found.")
            if player not in lobby.players:
                raise ValidationError("Player not part of this lobby.")

            current = lobby.ready_state.get(player, False)
            lobby.ready_state[player] = not current
            lobby.status = "ready" if lobby.everyone_ready else ("full" if lobby.is_full else "waiting")
            lobby = replace(
                lobby,
                ready_state=dict(lobby.ready_state),
                status=lobby.status,
                updated_at=utc_now(),
            )
            self._lobbies[lobby_id] = lobby

        emit_lobby_event(
            lobby_id, 
            "player_ready", 
            {"lobby": lobby.to_dict(), "player": player, "ready": lobby.ready_state[player]}
        )
        return lobby

    def start_lobby(self, lobby_id: str, host_name: str) -> Lobby:
        """Start the game (host only).
        
        Args:
            lobby_id: The lobby ID
            host_name: Name of host
            
        Returns:
            The updated lobby
            
        Raises:
            NotFoundError: If lobby doesn't exist
            ValidationError: If requester is not host
            ConflictError: If players not all ready
        """
        host = normalize_name(host_name, field="host_name")
        
        with self._lock:
            lobby = self._lobbies.get(lobby_id)
            if not lobby:
                raise NotFoundError("Lobby not found.")
            if host != lobby.host:
                raise ValidationError("Only the host can start the lobby.")
            if not lobby.everyone_ready:
                raise ConflictError("Both players must be ready before starting.")

            lobby.status = "starting"
            lobby = replace(lobby, status=lobby.status, updated_at=utc_now())
            self._lobbies[lobby_id] = lobby

        return lobby

    def mark_started(self, lobby_id: str) -> Lobby:
        """Mark lobby as started.
        
        Args:
            lobby_id: The lobby ID
            
        Returns:
            The updated lobby
            
        Raises:
            NotFoundError: If lobby doesn't exist
        """
        with self._lock:
            lobby = self._lobbies.get(lobby_id)
            if not lobby:
                raise NotFoundError("Lobby not found.")
            lobby.status = "started"
            lobby = replace(lobby, status=lobby.status, updated_at=utc_now())
            self._lobbies[lobby_id] = lobby
        return lobby

    def get_lobby(self, lobby_id: str) -> Lobby:
        """Get lobby by ID.
        
        Args:
            lobby_id: The lobby ID
            
        Returns:
            The lobby
            
        Raises:
            NotFoundError: If lobby doesn't exist
        """
        with self._lock:
            lobby = self._lobbies.get(lobby_id)
        if not lobby:
            raise NotFoundError("Lobby not found.")
        return lobby
