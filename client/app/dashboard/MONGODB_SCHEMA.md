# Dashboard MongoDB Schemas

This document outlines the simplified MongoDB collections needed for the dashboard.

## Collections Overview

1. **users** - User profiles and basic information
2. **games** - Game records with win/loss results

---

## 1. Users Collection

Stores user profile data.

```typescript
interface User {
  _id: ObjectId
  
  // Authentication
  email: string              // Unique, indexed
  password: string           // Hashed with bcrypt
  name: string               // Display name
  username: string           // Unique username, indexed
  avatar?: string            // URL to avatar image
  
  // OAuth (optional)
  googleId?: string
  githubId?: string
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date
}
```

### Indexes
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ googleId: 1 }, { sparse: true })
db.users.createIndex({ githubId: 1 }, { sparse: true })
```

---

## 2. Games Collection

Stores individual game records with win/loss results.

```typescript
interface Game {
  _id: ObjectId
  
  // Players
  player1: {
    userId: ObjectId         // Reference to users collection
    username: string
    result: "win" | "loss"
  }
  
  player2: {
    userId: ObjectId
    username: string
    result: "win" | "loss"
  }
  
  // Game Details
  status: "waiting" | "active" | "completed" | "abandoned"
  duration: number           // Duration in seconds
  startedAt: Date
  completedAt?: Date
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}
```

### Indexes
```javascript
db.games.createIndex({ "player1.userId": 1, completedAt: -1 })
db.games.createIndex({ "player2.userId": 1, completedAt: -1 })
db.games.createIndex({ status: 1, createdAt: -1 })
db.games.createIndex({ completedAt: -1 })
```

---

## Aggregation Queries

### Get User's Game History
```javascript
db.games.aggregate([
  {
    $match: {
      $or: [
        { "player1.userId": ObjectId("USER_ID") },
        { "player2.userId": ObjectId("USER_ID") }
      ],
      status: "completed"
    }
  },
  { $sort: { completedAt: -1 } },
  {
    $project: {
      opponent: {
        $cond: [
          { $eq: ["$player1.userId", ObjectId("USER_ID")] },
          "$player2.username",
          "$player1.username"
        ]
      },
      result: {
        $cond: [
          { $eq: ["$player1.userId", ObjectId("USER_ID")] },
          "$player1.result",
          "$player2.result"
        ]
      },
      duration: 1,
      completedAt: 1
    }
  }
])
```

---

## Backend API Endpoints Needed

### Dashboard Data
- `GET /api/dashboard` - Get user info and game history
- `GET /api/user/:id/games` - Get user's game history (paginated)

### Game Management
- `POST /api/games/create` - Create a new game
- `POST /api/games/:id/complete` - Mark game as completed and record result

---

## Example API Response

### GET /api/dashboard
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "CodeWarrior",
    "email": "warrior@example.com",
    "username": "CodeWarrior",
    "avatar": null
  },
  "games": [
    {
      "id": "507f191e810c19729de860ea",
      "opponent": "VibeKing",
      "result": "win",
      "duration": 754,
      "completedAt": "2025-01-15T10:30:00Z"
    },
    {
      "id": "507f191e810c19729de860eb",
      "opponent": "CodeNinja",
      "result": "win",
      "duration": 922,
      "completedAt": "2025-01-15T05:45:00Z"
    }
  ]
}
```

---

## Sample Game Creation Flow

### 1. Create Game
```javascript
POST /api/games/create
{
  "player1Id": "507f1f77bcf86cd799439011",
  "player2Id": "507f1f77bcf86cd799439012"
}

// Returns
{
  "gameId": "507f191e810c19729de860ea",
  "status": "active",
  "startedAt": "2025-01-15T10:00:00Z"
}
```

### 2. Complete Game
```javascript
POST /api/games/:id/complete
{
  "player1Result": "win",
  "player2Result": "loss",
  "duration": 754
}

// Returns
{
  "gameId": "507f191e810c19729de860ea",
  "status": "completed",
  "completedAt": "2025-01-15T10:12:34Z"
}
```

---

## Performance Considerations

1. **Indexing**: Create indexes on userId fields for fast game history queries
2. **Pagination**: Implement cursor-based pagination for game history
3. **Denormalization**: Store username in game records to avoid joins

---

## Security Considerations

1. **Authentication**: Verify user owns the data they're accessing
2. **Rate Limiting**: Limit API calls per user
3. **Data Validation**: Validate all input data on the server
4. **Permissions**: Ensure users can only view their own game history

---

## Next Steps for Implementation

1. Create MongoDB collections with proper schemas
2. Set up indexes for optimal query performance
3. Implement backend API routes
4. Connect frontend to real API endpoints
5. Add pagination for game history
6. Add error handling and loading states
