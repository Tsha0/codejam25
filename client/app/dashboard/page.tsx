"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ChevronRight,
  LogOut,
  Settings,
  User,
  Clock
} from "lucide-react"

// Mock user data - will be fetched from MongoDB
const mockUser = {
  name: "CodeWarrior",
  email: "warrior@example.com",
  games: [
    { id: "1", opponent: "VibeKing", result: "win", date: "2 hours ago", duration: "12:34" },
    { id: "2", opponent: "CodeNinja", result: "win", date: "5 hours ago", duration: "15:22" },
    { id: "3", opponent: "HackerPro", result: "loss", date: "1 day ago", duration: "18:45" },
    { id: "4", opponent: "DevMaster", result: "win", date: "1 day ago", duration: "11:20" },
    { id: "5", opponent: "ByteBlaster", result: "win", date: "2 days ago", duration: "14:10" },
    { id: "6", opponent: "TechWizard", result: "loss", date: "3 days ago", duration: "16:30" },
    { id: "7", opponent: "CodeMaster", result: "win", date: "3 days ago", duration: "10:15" },
    { id: "8", opponent: "DevNinja", result: "win", date: "4 days ago", duration: "13:45" }
  ]
}

export default function DashboardPage() {

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
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
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
                {mockUser.name}
              </h1>
              <p className="text-sm text-white/60 font-mono">{mockUser.email}</p>
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
            <div className="space-y-2">
              {mockUser.games.map((game) => (
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
                      <div className="text-sm text-white/60 font-mono">{game.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-sm text-white/60 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {game.duration}
                    </div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

