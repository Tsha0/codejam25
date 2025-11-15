"""AI service for prompt processing and scoring."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING, Dict

from .base import ConflictError

if TYPE_CHECKING:
    from .game_service import GameService
    from ..schemas import Game


class AiService:
    """Service for AI-powered game processing.
    
    Handles prompt submission and automatic AI generation/scoring when
    both players have submitted their prompts.
    """
    
    def __init__(self, game_service: GameService) -> None:
        """Initialize the AI service.
        
        Args:
            game_service: The game service instance
        """
        self._game_service = game_service

    def submit_prompt(self, game_id: str, player_name: str, prompt: str) -> Game:
        """Submit a player's prompt and trigger AI processing if ready.
        
        When both players have submitted prompts, automatically triggers
        AI generation and scoring.
        
        Args:
            game_id: The game ID
            player_name: The player's name
            prompt: The prompt text
            
        Returns:
            The updated game (may be processing or completed)
        """
        game = self._game_service.record_prompt(game_id, player_name, prompt)
        
        # If both prompts are in, trigger AI processing
        if game.needs_generation():
            return self._process_game(game_id)
        
        return game

    def process_game(self, game_id: str) -> Game:
        """Manually trigger game processing (for retries).
        
        Args:
            game_id: The game ID
            
        Returns:
            The processed game
            
        Raises:
            ConflictError: If both prompts not yet submitted
        """
        game = self._game_service.get_game(game_id)
        
        # If already completed, return as-is
        if not game.needs_generation() and game.status == "completed":
            return game
        
        # Check both prompts exist
        if len(game.prompts) < len(game.players):
            raise ConflictError("Both prompts are required before processing.")
        
        return self._process_game(game_id)

    def _process_game(self, game_id: str) -> Game:
        """Internal method to process a game with AI.
        
        Generates outputs and scores for each player, determines winner,
        and completes the game.
        
        Args:
            game_id: The game ID
            
        Returns:
            The completed game
        """
        game = self._game_service.mark_processing(game_id)

        # Generate outputs and scores for each player
        outputs: Dict[str, str] = {}
        scores: Dict[str, float] = {}
        
        for player in game.players:
            prompt = game.prompts.get(player, "")
            outputs[player] = self._generate_output(prompt)
            scores[player] = self._score_prompt(prompt)

        # Determine winner
        winner = max(scores.items(), key=lambda item: item[1])[0] if scores else None
        
        # Complete the game
        return self._game_service.complete_game(
            game_id,
            outputs=outputs,
            scores=scores,
            winner=winner,
            status="completed",
        )

    @staticmethod
    def _generate_output(prompt: str) -> str:
        """Generate HTML/CSS output from a prompt.
        
        Currently a placeholder implementation.
        In production, this would call an AI service.
        
        Args:
            prompt: The player's prompt
            
        Returns:
            Generated HTML/CSS code
        """
        return f"<section class='prototype'>Generated concept for: {prompt}</section>"

    @staticmethod
    def _score_prompt(prompt: str) -> float:
        """Score a prompt based on creativity and detail.
        
        Currently a simple heuristic implementation.
        In production, this would use AI-based scoring.
        
        Args:
            prompt: The player's prompt
            
        Returns:
            Score from 0-100
        """
        unique_words = len(set(re.findall(r"\b\w+\b", prompt.lower())))
        return round(min(unique_words * 3 + len(prompt) * 0.05, 100), 2)
