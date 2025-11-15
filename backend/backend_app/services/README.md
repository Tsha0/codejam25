># Services Architecture

This folder contains the service layer for the backend application, organized into separate modules for better maintainability.

## Structure

```
services/
├── __init__.py            # Exports all services and creates singletons
├── base.py                # Shared utilities and exceptions
├── game_service.py        # Game session management
├── lobby_service.py       # Lobby management
├── matchmaking_service.py # Matchmaking queue (with bug fix)
├── ai_service.py          # AI processing and scoring
└── README.md              # This file
```

## Services Overview

### BaseService (`base.py`)

**Exceptions:**
- `ServiceError` - Base exception class
- `ValidationError` - Input validation failures
- `NotFoundError` - Resource not found
- `ConflictError` - Operation conflicts with current state

**Utilities:**
- `normalize_name(value, field)` - Validate and normalize names (2-64 chars)
- `generate_id(prefix)` - Generate unique IDs like `game_abc12345`

### GameService (`game_service.py`)

Manages game sessions from creation to completion.

**Methods:**
- `create_game(players, assigned_image, source)` - Create a new 2-player game
- `get_game(game_id)` - Retrieve game by ID
- `record_prompt(game_id, player_name, prompt)` - Store player's prompt
- `mark_processing(game_id)` - Mark game as processing
- `complete_game(game_id, outputs, scores, winner, status)` - Complete game with results

**Thread Safety:** All operations use locks for concurrent access

### LobbyService (`lobby_service.py`)

Manages 2-player lobbies with readiness tracking.

**Methods:**
- `create_lobby(host_name)` - Create lobby with host
- `join_lobby(lobby_id, player_name)` - Join existing lobby
- `leave_lobby(lobby_id, player_name)` - Leave lobby (deletes if host leaves)
- `toggle_ready(lobby_id, player_name)` - Toggle player ready state
- `start_lobby(lobby_id, host_name)` - Start game (host only, when all ready)
- `mark_started(lobby_id)` - Mark lobby as started
- `get_lobby(lobby_id)` - Get lobby by ID

**Events:** Emits socket events for `player_joined`, `player_left`, `player_ready`, `lobby_full`, `game_starting`, `game_started`

### MatchmakingService (`matchmaking_service.py`)

Manages FIFO matchmaking queue with **fixed polling bug**.

**Methods:**
- `join_queue(player_name)` - Join queue or return existing match
- `cancel(player_name)` - Remove from queue or matched players
- `get_queue_status()` - Get queue stats (debugging)
- `get_position(player_name)` - Get player's queue position

**Bug Fix:** Tracks matched players to prevent re-queuing after match

**How it works:**
1. Player joins queue → `{"status": "queued", "position": 1}`
2. Second player joins → Both matched → Game created
3. First player polls again → Returns existing match (not re-queued!) ✅

**Key Implementation:**
```python
self._matched_players: Dict[str, Game] = {}  # Track matched players

def join_queue(self, player_name: str):
    # Check matched players FIRST
    if player in self._matched_players:
        return {"status": "matched", "game": game}  # ← THE FIX
    
    # Then check queue, add player, create match...
```

### AiService (`ai_service.py`)

Handles AI-powered prompt processing and scoring.

**Methods:**
- `submit_prompt(game_id, player_name, prompt)` - Submit prompt, auto-process if ready
- `process_game(game_id)` - Manually trigger processing (for retries)

**Auto-Processing:** When both players submit prompts, automatically:
1. Marks game as "processing"
2. Generates HTML/CSS outputs
3. Scores both submissions
4. Determines winner
5. Completes game

## Usage

### Import Services

```python
from backend_app.services import (
    game_service,
    lobby_service,
    matchmaking_service,
    ai_service,
)
```

### Create a Game

```python
game = game_service.create_game(
    players=["Alice", "Bob"],
    assigned_image="https://example.com/image.jpg",
    source="matchmaking"
)
```

### Matchmaking Flow

```python
# Player 1 joins
result1 = matchmaking_service.join_queue("Alice")
# {"status": "queued", "position": 1}

# Player 2 joins - creates match!
result2 = matchmaking_service.join_queue("Bob")
# {"status": "matched", "game": {...}}

# Player 1 polls again - gets the match
result3 = matchmaking_service.join_queue("Alice")
# {"status": "matched", "game": {...}}  ← Same game!
```

