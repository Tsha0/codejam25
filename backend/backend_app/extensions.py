from __future__ import annotations

import os
import socketio as socketio_pkg

if not hasattr(socketio_pkg.Server, "reason"):
    socketio_pkg.Server.reason = None

from flask_socketio import SocketIO
from pymongo import MongoClient

socketio = SocketIO(async_mode="threading", cors_allowed_origins="*")

# MongoDB connection
mongo_client = None
db = None

def init_mongodb():
    """Initialize MongoDB connection."""
    global mongo_client, db
    
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    database_name = os.getenv("MONGODB_DATABASE", "codejam25")
    
    try:
        mongo_client = MongoClient(mongo_uri)
        db = mongo_client[database_name]
        
        # Test connection
        mongo_client.admin.command('ping')
        print(f"✅ Connected to MongoDB: {database_name}")
        
        # Create indexes
        _create_indexes()
        
        return db
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        raise

def _create_indexes():
    """Create indexes for User and Games collections."""
    if db is None:
        return
    
    # User indexes
    db.users.create_index("email", unique=True)
    db.users.create_index("username", unique=True)
    db.users.create_index("googleId", sparse=True)
    db.users.create_index("githubId", sparse=True)
    
    # Games indexes
    db.games.create_index([("player1.userId", 1), ("completedAt", -1)])
    db.games.create_index([("player2.userId", 1), ("completedAt", -1)])
    db.games.create_index([("status", 1), ("createdAt", -1)])
    db.games.create_index([("completedAt", -1)])
    
    # Submissions indexes
    db.submissions.create_index([("game_id", 1), ("player_name", 1)], unique=True)
    db.submissions.create_index([("game_id", 1)])
    db.submissions.create_index([("created_at", -1)])
    
    print("✅ MongoDB indexes created")

