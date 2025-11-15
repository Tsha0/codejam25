from __future__ import annotations

import re
from dataclasses import replace
from threading import Lock
from typing import Dict, List, Optional, Tuple
from uuid import uuid4

from .events import emit_game_event, emit_lobby_event
from .schemas import Game, Lobby, utc_now


class ServiceError(Exception):
    """Base class for service errors."""


class ValidationError(ServiceError):
    """Raised when input fails validation."""


class NotFoundError(ServiceError):
    """Raised when a document is missing."""


class ConflictError(ServiceError):
    """Raised when an operation cannot be completed due to state."""


def _normalize_name(value: str, field: str = "name") -> str:
    if value is None or not isinstance(value, str):
        raise ValidationError(f"{field} is required.")
    cleaned = re.sub(r"\s+", " ", value).strip()
    if not (2 <= len(cleaned) <= 64):
        raise ValidationError(f"{field} must be 2-64 characters.")
    return cleaned


def _generate_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:8]}"


class LobbyService:
    def __init__(self) -> None:
        self._lobbies: Dict[str, Lobby] = {}
        self._lock = Lock()

    def create_lobby(self, host_name: str) -> Lobby:
        host = _normalize_name(host_name, field="host_name")
        lobby_id = _generate_id("lobby")
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
        player = _normalize_name(player_name, field="player_name")
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
            lobby = replace(lobby, players=list(lobby.players), ready_state=dict(lobby.ready_state), status=lobby.status, updated_at=utc_now())
            self._lobbies[lobby_id] = lobby

        emit_lobby_event(lobby_id, "player_joined", {"lobby": lobby.to_dict(), "player": player})
        if lobby.is_full:
            emit_lobby_event(lobby_id, "lobby_full", {"lobby": lobby.to_dict()})
        return lobby

    def leave_lobby(self, lobby_id: str, player_name: str) -> Tuple[Optional[Lobby], bool]:
        player = _normalize_name(player_name, field="player_name")
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
        player = _normalize_name(player_name, field="player_name")
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

        emit_lobby_event(lobby_id, "player_ready", {"lobby": lobby.to_dict(), "player": player, "ready": lobby.ready_state[player]})
        return lobby

    def start_lobby(self, lobby_id: str, host_name: str) -> Lobby:
        host = _normalize_name(host_name, field="host_name")
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
        with self._lock:
            lobby = self._lobbies.get(lobby_id)
            if not lobby:
                raise NotFoundError("Lobby not found.")
            lobby.status = "started"
            lobby = replace(lobby, status=lobby.status, updated_at=utc_now())
            self._lobbies[lobby_id] = lobby
        return lobby

    def get_lobby(self, lobby_id: str) -> Lobby:
        with self._lock:
            lobby = self._lobbies.get(lobby_id)
        if not lobby:
            raise NotFoundError("Lobby not found.")
        return lobby


