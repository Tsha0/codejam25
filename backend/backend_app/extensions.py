from __future__ import annotations

import socketio as socketio_pkg

if not hasattr(socketio_pkg.Server, "reason"):
    socketio_pkg.Server.reason = None

from flask_socketio import SocketIO

socketio = SocketIO(async_mode="threading", cors_allowed_origins="*")