### Submit Prompts

```python
# Submit first prompt
game = ai_service.submit_prompt(
    game_id="game_abc123",
    player_name="Alice",
    prompt="Create a space-themed landing page"
)
# Game status: "pending" (waiting for second prompt)

# Submit second prompt - auto-processes!
game = ai_service.submit_prompt(
    game_id="game_abc123",
    player_name="Bob",
    prompt="Build a retro gaming website"
)
# Game status: "completed" with outputs, scores, winner
```

## Thread Safety

All services use `threading.Lock` to ensure thread-safe operations:
- Queue modifications are atomic
- Game/lobby updates are serialized
- No race conditions in concurrent requests

## Testing

### Unit Test Example

```python
from backend_app.services import game_service, matchmaking_service

def test_matchmaking_polling_bug_fix():
    # Player 1 joins
    result1 = matchmaking_service.join_queue("Player1")
    assert result1["status"] == "queued"
    
    # Player 2 joins (creates match)
    result2 = matchmaking_service.join_queue("Player2")
    assert result2["status"] == "matched"
    game_id = result2["game"].id
    
    # Player 1 polls again - should get match, not re-queue
    result3 = matchmaking_service.join_queue("Player1")
    assert result3["status"] == "matched"  # ← THE FIX
    assert result3["game"].id == game_id
```

### Integration Test

```bash
# Start backend
python app.py

# In another terminal
python -c "
from backend_app.services import matchmaking_service

r1 = matchmaking_service.join_queue('Alice')
print('Player 1:', r1)

r2 = matchmaking_service.join_queue('Bob')
print('Player 2:', r2)

r3 = matchmaking_service.join_queue('Alice')
print('Player 1 polls again:', r3)

assert r3['status'] == 'matched', 'Bug still exists!'
print('✅ Bug fixed! Polling works correctly.')
"
```

## Design Decisions

### Why Separate Files?

1. **Maintainability** - Each service is ~150-250 lines, easy to understand
2. **Testing** - Can unit test each service independently
3. **Scalability** - Easy to add new services without bloating one file
4. **Imports** - Clear dependencies between services

### Why Singleton Instances?

Services maintain in-memory state (games, lobbies, queues) that should be shared across all requests. Singletons ensure:
- One queue for all players
- One game store for all games
- Consistent state across all routes

### Why Track Matched Players?

**Problem:** Frontend polls `/matchmaking/join` to check for matches
- Player polls → joins queue
- Match created → both popped from queue
- Player polls again → re-added to queue! ❌

**Solution:** Track matched players
- Player polls → check matched first
- If matched → return game
- Prevents re-queuing ✅

### Memory Management

Matched players stay in memory indefinitely. For production:
- Add TTL (expire after 5-10 minutes)
- Clear on game completion
- Add `/matchmaking/acknowledge` endpoint
- Periodic cleanup job

For this demo/hackathon, current approach is sufficient.

## Future Improvements

1. **Database persistence** - Replace in-memory dicts with DB
2. **WebSocket notifications** - Replace polling with real-time updates
3. **Rate limiting** - Prevent queue spam
4. **Player authentication** - Secure player identity
5. **Match history** - Track player statistics
6. **ELO rating** - Skill-based matchmaking
7. **AI integration** - Real generative AI instead of placeholders

### AI Generation (`/api/ai`)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/ai/generate` | Handles per-player prompt submissions; when both prompts exist it transitions game → processing/completed. |
| POST | `/ai/internal/resolve` | Internal retry hook to re-run generation/scoring if needed. |

> When both prompts are on record, the AI subsystem marks the game `processing`, fabricates two HTML/CSS snippets, scores them, picks a winner, stores artifacts, and emits `game_completed`. If only one prompt exists the API responds with `"waiting"`.

## Backward Compatibility

The old `services.py` file re-exports everything from `services/` module, so existing code continues to work:

```python
# Old import (still works)
from backend_app.services import game_service

# New import (preferred)
from backend_app.services import game_service
```

Both import paths work identically.

