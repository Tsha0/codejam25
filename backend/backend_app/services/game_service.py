"""Game service for managing game sessions."""

from __future__ import annotations

from dataclasses import replace
from threading import Lock
from typing import TYPE_CHECKING, Dict, Optional, Tuple

from ..events import emit_game_event
from ..schemas import Game, utc_now
from .base import NotFoundError, ValidationError, generate_id, normalize_name

if TYPE_CHECKING:
    from typing import List


class GameService:
    """Service for managing game sessions.
    
    Handles game creation, prompt submission, status updates, and completion.
    """
    
    def __init__(self) -> None:
        self._games: Dict[str, Game] = {}
        self._lock = Lock()

    def create_game(
        self, 
        players: List[str], 
        *, 
        assigned_image: Optional[str] = None, 
        source: str = "manual"
    ) -> Game:
        """Create a new game with the specified players.
        
        Args:
            players: List of exactly 2 player names
            assigned_image: Optional image assignment
            source: Source of game creation (manual, matchmaking, lobby)
            
        Returns:
            The created game
            
        Raises:
            ValidationError: If players list is invalid
        """
        if not isinstance(players, list) or len(players) != 2:
            raise ValidationError("Exactly two players are required.")
        
        normalized_players = [normalize_name(player, field="player_name") for player in players]
        game_id = generate_id("game")
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
        """Retrieve a game by ID.
        
        Args:
            game_id: The game ID
            
        Returns:
            The game
            
        Raises:
            NotFoundError: If game doesn't exist
        """
        with self._lock:
            game = self._games.get(game_id)
        if not game:
            raise NotFoundError("Game not found.")
        return game

    def record_prompt(self, game_id: str, player_name: str, prompt: str) -> Game:
        """Record a player's prompt for a game.
        
        Args:
            game_id: The game ID
            player_name: The player's name
            prompt: The prompt text
            
        Returns:
            The updated game
            
        Raises:
            NotFoundError: If game doesn't exist
            ValidationError: If prompt or player is invalid
        """
        player = normalize_name(player_name, field="player_name")
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

    def record_player_output(self, game_id: str, player_name: str, output: str) -> Tuple[Game, str]:
        """Record a player's generated output for a game.
        
        Args:
            game_id: The game ID
            player_name: The player's name
            output: The generated HTML/CSS/JS output
            
        Returns:
            Tuple of (updated game, canonical player name)
            
        Raises:
            NotFoundError: If game doesn't exist
            ValidationError: If player is invalid
        """
        with self._lock:
            game = self._games.get(game_id)
            if not game:
                raise NotFoundError("Game not found.")
            canonical_player = self._canonical_player(game, player_name)
            game.outputs[canonical_player] = output
            game = replace(
                game,
                outputs=dict(game.outputs),
                updated_at=utc_now(),
            )
            self._games[game_id] = game

        emit_game_event(game_id, "output_generated", {"gameId": game_id, "player": canonical_player})
        return game, canonical_player

    def mark_processing(self, game_id: str) -> Game:
        """Mark a game as processing.
        
        Args:
            game_id: The game ID
            
        Returns:
            The updated game
            
        Raises:
            NotFoundError: If game doesn't exist
        """
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
        """Complete a game with results.
        
        Args:
            game_id: The game ID
            outputs: Player outputs (HTML/CSS)
            scores: Player scores
            winner: Winner's name
            status: Final status
            
        Returns:
            The completed game
            
        Raises:
            NotFoundError: If game doesn't exist
            ValidationError: If player names are invalid
        """
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
        """Find the canonical player name (case-insensitive).
        
        Args:
            game: The game
            player_name: The player name to match
            
        Returns:
            The canonical player name from the game
            
        Raises:
            ValidationError: If player is not in the game
        """
        for player in game.players:
            if player.lower() == player_name.lower():
                return player
        raise ValidationError("Player is not part of this game.")