class GameService:
    def __init__(self) -> None:
        self._games: Dict[str, Game] = {}
        self._lock = Lock()

    def create_game(self, players: List[str], *, assigned_image: Optional[str] = None, source: str = "manual") -> Game:
        if not isinstance(players, list) or len(players) != 2:
            raise ValidationError("Exactly two players are required.")
        normalized_players = [_normalize_name(player, field="player_name") for player in players]
        game_id = _generate_id("game")
        timestamp = utc_now()
        game = Game(
            id=game_id,
            players=normalized_players,
            assigned_image=assigned_image,
            status="pending",
            created_at=timestamp,
            updated_at=timestamp,
            source=source,
        )
        with self._lock:
            self._games[game_id] = game

        emit_game_event(game_id, "game_created", {"game": game.to_dict()})
        return game

    def get_game(self, game_id: str) -> Game:
        with self._lock:
            game = self._games.get(game_id)
        if not game:
            raise NotFoundError("Game not found.")
        return game

    def record_prompt(self, game_id: str, player_name: str, prompt: str) -> Game:
        player = _normalize_name(player_name, field="player_name")
        if prompt is None or not isinstance(prompt, str):
            raise ValidationError("Prompt is required.")
        cleaned_prompt = prompt.strip()
        if not cleaned_prompt:
            raise ValidationError("Prompt cannot be empty.")

        with self._lock:
            game = self._games.get(game_id)
            if not game:
                raise NotFoundError("Game not found.")
            canonical_player = self._canonical_player(game, player)
            game.prompts[canonical_player] = cleaned_prompt
            game = replace(
                game,
                prompts=dict(game.prompts),
                updated_at=utc_now(),
            )
            self._games[game_id] = game

        emit_game_event(game_id, "prompt_submitted", {"gameId": game_id, "player": canonical_player})
        return game

    def mark_processing(self, game_id: str) -> Game:
        with self._lock:
            game = self._games.get(game_id)
            if not game:
                raise NotFoundError("Game not found.")
            if game.status == "completed":
                return game
            game.status = "processing"
            game = replace(game, status=game.status, updated_at=utc_now())
            self._games[game_id] = game
        emit_game_event(game_id, "game_processing", {"game": game.to_dict()})
        return game

    def complete_game(
        self,
        game_id: str,
        *,
        outputs: Optional[Dict[str, str]] = None,
        scores: Optional[Dict[str, float]] = None,
        winner: Optional[str] = None,
        status: str = "completed",
    ) -> Game:
        with self._lock:
            game = self._games.get(game_id)
            if not game:
                raise NotFoundError("Game not found.")

            if outputs:
                for player in outputs:
                    self._canonical_player(game, player)
                game.outputs.update(outputs)
            if scores:
                for player in scores:
                    self._canonical_player(game, player)
                game.scores.update(scores)
            if winner:
                canonical = self._canonical_player(game, winner)
            else:
                canonical = winner

            game.status = status
            game.winner = canonical
            game = replace(
                game,
                outputs=dict(game.outputs),
                scores=dict(game.scores),
                winner=canonical,
                status=game.status,
                updated_at=utc_now(),
            )
            self._games[game_id] = game

        emit_game_event(game_id, "game_completed", {"game": game.to_dict()})
        return game

    def _canonical_player(self, game: Game, player_name: str) -> str:
        for player in game.players:
            if player.lower() == player_name.lower():
                return player
        raise ValidationError("Player is not part of this game.")


class MatchmakingService:
    def __init__(self, game_service: GameService) -> None:
        self._queue: List[str] = []
        self._lock = Lock()
        self._game_service = game_service

    def join_queue(self, player_name: str) -> Dict[str, object]:
        player = _normalize_name(player_name, field="player_name")
        with self._lock:
            if player in self._queue:
                position = self._queue.index(player) + 1
                return {"status": "queued", "position": position}

            self._queue.append(player)
            if len(self._queue) >= 2:
                p1 = self._queue.pop(0)
                p2 = self._queue.pop(0)
            else:
                p1 = p2 = None

        if p1 and p2:
            game = self._game_service.create_game([p1, p2], source="matchmaking")
            return {"status": "matched", "game": game}

        return {"status": "queued", "position": len(self._queue)}

    def cancel(self, player_name: str) -> Dict[str, object]:
        player = _normalize_name(player_name, field="player_name")
        with self._lock:
            if player in self._queue:
                self._queue.remove(player)
                return {"status": "removed"}
        return {"status": "absent"}


class AiService:
    def __init__(self, game_service: GameService) -> None:
        self._game_service = game_service

    def submit_prompt(self, game_id: str, player_name: str, prompt: str) -> Game:
        game = self._game_service.record_prompt(game_id, player_name, prompt)
        if game.needs_generation():
            return self._process_game(game_id)
        return game

    def process_game(self, game_id: str) -> Game:
        game = self._game_service.get_game(game_id)
        if not game.needs_generation() and game.status == "completed":
            return game
        if len(game.prompts) < len(game.players):
            raise ConflictError("Both prompts are required before processing.")
        return self._process_game(game_id)

    def _process_game(self, game_id: str) -> Game:
        game = self._game_service.mark_processing(game_id)

        outputs: Dict[str, str] = {}
        scores: Dict[str, float] = {}
        for player in game.players:
            prompt = game.prompts.get(player, "")
            outputs[player] = self._generate_output(prompt)
            scores[player] = self._score_prompt(prompt)

        winner = max(scores.items(), key=lambda item: item[1])[0] if scores else None
        return self._game_service.complete_game(
            game_id,
            outputs=outputs,
            scores=scores,
            winner=winner,
            status="completed",
        )

    @staticmethod
    def _generate_output(prompt: str) -> str:
        return f"<section class='prototype'>Generated concept for: {prompt}</section>"

    @staticmethod
    def _score_prompt(prompt: str) -> float:
        unique_words = len(set(re.findall(r"\b\w+\b", prompt.lower())))
        return round(min(unique_words * 3 + len(prompt) * 0.05, 100), 2)


lobby_service = LobbyService()
game_service = GameService()
matchmaking_service = MatchmakingService(game_service)
ai_service = AiService(game_service)

