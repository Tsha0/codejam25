from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

import bcrypt
import jwt
from bson import ObjectId

from ..extensions import db
from ..models import User


class AuthService:
    """Service for handling user authentication."""
    
    def __init__(self):
        self.jwt_secret = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
        self.jwt_algorithm = "HS256"
        self.jwt_expiration_hours = 24
    
    def signup(self, email: str, password: str, name: str, username: Optional[str] = None) -> Tuple[User, str]:
        """
        Create a new user account.
        
        Args:
            email: User's email
            password: Plain text password
            name: User's display name
            username: Optional username (defaults to name if not provided)
            
        Returns:
            Tuple of (User object, JWT token)
            
        Raises:
            ValueError: If user already exists or validation fails
        """
        if not email or not password or not name:
            raise ValueError("Email, password, and name are required")
        
        # Use name as username if not provided
        if not username:
            username = name
        
        # Check if user already exists
        existing_user = db.users.find_one({"email": email})
        if existing_user:
            raise ValueError("User with this email already exists")
        
        existing_username = db.users.find_one({"username": username})
        if existing_username:
            raise ValueError("Username already taken")
        
        # Hash password
        hashed_password = self._hash_password(password)
        
        # Create user with initial elo rating of 10
        user = User(
            email=email,
            password=hashed_password,
            name=name,
            username=username,
            elo=10,
        )
        
        # Save to database
        result = db.users.insert_one(user.to_mongo())
        user._id = result.inserted_id
        
        # Generate JWT token
        token = self._generate_token(user)
        
        return user, token
    
    def login(self, email: str, password: str) -> Tuple[User, str]:
        """
        Authenticate user and return JWT token.
        
        Args:
            email: User's email
            password: Plain text password
            
        Returns:
            Tuple of (User object, JWT token)
            
        Raises:
            ValueError: If credentials are invalid
        """
        if not email or not password:
            raise ValueError("Email and password are required")
        
        # Find user
        user_doc = db.users.find_one({"email": email})
        if not user_doc:
            raise ValueError("Invalid email or password")
        
        user = User.from_mongo(user_doc)
        
        # Verify password
        if not self._verify_password(password, user.password):
            raise ValueError("Invalid email or password")
        
        # Update last login
        db.users.update_one(
            {"_id": user._id},
            {"$set": {"lastLoginAt": datetime.now(timezone.utc)}}
        )
        user.lastLoginAt = datetime.now(timezone.utc)
        
        # Generate JWT token
        token = self._generate_token(user)
        
        return user, token
    
    def verify_token(self, token: str) -> Optional[User]:
        """
        Verify JWT token and return user.
        
        Args:
            token: JWT token
            
        Returns:
            User object if valid, None otherwise
        """
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            user_id = payload.get("user_id")
            
            if not user_id:
                return None
            
            user_doc = db.users.find_one({"_id": ObjectId(user_id)})
            if not user_doc:
                return None
            
            return User.from_mongo(user_doc)
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        try:
            user_doc = db.users.find_one({"_id": ObjectId(user_id)})
            if not user_doc:
                return None
            return User.from_mongo(user_doc)
        except Exception:
            return None
    
    def _hash_password(self, password: str) -> str:
        """Hash password using bcrypt."""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def _verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash."""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def _generate_token(self, user: User) -> str:
        """Generate JWT token for user."""
        payload = {
            "user_id": str(user._id),
            "email": user.email,
            "username": user.username,
            "exp": datetime.now(timezone.utc) + timedelta(hours=self.jwt_expiration_hours),
            "iat": datetime.now(timezone.utc),
        }
        token = jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
        return token


# Singleton instance
auth_service = AuthService()

