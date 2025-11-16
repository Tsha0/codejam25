"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChevronRight,
  User,
  Clock
} from "lucide-react"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts"


type RankTierName =
  | "Iron"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Champion"

type RankTier = {
  name: RankTierName
  min: number   // inclusive
  max: number   // inclusive
  percentLabel: string
  textClass: string
  badgeClass: string
}

const rankTiers: RankTier[] = [
  {
    name: "Iron",
    min: 1,
    max: 20,
    percentLabel: "Bottom 20%",
    textClass: "text-slate-300",
    badgeClass: "bg-slate-900/70 border-slate-500/70",
  },
  {
    name: "Bronze",
    min: 21,
    max: 40,
    percentLabel: "Next 20%",
    textClass: "text-amber-500",
    badgeClass: "bg-amber-950/60 border-amber-700/70",
  },
  {
    name: "Silver",
    min: 41,
    max: 60,
    percentLabel: "Middle 20%",
    textClass: "text-slate-100",
    badgeClass: "bg-slate-800/70 border-slate-300/70",
  },
  {
    name: "Gold",
    min: 61,
    max: 75,
    percentLabel: "Top 40–25%",
    textClass: "text-yellow-300",
    badgeClass: "bg-yellow-950/60 border-yellow-500/70",
  },
  {
    name: "Platinum",
    min: 76,
    max: 85,
    percentLabel: "Top 25–15%",
    textClass: "text-teal-300",
    badgeClass: "bg-teal-950/60 border-teal-500/70",
  },
  {
    name: "Diamond",
    min: 86,
    max: 95,
    percentLabel: "Top 15–5%",
    textClass: "text-sky-300",
    badgeClass: "bg-sky-950/60 border-sky-500/70",
  },
  {
    name: "Champion",
    min: 96,
    max: 100,
    percentLabel: "Top 5%",
    textClass: "text-fuchsia-300",
    badgeClass: "bg-fuchsia-950/60 border-fuchsia-500/70",
  },
]

function getRankTierFromRating(rating: number): RankTier {
  const clamped = Math.max(1, Math.min(100, rating))
  return (
    rankTiers.find((tier) => clamped >= tier.min && clamped <= tier.max) ??
    rankTiers[0]
  )
}

// OPTIONAL: simple Elo-style update, if you want to evolve the 1–100 rating later
export function updateRating(
  current: number,
  opponent: number,
  result: "win" | "loss" | "draw"
) {
  const K = 16
  const expected = 1 / (1 + Math.pow(10, (opponent - current) / 400))
  const score = result === "win" ? 1 : result === "draw" ? 0.5 : 0
  const newRating = current + K * (score - expected)

  // map typical Elo (around 800–2400) into 1–100 scale if needed
  const normalized = ((newRating - 800) / (2400 - 800)) * 99 + 1
  return Math.max(1, Math.min(100, Math.round(normalized)))
}



// Mock user data - will be fetched from MongoDB
const mockUser = {
  name: "CodeWarrior",
  email: "warrior@example.com",
  rating: 87, 
  stats: {
    DuelsStarted: 2612,
    DuelsCompleted: 787,
    timeTyping: "03:49:01", // hh:mm:ss
    avgScoreChangePerDuel: 5.8, // arbitrary unit (e.g. wpm / score pts)
  },
  // Duels per month in last 12 months
  monthlyActivity: [
    { month: "Dec", Duels: 12 },
    { month: "Jan", Duels: 20 },
    { month: "Feb", Duels: 18 },
    { month: "Mar", Duels: 25 },
    { month: "Apr", Duels: 30 },
    { month: "May", Duels: 34 },
    { month: "Jun", Duels: 27 },
    { month: "Jul", Duels: 22 },
    { month: "Aug", Duels: 29 },
    { month: "Sep", Duels: 24 },
    { month: "Oct", Duels: 31 },
    { month: "Nov", Duels: 26 },
  ],
  // performance over Duels (score vs Duel index)
  performance: Array.from({ length: 25 }).map((_, i) => ({
    Duel: i + 1,
    score: 80 + Math.round(Math.sin(i / 3) * 10) + i * 0.5, // fake but looks “real”
  })),
  games: [
    { id: "1", opponent: "VibeKing",   opponentRating: 78, result: "win",  date: "2 hours ago", duration: "12:34" },
    { id: "2", opponent: "CodeNinja",  opponentRating: 82, result: "win",  date: "5 hours ago", duration: "15:22" },
    { id: "3", opponent: "HackerPro",  opponentRating: 90, result: "loss", date: "1 day ago",   duration: "18:45" },
    { id: "4", opponent: "DevMaster",  opponentRating: 69, result: "win",  date: "1 day ago",   duration: "11:20" },
    { id: "5", opponent: "ByteBlaster",opponentRating: 55, result: "win",  date: "2 days ago",  duration: "14:10" },
    { id: "6", opponent: "TechWizard", opponentRating: 93, result: "loss", date: "3 days ago",  duration: "16:30" },
    { id: "7", opponent: "CodeMaster", opponentRating: 61, result: "win",  date: "3 days ago",  duration: "10:15" },
    { id: "8", opponent: "DevNinja",   opponentRating: 72, result: "win",  date: "4 days ago",  duration: "13:45" },
  ],
}

