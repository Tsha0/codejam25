# Backend Service

Lightweight Flask + Socket.IO API that powers lobbies, matchmaking, game orchestration, and AI scoring for Competitive Vibecoding battles.

## Summary

- **Lobby System** – create 2-player rooms, track readiness, and emit live updates via `/ws/lobby/<lobbyId>`.
- **Matchmaking Queue** – simple FIFO queue that auto-creates games once two players opt-in.
- **Game Sessions** – centralized store for prompts, generated outputs, scores, and winner metadata per `gameId`.
- **AI Generation** – placeholder Gemini workflow that triggers automatically once both prompts arrive, emitting `/ws/game/<gameId>` events.

## Setup

1. Activate the existing virtual environment (already created per project docs).
2. Install dependencies:

```bash
pip install -r /Users/jason/Code/codejam25/backend/requirements.txt
```

3. Run the API locally:

```bash
cd /Users/jason/Code/codejam25/backend
FLASK_APP=backend_app flask run --host=127.0.0.1 --port=8000
```

Alternatively, run `python /Users/jason/Code/codejam25/backend/app.py` (defaults to `127.0.0.1:8000`, override with `HOST`/`PORT` env vars).

## Environment Flags

| Variable        | Purpose                                  | Default       |
|-----------------|------------------------------------------|---------------|
| `APP_NAME`      | Friendly name exposed in logs/responses. | CodeJam Backend |
| `FLASK_ENV`     | `production`, `development`, etc.        | development   |
| `FLASK_DEBUG`   | Force debug mode (`1` enables).          | auto (on unless production) |
| `ALLOWED_ORIGINS` | Comma-separated list for CORS.         | `*`           |

## REST API

### Lobby (`/api/lobby`)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/lobby/create` | Create lobby and auto-add host. |
| POST | `/lobby/join` | Join lobby until 2-player cap (emits `player_joined`, `lobby_full`). |
| POST | `/lobby/leave` | Leave lobby; host leaving deletes it and emits `player_left`. |
| GET  | `/lobby/<lobbyId>` | Fetch current lobby state, readiness, status. |
| POST | `/lobby/ready` | Toggle readiness; when both ready lobby becomes ready (`player_ready`). |
| POST | `/lobby/<lobbyId>/start` | Host-only start; creates game, emits `game_starting` + `game_started`. |

Socket namespace: `/ws/lobby/<lobbyId>` (events: `player_joined`, `player_left`, `player_ready`, `lobby_full`, `game_starting`, `game_started`).

### Matchmaking (`/api/matchmaking`)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/matchmaking/join` | Add player to queue; if two players queued → returns newly created game. |
| POST | `/matchmaking/cancel` | Idempotent removal from queue. |

### Game Sessions (`/api/game`)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/game/create` | Manual game creation with players + optional assigned image. |
| GET  | `/game/<gameId>` | Full game payload (players, prompts, outputs, scores, winner). |
| POST | `/game/<gameId>/prompt` | Store a player's prompt; when both exist AI kicks off automatically. |
| POST | `/game/<gameId>/complete` | Manual failsafe completion (emits `game_completed`). |

Socket namespace: `/ws/game/<gameId>` (events: `game_created`, `prompt_submitted`, `game_processing`, `game_completed`).

### AI Generation (`/api/ai`)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/ai/generate` | Handles per-player prompt submissions; when both prompts exist it transitions game → processing/completed. |
| POST | `/ai/internal/resolve` | Internal retry hook to re-run generation/scoring if needed. |

> When both prompts are on record, the AI subsystem marks the game `processing`, fabricates two HTML/CSS snippets, scores them, picks a winner, stores artifacts, and emits `game_completed`. If only one prompt exists the API responds with `"waiting"`.


