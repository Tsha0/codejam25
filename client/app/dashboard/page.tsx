"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChevronRight,
  User,
  Clock,
  Settings,
  LogOut,
  Loader2
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"


type RankTierName =
  | "Iron"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "VibeMaster"

type RankTier = {
  name: RankTierName
  min: number   // inclusive
  max: number   // inclusive (or Infinity for VibeMaster)
  percentLabel: string
  textClass: string
  badgeClass: string
  glowClass?: string  // For VibeMaster rainbow glow
}

const rankTiers: RankTier[] = [
  {
    name: "Iron",
    min: 0,
    max: 20,
    percentLabel: "0-20 Elo",
    textClass: "text-slate-300",
    badgeClass: "bg-slate-900/70 border-slate-500/70",
  },
  {
    name: "Bronze",
    min: 21,
    max: 40,
    percentLabel: "21-40 Elo",
    textClass: "text-amber-500",
    badgeClass: "bg-amber-950/60 border-amber-700/70",
  },
  {
    name: "Silver",
    min: 41,
    max: 60,
    percentLabel: "41-60 Elo",
    textClass: "text-slate-100",
    badgeClass: "bg-slate-800/70 border-slate-300/70",
  },
  {
    name: "Gold",
    min: 61,
    max: 70,
    percentLabel: "61-70 Elo",
    textClass: "text-yellow-300",
    badgeClass: "bg-yellow-950/60 border-yellow-500/70",
  },
  {
    name: "Platinum",
    min: 71,
    max: 80,
    percentLabel: "71-80 Elo",
    textClass: "text-teal-300",
    badgeClass: "bg-teal-950/60 border-teal-500/70",
  },
  {
    name: "Diamond",
    min: 81,
    max: 89,
    percentLabel: "81-89 Elo",
    textClass: "text-sky-300",
    badgeClass: "bg-sky-950/60 border-sky-500/70",
  },
  {
    name: "VibeMaster",
    min: 90,
    max: Infinity,
    percentLabel: "90+ Elo",
    textClass: "text-white font-bold",
    badgeClass: "bg-gradient-to-r from-pink-500/70 via-purple-500/70 via-blue-500/70 to-green-500/70 border-2 border-purple-400/90 relative backdrop-blur-sm",
    glowClass: "vibemaster-glow",
  },
]

function getRankTierFromElo(elo: number): RankTier {
  const clamped = Math.max(0, elo)
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

function calculateMonthlyActivity(games: GameData[]) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const now = new Date()
  const monthlyData: { [key: string]: number } = {}

  // Initialize last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = monthNames[date.getMonth()]
    monthlyData[monthKey] = 0
  }

  // Count games per month
  games.forEach((game) => {
    if (game.completedAt) {
      const gameDate = new Date(game.completedAt)
      const monthKey = monthNames[gameDate.getMonth()]
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey]++
      }
    }
  })

  return Object.keys(monthlyData).map((month) => ({
    month,
    Duels: monthlyData[month],
  }))
}

function calculatePerformanceTrend(games: GameData[]) {
  // Take last 25 games and calculate a score based on win rate over time
  const recentGames = games.slice(0, Math.min(25, games.length))
  
  if (recentGames.length === 0) {
    return Array.from({ length: 25 }).map((_, i) => ({
      Duel: i + 1,
      score: 50,
    }))
  }

  return recentGames.reverse().map((game, i) => {
    const baseScore = 50
    const winBonus = game.result === "win" ? 15 : -10
    const progressiveBonus = i * 1.5 // Simulate improvement over time
    return {
    Duel: i + 1,
      score: Math.max(0, Math.min(100, baseScore + winBonus + progressiveBonus + (Math.random() * 10 - 5))),
    }
  })
}



interface UserData {
  id: string
  name: string
  email: string
  username: string
  avatar?: string
  elo?: number
}

interface GameData {
  id: string
  opponent: string
  opponentElo?: number
  result: "win" | "loss"
  duration?: number
  completedAt?: string
}

interface StatsData {
  wins: number
  losses: number
  total: number
  winRate: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [games, setGames] = useState<GameData[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token")
        
        if (!token) {
          window.location.href = "/auth"
          return
        }

        // Fetch dashboard data
        const dashboardResponse = await fetch(`${API_URL}/api/dashboard`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })

        if (!dashboardResponse.ok) {
          throw new Error("Failed to fetch dashboard data")
        }

