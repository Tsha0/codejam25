from __future__ import annotations

from flask import Flask
from flask_cors import CORS

from .config import Settings
from .extensions import socketio


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
        resources={r"/api/*": {"origins": cors_origins}},
        supports_credentials=True,
    )

    socketio.init_app(app, cors_allowed_origins=cors_origins)

    from .routes import api_bp

    app.register_blueprint(api_bp, url_prefix="/api")

    return app


app = create_app()

