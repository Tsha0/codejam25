from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId


class User:
    """User model following MongoDB schema."""
    
    def __init__(
        self,
        email: str,
        password: str,
        name: str,
        username: str,
        _id: Optional[ObjectId] = None,
        avatar: Optional[str] = None,
        googleId: Optional[str] = None,
        githubId: Optional[str] = None,
        elo: int = 10,
        createdAt: Optional[datetime] = None,
        updatedAt: Optional[datetime] = None,
        lastLoginAt: Optional[datetime] = None,
    ):
        self._id = _id or ObjectId()
        self.email = email
        self.password = password
        self.name = name
        self.username = username
        self.avatar = avatar
        self.googleId = googleId
        self.githubId = githubId
        self.elo = elo
        self.createdAt = createdAt or datetime.now(timezone.utc)
        self.updatedAt = updatedAt or datetime.now(timezone.utc)
        self.lastLoginAt = lastLoginAt or datetime.now(timezone.utc)
    
    def to_dict(self, include_password: bool = False) -> dict:
        """Convert user to dictionary."""
        data = {
            "_id": str(self._id),
            "email": self.email,
            "name": self.name,
            "username": self.username,
            "avatar": self.avatar,
            "elo": self.elo,
            "createdAt": self.createdAt.isoformat() if self.createdAt else None,
            "updatedAt": self.updatedAt.isoformat() if self.updatedAt else None,
            "lastLoginAt": self.lastLoginAt.isoformat() if self.lastLoginAt else None,
        }
        
        if include_password:
            data["password"] = self.password
        
        if self.googleId:
            data["googleId"] = self.googleId
        if self.githubId:
            data["githubId"] = self.githubId
        
        return data
    
    def to_mongo(self) -> dict:
        """Convert user to MongoDB document."""
        doc = {
            "_id": self._id,
            "email": self.email,
            "password": self.password,
            "name": self.name,
            "username": self.username,
            "elo": self.elo,
            "createdAt": self.createdAt,
            "updatedAt": self.updatedAt,
            "lastLoginAt": self.lastLoginAt,
        }
        
        if self.avatar:
            doc["avatar"] = self.avatar
        if self.googleId:
            doc["googleId"] = self.googleId
        if self.githubId:
            doc["githubId"] = self.githubId
        
        return doc
    
    @staticmethod
    def from_mongo(doc: dict) -> User:
        """Create User instance from MongoDB document."""
        if not doc:
            return None
        
        return User(
            _id=doc.get("_id"),
            email=doc["email"],
            password=doc["password"],
            name=doc["name"],
            username=doc["username"],
            avatar=doc.get("avatar"),
            googleId=doc.get("googleId"),
            githubId=doc.get("githubId"),
            elo=doc.get("elo", 10),  # Default to 10 for existing users without elo
            createdAt=doc.get("createdAt"),
            updatedAt=doc.get("updatedAt"),
            lastLoginAt=doc.get("lastLoginAt"),
        )


class GamePlayer:
    """Player info within a game."""
    
    def __init__(self, userId: ObjectId, username: str, result: Optional[str] = None):
        self.userId = userId
        self.username = username
        self.result = result  # "win" | "loss"
    
    def to_dict(self) -> dict:
        return {
            "userId": str(self.userId),
            "username": self.username,
            "result": self.result,
        }
    
    def to_mongo(self) -> dict:
        return {
            "userId": self.userId,
            "username": self.username,
            "result": self.result,
        }


class Game:
    """Game model following MongoDB schema."""
    
    def __init__(
        self,
        player1: GamePlayer,
        player2: GamePlayer,
        status: str = "waiting",
        _id: Optional[ObjectId] = None,
        duration: Optional[int] = None,
        startedAt: Optional[datetime] = None,
        completedAt: Optional[datetime] = None,
        createdAt: Optional[datetime] = None,
        updatedAt: Optional[datetime] = None,
    ):
        self._id = _id or ObjectId()
        self.player1 = player1
        self.player2 = player2
        self.status = status  # "waiting" | "active" | "completed" | "abandoned"
        self.duration = duration
        self.startedAt = startedAt or datetime.now(timezone.utc)
        self.completedAt = completedAt
        self.createdAt = createdAt or datetime.now(timezone.utc)
        self.updatedAt = updatedAt or datetime.now(timezone.utc)
    
    def to_dict(self) -> dict:
        """Convert game to dictionary."""
        return {
            "_id": str(self._id),
            "player1": self.player1.to_dict(),
            "player2": self.player2.to_dict(),
            "status": self.status,
            "duration": self.duration,
            "startedAt": self.startedAt.isoformat() if self.startedAt else None,
            "completedAt": self.completedAt.isoformat() if self.completedAt else None,
            "createdAt": self.createdAt.isoformat() if self.createdAt else None,
            "updatedAt": self.updatedAt.isoformat() if self.updatedAt else None,
        }
    
    def to_mongo(self) -> dict:
        """Convert game to MongoDB document."""
        doc = {
            "_id": self._id,
            "player1": self.player1.to_mongo(),
            "player2": self.player2.to_mongo(),
            "status": self.status,
            "startedAt": self.startedAt,
            "createdAt": self.createdAt,
            "updatedAt": self.updatedAt,
        }
        
        if self.duration is not None:
            doc["duration"] = self.duration
        if self.completedAt:
            doc["completedAt"] = self.completedAt
        
        return doc
    
    @staticmethod
    def from_mongo(doc: dict) -> Game:
        """Create Game instance from MongoDB document."""
        if not doc:
            return None
        
        player1_data = doc["player1"]
        player2_data = doc["player2"]
        
        return Game(
            _id=doc.get("_id"),
            player1=GamePlayer(
                userId=player1_data["userId"],
                username=player1_data["username"],
                result=player1_data.get("result"),
            ),
            player2=GamePlayer(
                userId=player2_data["userId"],
                username=player2_data["username"],
                result=player2_data.get("result"),
            ),
            status=doc["status"],
            duration=doc.get("duration"),
            startedAt=doc.get("startedAt"),
            completedAt=doc.get("completedAt"),
            createdAt=doc.get("createdAt"),
            updatedAt=doc.get("updatedAt"),
        )