        const dashboardData = await dashboardResponse.json()
        setUser(dashboardData.user)
        setGames(dashboardData.games || [])
  
        // Fetch stats
        const statsResponse = await fetch(`${API_URL}/api/user/${dashboardData.user.id}/stats`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching dashboard:", err)
        setError(err instanceof Error ? err.message : "Failed to load dashboard")
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <p className="text-white/60 font-mono">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Error</CardTitle>
            <CardDescription>{error || "Failed to load user data"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = "/auth"}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate derived data
  const totalGames = stats?.total || 0
  const winningPercentage = stats?.winRate || 0
  
  // Use actual elo from database
  const elo = user.elo || 10
  const rankTier = getRankTierFromElo(elo)
  
  // Calculate time prompting: duels completed * 30 seconds
  const totalSeconds = totalGames * 30
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const timePrompting = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // Calculate monthly activity from games
  const monthlyActivity = calculateMonthlyActivity(games)
  
  // Calculate performance trend
  const performance = calculatePerformanceTrend(games)
  
  // Format games for display
  const formattedGames = games.map((game) => {
    const completedDate = game.completedAt ? new Date(game.completedAt) : null
    const now = new Date()
    const diffMs = completedDate ? now.getTime() - completedDate.getTime() : 0
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    let dateStr = "Unknown"
    if (completedDate) {
      if (diffHours < 1) {
        dateStr = "Just now"
      } else if (diffHours < 24) {
        dateStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      } else if (diffDays === 1) {
        dateStr = "1 day ago"
      } else {
        dateStr = `${diffDays} days ago`
      }
    }
    
    const durationStr = game.duration 
      ? `${Math.floor(game.duration / 60)}:${String(game.duration % 60).padStart(2, '0')}`
      : "N/A"
    
    return {
      id: game.id,
      opponent: game.opponent,
      opponentElo: game.opponentElo || 10,
      result: game.result,
      date: dateStr,
      duration: durationStr,
    }
  })

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
                CODEJAM15
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
              <span className="text-sm font-mono text-white/60 group-hover:text-white transition-colors">
                DASHBOARD
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link href={`/game/waiting?player=${encodeURIComponent(user.username)}`}>
                <Button 
                  onClick={() => {
                    // Clear old game ID before starting new game
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('current_game_id');
                    }
                  }}
                  className="bg-white text-black hover:bg-white/90 font-mono"
                >
                  FIND GAME
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                <Settings className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => {
                  // Handle logout - navigate to auth page
                  if (typeof window !== 'undefined') {
                    localStorage.clear();
                    window.location.href = '/auth';
                  }
                }}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>


      <div className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* User Profile Section */}
<div className="flex items-center justify-between gap-4 flex-wrap">
  <div className="flex items-center gap-4">
    <div className="w-16 h-16 rounded-full border-2 border-cyan-400/60 flex items-center justify-center bg-[linear-gradient(to_bottom_right,rgba(6,182,212,0.3),rgba(139,92,246,0.3))]">
      <User className="w-8 h-8 text-cyan-200" />
    </div>
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold font-mono tracking-wider mb-1">
        {user.username}
      </h1>
      <p className="text-sm text-white/60 font-mono">{user.email}</p>

      {/* Rank pill */}
      <div className="mt-2">
        <span
          className={[
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono",
            rankTier.badgeClass,
            rankTier.textClass,
            rankTier.glowClass || "",
          ].join(" ")}
        >
          <span className="font-semibold">{rankTier.name.toUpperCase()}</span>
          <span className="opacity-80">| Elo {elo}</span>
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
                {totalGames.toLocaleString()}
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
                {Math.round(winningPercentage)}%
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
                  Win Rate:{" "}
                  <span className="font-semibold">
                    {Math.round(winningPercentage)}%
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
    {formattedGames.length === 0 ? (
      <div className="text-center py-8 text-white/60 font-mono">
        No games played yet. Start your first duel!
      </div>
    ) : (
      formattedGames.map((game) => {
      const opponentTier = getRankTierFromElo(game.opponentElo)

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
                    opponentTier.glowClass || "",
                  ].join(" ")}
                >
                  <span className="font-semibold">
                    {opponentTier.name.toUpperCase()}
                  </span>
                  <span className="opacity-70">
                    {game.opponentElo}
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
      })
    )}
  </div>
</CardContent>
        </Card>
      </div>
    </div>
    </div>
  )
}
