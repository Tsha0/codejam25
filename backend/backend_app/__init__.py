from __future__ import annotations

import os
from pathlib import Path

from flask import Flask
from flask_cors import CORS

# Load .env file if it exists (before reading environment variables)
try:
    from dotenv import load_dotenv
    # Load from backend directory (backend/.env)
    backend_dir = Path(__file__).parent.parent
    env_file = backend_dir / ".env"
    if env_file.exists():
        load_dotenv(env_file, override=False)
    # Also try current working directory as fallback
    load_dotenv(override=False)
except ImportError:
    # python-dotenv not installed, skip .env loading
    pass

from .config import Settings
from .extensions import socketio, init_mongodb


def create_app() -> Flask:
    """Application factory for the Flask backend."""
    app = Flask(__name__)

    settings = Settings.from_env()
    app.config.update(
        APP_NAME=settings.app_name,
        ENVIRONMENT=settings.environment,
        DEBUG=settings.debug,
    )

    cors_origins: str | list[str] = (
        "*" if "*" in settings.allowed_origins else settings.allowed_origins
    )
    CORS(
        app,
        resources={
            r"/api/*": {"origins": cors_origins},
            r"/auth/*": {"origins": cors_origins}
        },
        supports_credentials=True,
    )

    socketio.init_app(app, cors_allowed_origins=cors_origins)

    # Initialize MongoDB
    try:
        init_mongodb()
    except Exception as e:
        print(f"Warning: MongoDB initialization failed: {e}")
        print("Auth and dashboard features will not be available.")

    # Register blueprints
    from .routes import api_bp
    from .auth_routes import auth_bp
    from .dashboard_routes import dashboard_bp

    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)

    return app


app = create_app()

