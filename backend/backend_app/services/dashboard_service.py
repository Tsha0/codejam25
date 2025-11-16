from __future__ import annotations

from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timezone

from ..extensions import db
from ..models import User, Game, GamePlayer


class DashboardService:
    """Service for dashboard data operations."""
    
    def get_user_dashboard(self, user_id: str) -> dict:
        """
        Get user dashboard data including profile and game history.
        
        Args:
            user_id: User's ID
            
        Returns:
            Dictionary with user info and games
        """
        # Get user
        user_doc = db.users.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            raise ValueError("User not found")
        
        user = User.from_mongo(user_doc)
        
        # Get game history
        games = self.get_user_games(user_id, limit=20)
        
        return {
            "user": {
                "id": str(user._id),
                "name": user.name,
                "email": user.email,
                "username": user.username,
                "avatar": user.avatar,
                "elo": user.elo,
            },
            "games": games,
        }
    
    def get_user_games(self, user_id: str, limit: int = 20, skip: int = 0) -> List[dict]:
        """
        Get user's game history.
        
        Args:
            user_id: User's ID
            limit: Maximum number of games to return
            skip: Number of games to skip (for pagination)
            
        Returns:
            List of game dictionaries with opponent info
        """
        user_oid = ObjectId(user_id)
        
        # Find all completed games where user is player1 or player2
        games = db.games.aggregate([
            {
                "$match": {
                    "$or": [
                        {"player1.userId": user_oid},
                        {"player2.userId": user_oid}
                    ],
                    "status": "completed"
                }
            },
            {"$sort": {"completedAt": -1}},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$project": {
                    "_id": 1,
                    "opponent": {
                        "$cond": [
                            {"$eq": ["$player1.userId", user_oid]},
                            "$player2.username",
                            "$player1.username"
                        ]
                    },
                    "opponentId": {
                        "$cond": [
                            {"$eq": ["$player1.userId", user_oid]},
                            "$player2.userId",
                            "$player1.userId"
                        ]
                    },
                    "result": {
                        "$cond": [
                            {"$eq": ["$player1.userId", user_oid]},
                            "$player1.result",
                            "$player2.result"
                        ]
                    },
                    "duration": 1,
                    "completedAt": 1
                }
            }
        ])
        
        result = []
        for game in games:
            # Get opponent's elo
            opponent_elo = 10  # Default
            if game.get("opponentId"):
                opponent_doc = db.users.find_one({"_id": game["opponentId"]})
                if opponent_doc:
                    opponent_elo = opponent_doc.get("elo", 10)
            
            result.append({
                "id": str(game["_id"]),
                "opponent": game["opponent"],
                "opponentElo": opponent_elo,
                "result": game["result"],
                "duration": game.get("duration"),
                "completedAt": game["completedAt"].isoformat() if game.get("completedAt") else None,
            })
        
        return result
    
    def create_game_record(
        self,
        player1_id: str,
        player1_username: str,
        player2_id: str,
        player2_username: str,
    ) -> Game:
        """
        Create a new game record.
        
        Args:
            player1_id: First player's user ID
            player1_username: First player's username
            player2_id: Second player's user ID
            player2_username: Second player's username
            
        Returns:
            Created Game object
        """
        player1 = GamePlayer(
            userId=ObjectId(player1_id),
            username=player1_username,
        )
        
        player2 = GamePlayer(
            userId=ObjectId(player2_id),
            username=player2_username,
        )
        
        game = Game(
            player1=player1,
            player2=player2,
            status="active",
        )
        
        result = db.games.insert_one(game.to_mongo())
        game._id = result.inserted_id
        
        return game
    
    def complete_game(
        self,
        game_id: str,
        player1_result: str,
        player2_result: str,
        duration: int,
    ) -> Game:
        """
        Mark game as completed and record results.
        
        Args:
            game_id: Game ID
            player1_result: "win" or "loss"
            player2_result: "win" or "loss"
            duration: Game duration in seconds
            
        Returns:
            Updated Game object
        """
        if player1_result not in ["win", "loss"] or player2_result not in ["win", "loss"]:
            raise ValueError("Result must be 'win' or 'loss'")
        
        game_oid = ObjectId(game_id)
        
        # Fetch game to get player IDs
        game_doc = db.games.find_one({"_id": game_oid})
        if not game_doc:
            raise ValueError("Game not found")
        
        player1_id = game_doc["player1"]["userId"]
        player2_id = game_doc["player2"]["userId"]
        
        # Update elo ratings
        # Get current elo ratings
        player1_doc = db.users.find_one({"_id": player1_id})
        player2_doc = db.users.find_one({"_id": player2_id})
        
        player1_elo = player1_doc.get("elo", 10) if player1_doc else 10
        player2_elo = player2_doc.get("elo", 10) if player2_doc else 10
        
        # Update elo: +5 for win, -5 for loss (minimum 0)
        if player1_result == "win":
            player1_elo = max(0, player1_elo + 5)
        else:  # loss
            player1_elo = max(0, player1_elo - 5)
        
        if player2_result == "win":
            player2_elo = max(0, player2_elo + 5)
        else:  # loss
            player2_elo = max(0, player2_elo - 5)
        
        # Update user elo ratings
        db.users.update_one(
            {"_id": player1_id},
            {"$set": {"elo": player1_elo, "updatedAt": datetime.now(timezone.utc)}}
        )
        db.users.update_one(
            {"_id": player2_id},
            {"$set": {"elo": player2_elo, "updatedAt": datetime.now(timezone.utc)}}
        )
        
        # Update game
        db.games.update_one(
            {"_id": game_oid},
            {
                "$set": {
                    "player1.result": player1_result,
                    "player2.result": player2_result,
                    "status": "completed",
                    "duration": duration,
                    "completedAt": datetime.now(timezone.utc),
                    "updatedAt": datetime.now(timezone.utc),
                }
            }
        )
        
        # Fetch and return updated game
        updated_game_doc = db.games.find_one({"_id": game_oid})
        if not updated_game_doc:
            raise ValueError("Game not found")
        
        return Game.from_mongo(updated_game_doc)
    
    def get_game(self, game_id: str) -> Optional[Game]:
        """Get game by ID."""
        try:
            game_doc = db.games.find_one({"_id": ObjectId(game_id)})
            if not game_doc:
                return None
            return Game.from_mongo(game_doc)
        except Exception:
            return None
    
    def get_user_stats(self, user_id: str) -> dict:
        """
        Get user's game statistics.
        
        Args:
            user_id: User's ID
            
        Returns:
            Dictionary with wins, losses, total games
        """
        user_oid = ObjectId(user_id)
        
        # Count wins
        wins = db.games.count_documents({
            "$or": [
                {"player1.userId": user_oid, "player1.result": "win"},
                {"player2.userId": user_oid, "player2.result": "win"}
            ],
            "status": "completed"
        })
        
        # Count losses
        losses = db.games.count_documents({
            "$or": [
                {"player1.userId": user_oid, "player1.result": "loss"},
                {"player2.userId": user_oid, "player2.result": "loss"}
            ],
            "status": "completed"
        })
        
        return {
            "wins": wins,
            "losses": losses,
            "total": wins + losses,
            "winRate": round(wins / (wins + losses) * 100, 1) if (wins + losses) > 0 else 0,
        }


# Singleton instance
dashboard_service = DashboardService()

