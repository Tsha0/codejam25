"""Game service for managing game sessions."""

from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import TYPE_CHECKING, Dict, Optional, Tuple

from bson import ObjectId

from ..events import emit_game_event
from ..extensions import db
from ..models import Game as MongoGame, GamePlayer
from ..prompts import get_random_prompt
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
        
        # Check MongoDB connection on startup
        if db is not None:
            print("✅ GameService initialized with MongoDB connection")
        else:
            print("⚠️  GameService initialized WITHOUT MongoDB connection - games will not persist")

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
            assigned_image: Optional image assignment (prompt text or None for random)
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
        
        # If no assigned_image provided, select a random prompt
        if not assigned_image:
            prompt = get_random_prompt()
            assigned_image = prompt.get_full_prompt()
        
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

    def record_player_output(
        self, 
        game_id: str, 
        player_name: str, 
        output: str, 
        *,
        sections: Optional[Dict[str, str]] = None
    ) -> tuple[Game, str]:
        """Record a player's output for a game.
        
        Args:
            game_id: The game ID
            player_name: The player's name

            output: The generated output (HTML/CSS/JS combined)
            sections: Optional dict with 'html', 'css', 'js' keys for separate sections
            
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
            
            # Store sections separately if provided
            if sections:
                game.output_sections[canonical_player] = {
                    "html": sections.get("html", ""),
                    "css": sections.get("css", ""),
                    "js": sections.get("js", ""),
                }
            
            game = replace(
                game,
                outputs=dict(game.outputs),
                output_sections=dict(game.output_sections),
                updated_at=utc_now(),
            )
            self._games[game_id] = game

        emit_game_event(game_id, "output_generated", {"gameId": game_id, "player": canonical_player})
        return game, canonical_player

    def record_submission(self, game_id: str, player_name: str, submission_id: str) -> tuple[Game, str]:
        """Record a player's image submission for a game.
        
        Args:
            game_id: The game ID
            player_name: The player's name
            submission_id: MongoDB document ID for the submission
            
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
            game.submissions[canonical_player] = submission_id
            game = replace(
                game,
                submissions=dict(game.submissions),
                updated_at=utc_now(),
            )
            self._games[game_id] = game

        emit_game_event(game_id, "submission_received", {"gameId": game_id, "player": canonical_player})
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
        category_scores: Optional[Dict[str, Dict[str, float]]] = None,
        feedback: Optional[Dict[str, Dict[str, str]]] = None,
        winner: Optional[str] = None,
        status: str = "completed",
    ) -> Game:
        """Complete a game with results.
        
        Args:
            game_id: The game ID
            outputs: Player outputs (HTML/CSS)
            scores: Player total scores
            category_scores: Player category scores (visual_design, adherence, etc.)
            feedback: Player feedback for each category
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
                # Note: output_sections should be set via record_player_output, not here
            if scores:
                for player in scores:
                    self._canonical_player(game, player)
                game.scores.update(scores)
            if category_scores:
                for player in category_scores:
                    self._canonical_player(game, player)
                game.category_scores.update(category_scores)
            if feedback:
                for player in feedback:
                    self._canonical_player(game, player)
                game.feedback.update(feedback)
            if winner:
                canonical = self._canonical_player(game, winner)
            else:
                canonical = winner

            game.status = status
            game.winner = canonical
            game = replace(
                game,
                outputs=dict(game.outputs),
                output_sections=dict(game.output_sections),
                submissions=dict(game.submissions),
                scores=dict(game.scores),
                category_scores=dict(game.category_scores),
                feedback=dict(game.feedback),
                winner=canonical,
                status=game.status,
                updated_at=utc_now(),
            )
            self._games[game_id] = game

        emit_game_event(game_id, "game_completed", {"game": game.to_dict()})
        
        # Persist completed game to MongoDB
        print(f"🎯 complete_game() reached - about to call _persist_game_to_mongo()")
        print(f"   Game ID: {game.id}, Status: {game.status}, Players: {game.players}")
        self._persist_game_to_mongo(game)
        print(f"✅ complete_game() finished _persist_game_to_mongo() call")
        
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
    
    def _get_user_by_username(self, username: str) -> Optional[dict]:
        """Look up a user by username in MongoDB.
        
        Args:
            username: The username to look up
            
        Returns:
            User document if found, None otherwise
        """
        if db is None:
            return None
        try:
            # Try exact match first
            user = db.users.find_one({"username": username})
            if user:
                return user
            
            # Try case-insensitive match
            user = db.users.find_one({"username": {"$regex": f"^{username}$", "$options": "i"}})
            if user:
                print(f"   ℹ️  Found user with case-insensitive match: '{user['username']}'")
            return user
        except Exception as e:
            print(f"   ❌ Error looking up user '{username}': {e}")
            return None
    
    def _persist_game_to_mongo(self, game: Game) -> None:
        """Persist a completed game to MongoDB.
        
        Args:
            game: The completed game from in-memory storage
        """
        print(f"\n🔍 Attempting to persist game to MongoDB...")
        print(f"   - Game ID: {game.id}")
        print(f"   - Status: {game.status}")
        print(f"   - Players: {game.players}")
        print(f"   - DB connection: {'✅ Connected' if db is not None else '❌ Not connected'}")
        
        if db is None:
            print("❌ Skipping MongoDB persistence: No database connection")
            return
            
        if game.status != "completed":
            print(f"❌ Skipping MongoDB persistence: Game status is '{game.status}', not 'completed'")
            return
        
        try:
            # Look up users by username
            player1_name = game.players[0]
            player2_name = game.players[1]
            
            print(f"   - Looking up Player 1: '{player1_name}'")
            user1_doc = self._get_user_by_username(player1_name)
            print(f"     {'✅ Found' if user1_doc else '❌ Not found'}")
            
            print(f"   - Looking up Player 2: '{player2_name}'")
            user2_doc = self._get_user_by_username(player2_name)
            print(f"     {'✅ Found' if user2_doc else '❌ Not found'}")
            
            # If either user doesn't exist in DB, skip persistence
            # (This allows for demo/test games with non-registered users)
            if not user1_doc or not user2_doc:
                print(f"⚠️  Skipping MongoDB persistence: User(s) not found in database")
                print(f"    Hint: Make sure both players are logged in with registered accounts")
                return
            
            # Determine results based on winner
            player1_result = "win" if game.winner == player1_name else "loss"
            player2_result = "win" if game.winner == player2_name else "loss"
            
            # If no winner (tie), both get "loss" - this is a simple fallback
            if not game.winner:
                player1_result = "loss"
                player2_result = "loss"
            
            # Update elo ratings
            player1_elo = user1_doc.get("elo", 10)
            player2_elo = user2_doc.get("elo", 10)
            
            # Update elo: +5 for win, -5 for loss (minimum 0)
            if player1_result == "win":
                player1_elo = max(0, player1_elo + 5)
            else:  # loss
                player1_elo = max(0, player1_elo - 5)
            
            if player2_result == "win":
                player2_elo = max(0, player2_elo + 5)
            else:  # loss
                player2_elo = max(0, player2_elo - 5)
            
            # Update user elo ratings in database
            db.users.update_one(
                {"_id": user1_doc["_id"]},
                {"$set": {"elo": player1_elo, "updatedAt": datetime.now(timezone.utc)}}
            )
            db.users.update_one(
                {"_id": user2_doc["_id"]},
                {"$set": {"elo": player2_elo, "updatedAt": datetime.now(timezone.utc)}}
            )
            print(f"   - Updated elo: {player1_name}={player1_elo}, {player2_name}={player2_elo}")
            
            # Create GamePlayer objects
            player1 = GamePlayer(
                userId=user1_doc["_id"],
                username=player1_name,
                result=player1_result,
            )
            
            player2 = GamePlayer(
                userId=user2_doc["_id"],
                username=player2_name,
                result=player2_result,
            )
            
            # Calculate duration (rough estimate based on timestamps)
            duration = None
            if game.created_at and game.updated_at:
                duration = int((game.updated_at - game.created_at).total_seconds())
            
            # Create MongoDB game document
            mongo_game = MongoGame(
                player1=player1,
                player2=player2,
                status="completed",
                duration=duration,
                startedAt=game.created_at,
                completedAt=game.updated_at,
                createdAt=game.created_at,
                updatedAt=game.updated_at,
            )
            
            # Check if game already exists in MongoDB (by a composite key approach)
            # We'll use a simple heuristic: same players + similar timestamp
            existing = db.games.find_one({
                "$or": [
                    {"player1.userId": user1_doc["_id"], "player2.userId": user2_doc["_id"]},
                    {"player1.userId": user2_doc["_id"], "player2.userId": user1_doc["_id"]},
                ],
                "completedAt": {
                    "$gte": game.updated_at - timedelta(minutes=5) if game.updated_at else datetime.now(timezone.utc),
                    "$lte": game.updated_at + timedelta(minutes=5) if game.updated_at else datetime.now(timezone.utc),
                }
            })
            
            if existing:
                # Update existing game
                db.games.update_one(
                    {"_id": existing["_id"]},
                    {"$set": mongo_game.to_mongo()}
                )
                print(f"✅ Updated game in MongoDB: {existing['_id']}")
            else:
                # Insert new game
                result = db.games.insert_one(mongo_game.to_mongo())
                print(f"✅ Persisted game to MongoDB: {result.inserted_id}")
                
        except Exception as e:
            # Log error but don't fail the game completion
            print(f"❌ Error persisting game to MongoDB: {e}")
            import traceback
            traceback.print_exc()
