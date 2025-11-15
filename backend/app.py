from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

from backend_app import create_app
from backend_app.extensions import socketio

# Load environment variables from .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

app = create_app()


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    allow_unsafe = app.config.get("ENVIRONMENT", "development") != "production"
    socketio.run(
        app,
        host=host,
        port=port,
        debug=app.config.get("DEBUG", False),
        allow_unsafe_werkzeug=allow_unsafe,
    )

