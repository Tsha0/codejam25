from __future__ import annotations

import os

from backend_app import create_app
from backend_app.extensions import socketio

app = create_app()


if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    allow_unsafe = app.config.get("ENVIRONMENT", "development") != "production"
    socketio.run(
        app,
        host=host,
        port=port,
        debug=app.config.get("DEBUG", False),
        allow_unsafe_werkzeug=allow_unsafe,
    )

