# API Endpoints Documentation

Complete reference for all available REST API endpoints in the Creative Battles backend.

**Base URL**: `/api` (all endpoints are prefixed with `/api`)

---

## Table of Contents

- [Health Check](#health-check)
- [Lobby Endpoints](#lobby-endpoints)
- [Matchmaking Endpoints](#matchmaking-endpoints)
- [Game Endpoints](#game-endpoints)
- [AI Endpoints](#ai-endpoints)

---

## Health Check

### GET `/health`

Check the health status of the API service.

**Request**: No body required

**Response** (200 OK):
```json
{
  "status": "ok",
  "service": "creative-battles-backend",
  "timestamp": "2025-11-15T21:30:53.404460+00:00"
}
```

---

## Lobby Endpoints

### POST `/lobby/create`

Create a new lobby and automatically add the host as the first player.

**Request Body**:
```json
{
  "host_name": "Player1"
}
```

**Response** (201 Created):
```json
{
  "lobby": {
    "id": "lobby_abc123",
    "host": "Player1",
    "players": ["Player1"],
    "ready_state": {"Player1": false},
    "status": "waiting",
    "created_at": "2025-11-15T21:30:53.404460+00:00",
    "updated_at": "2025-11-15T21:30:53.404460+00:00"
  }
}
```

---

### POST `/lobby/join`

Join an existing lobby. The lobby can hold up to 2 players.

**Request Body**:
```json
{
  "lobby_id": "lobby_abc123",
  "player_name": "Player2"
}
```

**Response** (200 OK):
```json
{
  "lobby": {
    "id": "lobby_abc123",
    "host": "Player1",
    "players": ["Player1", "Player2"],
    "ready_state": {"Player1": false, "Player2": false},
    "status": "full",
    "created_at": "2025-11-15T21:30:53.404460+00:00",
    "updated_at": "2025-11-15T21:31:00.000000+00:00"
  }
}
```

**Socket Events**: Emits `player_joined` and `lobby_full` (when lobby becomes full)

---

### POST `/lobby/leave`

Leave a lobby. If the host leaves, the lobby is deleted.

**Request Body**:
```json
{
  "lobby_id": "lobby_abc123",
  "player_name": "Player2"
}
```

**Response** (200 OK):
```json
{
  "lobby": {
    "id": "lobby_abc123",
    "host": "Player1",
    "players": ["Player1"],
    "ready_state": {"Player1": false},
    "status": "waiting",
    "created_at": "2025-11-15T21:30:53.404460+00:00",
    "updated_at": "2025-11-15T21:32:00.000000+00:00"
  },
  "deleted": false
}
```

**Socket Events**: Emits `player_left`

---

### GET `/lobby/<lobby_id>`

Get the current state of a lobby.

**Request**: No body required

**Response** (200 OK):
```json
{
  "lobby": {
    "id": "lobby_abc123",
    "host": "Player1",
    "players": ["Player1", "Player2"],
    "ready_state": {"Player1": true, "Player2": false},
    "status": "full",
    "created_at": "2025-11-15T21:30:53.404460+00:00",
    "updated_at": "2025-11-15T21:33:00.000000+00:00"
  }
}
```

---

### POST `/lobby/ready`

Toggle a player's ready status in the lobby.

**Request Body**:
```json
{
  "lobby_id": "lobby_abc123",
  "player_name": "Player1"
}
```

**Response** (200 OK):
```json
{
  "lobby": {
    "id": "lobby_abc123",
    "host": "Player1",
    "players": ["Player1", "Player2"],
    "ready_state": {"Player1": true, "Player2": false},
    "status": "full",
    "created_at": "2025-11-15T21:30:53.404460+00:00",
    "updated_at": "2025-11-15T21:34:00.000000+00:00"
  }
}
```

**Socket Events**: Emits `player_ready`

---

### POST `/lobby/<lobby_id>/start`

Start a game from the lobby. Only the host can start the game. Creates a new game and marks the lobby as started.

**Request Body**:
```json
{
  "host_name": "Player1",
  "assigned_image": "retro.png"
}
```

**Response** (200 OK):
```json
{
  "lobby": {
    "id": "lobby_abc123",
    "host": "Player1",
    "players": ["Player1", "Player2"],
    "ready_state": {"Player1": true, "Player2": true},
    "status": "started",
    "created_at": "2025-11-15T21:30:53.404460+00:00",
    "updated_at": "2025-11-15T21:35:00.000000+00:00"
  },
  "game": {
    "id": "game_d4465eaa",
    "players": ["Player1", "Player2"],
    "assigned_image": "retro.png",
    "prompts": {},
    "outputs": {},
    "scores": {},
    "winner": null,
    "status": "pending",
    "source": "lobby",
    "created_at": "2025-11-15T21:35:00.000000+00:00",
    "updated_at": "2025-11-15T21:35:00.000000+00:00"
  }
}
```

**Socket Events**: Emits `game_starting` and `game_started`

---

## Matchmaking Endpoints

### POST `/matchmaking/join`

Add a player to the matchmaking queue. If two players are in the queue, a game is automatically created and both players are matched.

**Request Body**:
```json
{
  "player_name": "Player1"
}
```

**Response** (201 Created):
```json
{
  "status": "matched",
  "player": "Player1",
  "game": {
    "id": "game_d4465eaa",
    "players": ["Player1", "Player2"],
    "assigned_image": null,
    "prompts": {},
    "outputs": {},
    "scores": {},
    "winner": null,
    "status": "pending",
    "source": "matchmaking",
    "created_at": "2025-11-15T21:35:00.000000+00:00",
    "updated_at": "2025-11-15T21:35:00.000000+00:00"
  }
}
```

---

### POST `/matchmaking/cancel`

Remove a player from the matchmaking queue.

**Request Body**:
```json
{
  "player_name": "Player1"
}
```

**Response** (200 OK):
```json
{
  "status": "cancelled",
  "player": "Player1"
}
```

---

## Game Endpoints

### POST `/game/create`

Manually create a new game with specified players.

**Request Body**:
```json
{
  "players": ["Player1", "Player2"],
  "assigned_image": "retro.png"
}
```

**Response** (201 Created):
```json
{
  "game": {
    "id": "game_d4465eaa",
    "players": ["Player1", "Player2"],
    "assigned_image": "retro.png",
    "prompts": {},
    "outputs": {},
    "scores": {},
    "winner": null,
    "status": "pending",
    "source": "manual",
    "created_at": "2025-11-15T21:30:53.404460+00:00",
    "updated_at": "2025-11-15T21:30:53.404460+00:00"
  }
}
```

---

### GET `/game/<game_id>`

Get the full details of a game, including prompts, outputs, scores, and winner.

**Request**: No body required

**Response** (200 OK):
```json
{
  "game": {
    "id": "game_d4465eaa",
    "players": ["Nova", "Echo"],
    "assigned_image": "retro.png",
    "prompts": {
      "Echo": "Create a modern social media login page...",
      "Nova": "Build a minimalist dashboard..."
    },
    "outputs": {
      "Echo": {
        "html": "<div class=\"login-container\">...</div>",
        "css": "body { font-family: ... }",
        "js": ""
      },
      "Nova": {
        "html": "<div>...</div>",
        "css": "...",
        "js": "..."
      }
    },
    "submissions": {
      "Echo": "/path/to/submission/image.png",
      "Nova": "/path/to/submission/image.png"
    },
    "scores": {
      "Echo": 85.5,
      "Nova": 92.3
    },
    "category_scores": {
      "Echo": {
        "visual_design": 18.0,
        "adherence": 17.5,
        "creativity": 16.0,
        "prompt_clarity": 17.0,
        "prompt_formulation": 16.0
      },
      "Nova": {
        "visual_design": 19.0,
        "adherence": 18.5,
        "creativity": 18.0,
        "prompt_clarity": 18.5,
        "prompt_formulation": 18.3
      }
    },
    "feedback": {
      "Echo": {
        "visual_design": "Good use of colors and layout...",
        "adherence": "Meets most requirements...",
        "creativity": "Some innovative elements...",
        "prompt_clarity": "Clear and well-structured...",
        "prompt_formulation": "Could be more specific..."
      },
      "Nova": {
        "visual_design": "Excellent design...",
        "adherence": "Fully meets requirements...",
        "creativity": "Highly innovative...",
        "prompt_clarity": "Very clear and detailed...",
        "prompt_formulation": "Well-formulated prompt..."
      }
    },
    "winner": "Nova",
    "status": "completed",
    "source": "manual",
    "created_at": "2025-11-15T21:30:53.404460+00:00",
    "updated_at": "2025-11-15T21:35:00.000000+00:00"
  }
}
```

---

### POST `/game/<game_id>/prompt`

Submit a player's prompt for a game. The AI will generate output immediately. If both players have submitted prompts and generated outputs, the game will be automatically scored.

**Request Body**:
```json
{
  "player_name": "Echo",
  "prompt": "Create a modern social media login page with a blue and white color scheme..."
}
```

**Response** (200 OK):
```json
{
  "game": {
    "id": "game_d4465eaa",
    "players": ["Nova", "Echo"],
    "prompts": {
      "Echo": "Create a modern social media login page...",
      "Nova": "Build a minimalist dashboard..."
    },
    "outputs": {
      "Echo": {
        "html": "<div>...</div>",
        "css": "...",
        "js": "..."
      },
      "Nova": {
        "html": "<div>...</div>",
        "css": "...",
        "js": "..."
      }
    },
    "scores": {
      "Echo": 85.5,
      "Nova": 92.3
    },
    "winner": "Nova",
    "status": "completed",
    "source": "manual",
    "created_at": "2025-11-15T21:30:53.404460+00:00",
    "updated_at": "2025-11-15T21:35:00.000000+00:00"
  },
  "status": "completed"
}
```

**Socket Events**: Emits `prompt_submitted`, `output_generated`, `game_processing`, `game_completed`

---

### POST `/game/<game_id>/complete`

Manually complete a game with specified outputs, scores, and winner. This is a failsafe endpoint for manual game completion.

**Request Body**:
```json
{
  "outputs": {
    "Player1": "<div>...</div>",
    "Player2": "<div>...</div>"
  },
  "scores": {
    "Player1": 85.5,
    "Player2": 92.3
  },
  "winner": "Player2",
  "status": "completed"
}
```

**Response** (200 OK):
```json
{
  "game": {
    "id": "game_d4465eaa",
    "players": ["Player1", "Player2"],
    "outputs": {
      "Player1": {
        "html": "<div>...</div>",
        "css": "...",
        "js": "..."
      },
      "Player2": {
        "html": "<div>...</div>",
        "css": "...",
        "js": "..."
      }
    },
    "scores": {
      "Player1": 85.5,
      "Player2": 92.3
    },
    "winner": "Player2",
    "status": "completed",
    "source": "manual",
    "created_at": "2025-11-15T21:30:53.404460+00:00",
    "updated_at": "2025-11-15T21:35:00.000000+00:00"
  }
}
```

**Socket Events**: Emits `game_completed`

---

## AI Endpoints

### POST `/ai/generate`

Generate AI output from a player's prompt. This endpoint submits a prompt, generates HTML/CSS/JS output immediately using Gemini API, and automatically scores the game when both players have outputs.

**Request Body**:
```json
{
  "game_id": "game_d4465eaa",
  "player_name": "Echo",
  "prompt": "Create a modern social media login page with a blue and white color scheme..."
}
```

**Response** (200 OK):
```json
{
  "game": {
    "id": "game_d4465eaa",
    "players": ["Nova", "Echo"],
    "prompts": {
      "Echo": "Create a modern social media login page...",
      "Nova": "Build a minimalist dashboard..."
    },
    "outputs": {
      "Echo": {
        "html": "<div class=\"login-container\">...</div>",
        "css": "body { font-family: ... }",
        "js": ""
      },
      "Nova": {
        "html": "<div>...</div>",
        "css": "...",
        "js": "..."
      }
    },
    "scores": {
      "Echo": 85.5,
      "Nova": 92.3
    },
    "winner": "Nova",
    "status": "completed",
    "source": "manual",
    "created_at": "2025-11-15T21:30:53.404460+00:00",
    "updated_at": "2025-11-15T21:35:00.000000+00:00"
  },
  "status": "completed"
}
```

---

### POST `/ai/modify`

Modify and improve existing HTML/CSS/JS code based on a new prompt. This endpoint takes existing code and a modification request, then returns improved/modified versions of the code.

**Request Body**:
```json
{
  "prompt": "Make the background gradient more vibrant and add smooth animations",
  "html": "<div class=\"container\">...</div>",
  "css": "body { background: #fff; }",
  "js": "console.log('Hello');"
}
```

**Response** (200 OK):
```json
{
  "html": "<div class=\"container\">...</div>",
  "css": "body { background: linear-gradient(...); }",
  "js": "// Improved JavaScript code",
  "context": "Modification request: Make the background gradient more vibrant and add smooth animations"
}
```

**Error Responses**:
- `400 Bad Request`: If `prompt` is missing or invalid
- `503 Service Unavailable`: If Gemini API fails or is unavailable

---

## Socket.IO Events

The API also emits real-time events via Socket.IO:

### Lobby Namespace: `/ws/lobby/<lobby_id>`

- `player_joined` - When a player joins the lobby
- `player_left` - When a player leaves the lobby
- `player_ready` - When a player toggles ready status
- `lobby_full` - When the lobby reaches 2 players
- `game_starting` - When the host starts the game
- `game_started` - When the game is created and started

### Game Namespace: `/ws/game/<game_id>`

- `game_created` - When a game is created
- `prompt_submitted` - When a player submits a prompt
- `output_generated` - When AI generates output for a player
- `game_processing` - When the game is being processed/scored
- `game_completed` - When the game is completed with scores and winner

---

## Notes

- All timestamps are in ISO 8601 format with UTC timezone
- Player names must be 2-64 characters
- Prompts must be non-empty and max 1000 characters
- Outputs are stored with separate `html`, `css`, and `js` fields
- Games require exactly 2 players
- The AI generation uses Gemini 2.5 Flash model
- Scoring is based on output length and vocabulary diversity

