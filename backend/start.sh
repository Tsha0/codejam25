#!/bin/bash
set -e

# Get PORT from environment variable (Railway sets this)
PORT=${PORT:-8000}

echo "Starting Flask application on port $PORT..."

# Run gunicorn with eventlet worker for Flask-SocketIO support
exec gunicorn \
  --bind 0.0.0.0:$PORT \
  --workers 2 \
  --worker-class eventlet \
  --timeout 120 \
  --access-logfile - \
  --error-logfile - \
  app:app

