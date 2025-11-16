"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string
    const confirmPassword = formData.get("confirmPassword") as string
    
    // Validate passwords match for signup
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }
    
    try {
      const endpoint = isSignUp ? "/auth/signup" : "/auth/login"
      const body = isSignUp 
        ? { email, password, name, username: name }
        : { email, password }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed")
      }
      
      // Save token to localStorage
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      
      // Redirect to dashboard
      router.push("/dashboard")
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes glare {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .glare-text {
          background: linear-gradient(
            90deg,
            transparent 0%,
            transparent 35%,
            rgba(255, 255, 255, 0.9) 45%,
            rgba(255, 255, 255, 1) 50%,
            rgba(255, 255, 255, 0.9) 55%,
            transparent 65%,
            transparent 100%
          );
          background-size: 200% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: glare 3s ease-in-out infinite;
          mix-blend-mode: overlay;
        }
        .glowing-card {
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3),
                      0 0 40px rgba(255, 255, 255, 0.2),
                      0 0 60px rgba(255, 255, 255, 0.1),
                      0 0 80px rgba(255, 255, 255, 0.05);
        }
      `}} />
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-foreground via-foreground to-muted/20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl animate-pulse" 
               style={{ animationDuration: "4s" }} />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary/10 to-transparent rounded-full blur-3xl animate-pulse" 
               style={{ animationDuration: "5s", animationDelay: "1s" }} />
        </div>

        {/* Auth Card */}
        <div className="relative z-10 w-full max-w-md px-4">
          <div className="mb-8 text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight relative inline-block">
              <span className="bg-gradient-to-r from-background to-background/70 bg-clip-text text-transparent">
                Ready to Prompt?
              </span>
              <span className="glare-text absolute inset-0 bg-gradient-to-r from-background to-background/70 bg-clip-text text-transparent pointer-events-none">
                Ready to Prompt?
              </span>
            </h1>
          <p className="text-foreground">
            {isSignUp ? "Create your account to get started" : "Sign in to continue to your account"}
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-2xl glowing-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {isSignUp ? "Create Account" : "Sign In"}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? "Enter your information to create an account" 
                : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field (Sign Up Only) */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    required={isSignUp}
                    disabled={isLoading}
                    className="transition-all duration-200"
                  />
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className="transition-all duration-200"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                      onClick={() => console.log("Forgot password")}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="transition-all duration-200"
                />
              </div>

              {/* Confirm Password (Sign Up Only) */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required={isSignUp}
                    disabled={isLoading}
                    autoComplete="new-password"
                    className="transition-all duration-200"
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg 
                      className="animate-spin h-4 w-4" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  isSignUp ? "Create Account" : "Sign In"
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Social Sign In Options */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => console.log("GitHub OAuth")}
                  className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => console.log("Google OAuth")}
                  className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
              </div>
            </form>

            {/* Toggle Sign In/Sign Up */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
              </span>{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-semibold hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
                disabled={isLoading}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="mt-6 text-center text-xs text-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
    </>
  )
}

