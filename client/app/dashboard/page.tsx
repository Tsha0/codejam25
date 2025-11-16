"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ChevronRight,
  LogOut,
  Settings,
  User,
  Clock,
  Loader2
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Game {
  id: string
  opponent: string
  result: "win" | "loss"
  duration: number
  completedAt: string
}

interface DashboardData {
  user: {
    id: string
    name: string
    email: string
    username: string
    avatar?: string
  }
  games: Game[]
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        router.push("/auth")
        return
      }

      const response = await fetch(`${API_URL}/api/dashboard`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          router.push("/auth")
          return
        }
        throw new Error("Failed to fetch dashboard data")
      }

      const data = await response.json()
      setDashboardData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/auth")
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return "1 day ago"
    return `${diffDays} days ago`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Failed to load dashboard"}</p>
          <Button onClick={() => router.push("/auth")}>Go to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/20 bg-black/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="font-mono text-xl font-bold tracking-widest italic transform -skew-x-12">
                CODEJAM25
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
              <span className="text-sm font-mono text-white/60 group-hover:text-white/90 transition-colors">
                DASHBOARD
              </span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link href="/game/waiting">
                <Button className="bg-white text-black hover:bg-white/90 font-mono">
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
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* User Profile Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/5">
              <User className="w-8 h-8 text-white/60" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold font-mono tracking-wider mb-1">
                {dashboardData.user.name}
              </h1>
              <p className="text-sm text-white/60 font-mono">{dashboardData.user.email}</p>
            </div>
          </div>
        </div>

        {/* Game History */}
        <Card className="bg-white/5 border-white/20">
          <CardHeader>
            <CardTitle className="font-mono">MATCH HISTORY</CardTitle>
            <CardDescription className="font-mono">All your games</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.games.length === 0 ? (
              <div className="text-center py-12 text-white/60">
                <p className="font-mono">No games played yet</p>
                <p className="text-sm mt-2">Start your first match to see your history here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dashboardData.games.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        game.result === "win" ? "bg-green-400" : "bg-red-400"
                      }`} />
                      <div>
                        <div className="font-mono font-semibold text-white">vs {game.opponent}</div>
                        <div className="text-sm text-white/60 font-mono">{formatDate(game.completedAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {game.duration && (
                        <div className="text-sm text-white/60 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(game.duration)}
                        </div>
                      )}
                      <div className={`px-4 py-1 rounded text-sm font-mono font-semibold ${
                        game.result === "win" 
                          ? "bg-green-400/20 text-green-400 border border-green-400/30" 
                          : "bg-red-400/20 text-red-400 border border-red-400/30"
                      }`}>
                        {game.result.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

