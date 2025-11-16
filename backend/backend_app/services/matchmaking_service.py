"""Matchmaking service for player queue management."""

from __future__ import annotations

from threading import Lock
from typing import TYPE_CHECKING, Dict

from .base import normalize_name

if TYPE_CHECKING:
    from typing import List
    from .game_service import GameService
    from ..schemas import Game


class MatchmakingService:
    """Service for managing player matchmaking queue.
    
    Implements a FIFO queue that automatically creates games when two players
    are queued. Tracks matched players to support polling: when a player
    polls after being matched, they receive their game instead of being
    re-added to the queue.
    
    This design prevents the bug where:
    - Player 1 joins and polls (queued)
    - Player 2 joins (both matched, game created)
    - Player 1 polls again → should get match, not re-queue
    """
    
    def __init__(self, game_service: GameService) -> None:
        """Initialize the matchmaking service.
        
        Args:
            game_service: The game service instance for creating games
        """
        self._queue: List[str] = []
        self._matched_players: Dict[str, Game] = {}  # Track matched players for polling
        self._lock = Lock()
        self._game_service = game_service

    def join_queue(self, player_name: str) -> Dict[str, object]:
        """Add a player to the matchmaking queue or return existing match.
        
        This method is idempotent and designed for polling:
        - If player already matched → returns the game
        - If player in queue → returns position
        - If new player → adds to queue
        - If 2+ in queue → creates match for first two
        
        Args:
            player_name: Name of the player joining the queue
            
        Returns:
            Dictionary with status:
            - "queued": Player added to queue, includes position
            - "matched": Two players matched, includes game object
            
        Raises:
            ValidationError: If player_name is invalid
        """
        player = normalize_name(player_name, field="player_name")
        
        # Check if player was already matched (handles polling after match)
        # We need to check this outside the lock to avoid deadlock when calling get_game
        cached_game = None
        game_id = None
        with self._lock:
            if player in self._matched_players:
                cached_game = self._matched_players[player]
                game_id = cached_game.id
        
        # If player has a matched game, verify it's still valid
        if cached_game and game_id:
            # Always verify the game status from game_service (not cached object)
            # This ensures we have the latest status even if game was completed
            # Release lock before calling get_game to avoid deadlock
            try:
                current_game = self._game_service.get_game(game_id)
                
                # Check if game is still valid and pending
                # A game is considered "done" if:
                # 1. Status is not "pending" (completed, processing, etc.)
                # 2. Game has scores (indicates completion)
                # 3. Game has a winner (indicates completion)
                is_game_done = (
                    current_game.status != "pending" or
                    bool(current_game.scores) or
                    current_game.winner is not None
                )
                
                if not is_game_done:
                    # Game is still pending and valid, return it
                    return {"status": "matched", "game": current_game}
                else:
                    # Game is done (completed, processing, or has results) - remove from matched players
                    print(f"🔄 Removing {player} from matched players (game {game_id} status: {current_game.status}, has scores: {bool(current_game.scores)}, winner: {current_game.winner})")
                    with self._lock:
                        if player in self._matched_players:
                            del self._matched_players[player]
                        # Also remove the other player if they're in matched_players
                        other_players = [p for p, g in self._matched_players.items() 
                                        if g.id == game_id and p != player]
                        for other_player in other_players:
                            print(f"🔄 Also removing {other_player} from matched players (same game {game_id})")
                            del self._matched_players[other_player]
                    # Continue to add player to queue below
                    
            except Exception as e:
                # If we can't get the game (e.g., it was deleted), remove from matched_players
                print(f"⚠️ Error checking game {game_id} for player {player}: {e}. Removing from matched players.")
                with self._lock:
                    if player in self._matched_players:
                        del self._matched_players[player]
                    # Also remove the other player if they're in matched_players
                    other_players = [p for p, g in self._matched_players.items() 
                                    if g.id == game_id and p != player]
                    for other_player in other_players:
                        del self._matched_players[other_player]
                # Continue to add player to queue below
        
        # Now continue with queue logic (need lock for queue operations)
        with self._lock:
            
            # Check if player is already waiting in queue
            if player in self._queue:
                position = self._queue.index(player) + 1
                return {"status": "queued", "position": position}

            # Add player to queue
            self._queue.append(player)
            
            # Match if two or more players are queued
            if len(self._queue) >= 2:
                print(f'Matching {self._queue[0]} and {self._queue[1]}')
                p1 = self._queue.pop(0)
                p2 = self._queue.pop(0)
                print(f'Queue after popping: {self._queue}')

            else:
                p1 = p2 = None

        # Create game outside lock to avoid holding lock during game creation
        if p1 and p2:
            game = self._game_service.create_game([p1, p2], source="matchmaking")
            
            # Store match for both players so future polls return the match
            # This is the key fix: prevents re-queuing after match
            with self._lock:
                self._matched_players[p1] = game
                self._matched_players[p2] = game
            
            return {"status": "matched", "game": game}

        return {"status": "queued", "position": len(self._queue)}

    def cancel(self, player_name: str) -> Dict[str, object]:
        """Remove a player from the matchmaking queue or matched players.
        
        Idempotent: safe to call multiple times, returns success if player
        was found in queue or matched players, or 'absent' if not found.
        
        Args:
            player_name: Name of the player to remove
            
        Returns:
            Dictionary with status:
            - "removed": Player was removed from queue or matched players
            - "absent": Player was not found
            
        Raises:
            ValidationError: If player_name is invalid
        """
        player = normalize_name(player_name, field="player_name")
        
        with self._lock:
            removed = False
            
            # Remove from queue if present
            if player in self._queue:
                self._queue.remove(player)
                removed = True
            
            # Remove from matched players if present
            if player in self._matched_players:
                del self._matched_players[player]
                removed = True
                
        return {"status": "removed" if removed else "absent"}

    def get_queue_status(self) -> Dict[str, object]:
        """Get current queue status (for debugging/monitoring).
        
        Returns:
            Dictionary with queue size and list of players
        """
        with self._lock:
            return {
                "size": len(self._queue),
                "players": list(self._queue),
                "matched_count": len(self._matched_players)
            }

    def get_position(self, player_name: str) -> int:
        """Get a player's position in the queue.
        
        Args:
            player_name: Name of the player
            
        Returns:
            The player's position (1-indexed), or 0 if not in queue
        """
        player = normalize_name(player_name, field="player_name")
        with self._lock:
            if player in self._queue:
                return self._queue.index(player) + 1
        return 0
    
    def cleanup_completed_games(self) -> int:
        """Remove non-pending games from matched players tracking.
        
        This is called periodically or when games complete to free up memory
        and allow players to re-enter matchmaking. Removes all games that are
        not in "pending" status (completed, processing, in progress, etc.).
        
        Returns:
            Number of players cleaned up
        """
        with self._lock:
            # Find all players with non-pending games
            to_remove = [
                player for player, game in self._matched_players.items()
                if game.status != "pending"
            ]
            for player in to_remove:
                del self._matched_players[player]
            
            if to_remove:
                print(f"🧹 Cleaned up {len(to_remove)} players from non-pending games")
            
            return len(to_remove)
