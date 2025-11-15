This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Backend Setup

Make sure the backend server is running before starting the frontend. The backend should be accessible at `http://localhost:8000` (default).

To configure a different backend URL, create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Running the Frontend

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Matchmaking Integration

The `/game/waiting` page integrates with the backend's matchmaking system via the `/api/matchmaking/join` endpoint.

### How It Works

1. **Player Navigation**: When a user clicks "FIND GAME", they're redirected to `/game/waiting`
2. **Queue Join**: The page automatically calls `POST /api/matchmaking/join` with the player's name
3. **Polling**: If queued, the page polls every 2 seconds to check for matches
4. **Match Found**: When matched, the page redirects to `/game/{gameId}` with the game details
5. **Error Handling**: Connection errors display with a retry button

### Player Name

The player name can be passed via URL parameter:
```
/game/waiting?player=JohnDoe
```

If no player name is provided, a random name is generated (`Player_####`).

### API Response States

- `{status: "queued", position: 1}` - Waiting for opponent
- `{status: "matched", game: {...}}` - Match found, redirecting to game

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
