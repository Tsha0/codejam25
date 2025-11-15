# CodeJam 2025 - Creative Battles

A real-time competitive coding game where players compete by creating web designs based on prompts.

## Quick Start

See **[Quick Start Guide](doc/QUICKSTART.md)** for immediate setup instructions.

## Project Structure

```
codejam25/
├── backend/          # Flask + Socket.IO backend
├── client/           # Next.js frontend
└── doc/              # Documentation
```

## Documentation

- **[Quick Start Guide](doc/QUICKSTART.md)** - Get up and running in 30 seconds
- **[Services Refactor](doc/SERVICES_REFACTOR.md)** - Architecture overview and what changed
- **[Backend README](backend/README.md)** - Backend API documentation
- **[Client README](client/README.md)** - Frontend setup and usage
- **[Services README](backend/backend_app/services/README.md)** - Service layer documentation

## Features

- ✅ **Real-time Matchmaking** - FIFO queue with automatic matching
- ✅ **Lobby System** - Create/join lobbies with ready states
- ✅ **Game Sessions** - Track prompts, outputs, scores, and winners
- ✅ **AI Processing** - Automatic scoring when both prompts submitted
- ✅ **Socket.IO Events** - Real-time updates for lobbies and games

## Getting Started

### Backend

```bash
cd backend
python3 app.py
# Runs on http://localhost:8000
```

### Frontend

```bash
cd client
npm install
npm run dev
# Runs on http://localhost:3000
```

### Test Matchmaking

Open two browser tabs:
- Tab 1: `http://localhost:3000/game/waiting?player=Alice`
- Tab 2: `http://localhost:3000/game/waiting?player=Bob`

Both players will match and enter the game!

## Testing

Run the service tests:

```bash
cd backend
python3 test_services.py
```

Expected: `🎉 ALL TESTS PASSED!`

## Tech Stack

**Backend:**
- Python 3.12+
- Flask + Flask-SocketIO
- In-memory data stores (lobbies, games, matchmaking queue)

**Frontend:**
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

## Contributing

This project was created for CodeJam 2025. See individual READMEs for module-specific details.