export default function DashboardPage() {
  const { stats, monthlyActivity, performance } = mockUser as any
  const rankTier = getRankTierFromRating(mockUser.rating)
  
  // Calculate winning percentage
  const totalGames = mockUser.games.length
  const wins = mockUser.games.filter((game: any) => game.result === "win").length
  const winningPercentage = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0
  
  // Calculate time prompting: duels completed * 30 seconds
  const totalSeconds = stats.DuelsCompleted * 30
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const timePrompting = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div
    className="min-h-screen bg-cover bg-center bg-no-repeat"
    style={{
      backgroundImage: "url('/flower.JPG')",
    }}
  >
    <div className="backdrop-blur-sm bg-black/60 min-h-screen text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="font-mono text-xl font-bold tracking-widest italic transform -skew-x-12">
                CODEJAM25
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
              <span className="text-sm font-mono text-white/60 group-hover:text-white transition-colors">
                DASHBOARD
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/game/waiting">
                <Button className="bg-cyan-400 text-black hover:bg-cyan-300 font-mono">
                  FIND GAME
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* User Profile Section */}
<div className="flex items-center justify-between gap-4 flex-wrap">
  <div className="flex items-center gap-4">
    <div className="w-16 h-16 rounded-full border-2 border-cyan-400/60 flex items-center justify-center bg-gradient-to-br from-cyan-500/30 to-violet-500/30">
      <User className="w-8 h-8 text-cyan-200" />
    </div>
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold font-mono tracking-wider mb-1">
        {mockUser.name}
      </h1>
      <p className="text-sm text-white/60 font-mono">{mockUser.email}</p>

      {/* Rank pill */}
      <div className="mt-2">
        <span
          className={[
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono",
            rankTier.badgeClass,
            rankTier.textClass,
          ].join(" ")}
        >
          <span className="font-semibold">{rankTier.name.toUpperCase()}</span>
          <span className="opacity-80">| Rating {mockUser.rating}/100</span>
          <span className="opacity-60">({rankTier.percentLabel})</span>
        </span>
      </div>
    </div>
  </div>
</div>


        {/* High-level stats (Duels done, time typing, etc.) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardDescription className="font-mono text-xs uppercase tracking-wide text-white/60">
                Duels completed
              </CardDescription>
              <CardTitle className="font-mono text-3xl font-bold text-emerald-300">
                {stats.DuelsCompleted.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs font-mono text-white/50">
              Finished matches that count toward your history.
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardDescription className="font-mono text-xs uppercase tracking-wide text-white/60">
                Winning percentage
              </CardDescription>
              <CardTitle className="font-mono text-3xl font-bold text-cyan-300">
                {winningPercentage}%
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs font-mono text-white/50">
              Percentage of matches won.
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardDescription className="font-mono text-xs uppercase tracking-wide text-white/60">
                Time Prompting
              </CardDescription>
              <CardTitle className="font-mono text-3xl font-bold text-indigo-300">
                {timePrompting}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs font-mono text-white/50 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Total time spent prompting in completed duels.
            </CardContent>
          </Card>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Last 12 months activity (bar chart) */}
          <Card className="bg-white/5 border-white/10 xl:col-span-1">
            <CardHeader>
              <CardTitle className="font-mono text-sm tracking-wide text-white">
                LAST 12 MONTHS
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                Duels completed per month
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#e5e7eb" fontSize={12} />
                  <YAxis stroke="#e5e7eb" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderRadius: 8,
                      border: "1px solid rgba(148,163,184,0.6)",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="Duels" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Score vs Duels (line chart) */}
          <Card className="bg-white/5 border-white/10 xl:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-mono text-sm tracking-wide text-white">
                    SCORE VS Duels DONE
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">
                    Recent performance trend per Duel
                  </CardDescription>
                </div>
                <div className="text-xs font-mono text-emerald-300">
                  Avg change / Duel:{" "}
                  <span className="font-semibold">
                    {stats.avgScoreChangePerDuel > 0 ? "+" : ""}
                    {stats.avgScoreChangePerDuel.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="Duel"
                    stroke="#e5e7eb"
                    fontSize={12}
                    label={{ value: "Duel #", position: "insideBottomRight", offset: -4, fill: "#9ca3af", fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#e5e7eb"
                    fontSize={12}
                    label={{ value: "Score", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderRadius: 8,
                      border: "1px solid rgba(148,163,184,0.6)",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                      fontSize: 11,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Score"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Game History */}
        <Card className="bg-white/5 border-white/20">
          <CardHeader>
            <CardTitle className="font-mono text-white">MATCH HISTORY</CardTitle>
            <CardDescription className="font-mono">
              All your recent duels
            </CardDescription>
          </CardHeader>
          <CardContent>
  <div className="space-y-2">
    {mockUser.games.map((game) => {
      const opponentTier = getRankTierFromRating(game.opponentRating)

      return (
        <div
          key={game.id}
          className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-3 h-3 rounded-full ${
                game.result === "win" ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-mono font-semibold text-white">
                  vs {game.opponent}
                </div>

                {/* Opponent rank pill */}
                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono",
                    opponentTier.badgeClass,
                    opponentTier.textClass,
                  ].join(" ")}
                >
                  <span className="font-semibold">
                    {opponentTier.name.toUpperCase()}
                  </span>
                  <span className="opacity-70">
                    {game.opponentRating}/100
                  </span>
                </span>
              </div>

              <div className="text-sm text-white/60 font-mono">
                {game.date}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-sm text-white/60 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {game.duration}
            </div>
            <div
              className={`px-4 py-1 rounded text-sm font-mono font-semibold ${
                game.result === "win"
                  ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/40"
                  : "bg-rose-400/15 text-rose-300 border border-rose-400/40"
              }`}
            >
              {game.result.toUpperCase()}
            </div>
          </div>
        </div>
      )
    })}
  </div>
</CardContent>

        </Card>
      </div>
    </div>
    </div>
  )
}
