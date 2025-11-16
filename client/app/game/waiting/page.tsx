"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TypingAnimation } from "@/components/ui/typing-animation";

// Note: Auth routes use /auth, but game/matchmaking routes use /api
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE_URL = `${API_URL}/api`;

// Extend Window interface for UnicornStudio
declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized: boolean;
      init?: () => void;
    };
  }
}

export default function WaitingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"connecting" | "queued" | "matched" | "error">("connecting");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [position, setPosition] = useState<number>(0);
  
  // Get player name from authenticated user or URL parameter
  const [playerName] = useState(() => {
    // Try to get from URL first
    const urlPlayer = searchParams.get("player");
    if (urlPlayer) return urlPlayer;
    
    // Try to get from authenticated user
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return user.username || user.name || `Player_${Math.floor(Math.random() * 10000)}`;
        } catch (e) {
          console.error("Failed to parse user from localStorage:", e);
        }
      }
    }
    
    // Fallback to random name (for testing without auth)
    return `Player_${Math.floor(Math.random() * 10000)}`;
  });

  useEffect(() => {
    console.log('🔵 useEffect running for player:', playerName);
    
    let pollInterval: NodeJS.Timeout | null = null;
    let isActive = true;

    const joinMatchmaking = async () => {
      try {
        console.log('🔵 Joining matchmaking as:', playerName);
        const response = await fetch(`${API_BASE_URL}/matchmaking/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ player_name: playerName }),
        });

        if (!response.ok) {
          throw new Error(`Failed to join matchmaking: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('🔵 Matchmaking response:', data);

        if (!isActive) return;

        if (data.status === "matched" && data.game) {
          setStatus("matched");
          // Redirect to game page with game ID
          setTimeout(() => {
            router.push(`/game/${data.game.id}?player=${encodeURIComponent(playerName)}`);
          }, 1000);
        } else if (data.status === "queued") {
          setStatus("queued");
          setPosition(data.position || 1);
          // Start polling for match
          startPolling(playerName);
        }
      } catch (error) {
        console.error("Matchmaking error:", error);
        if (isActive) {
          setStatus("error");
          setErrorMessage(error instanceof Error ? error.message : "Failed to connect to server");
        }
      }
    };

    const startPolling = (playerName: string) => {
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/matchmaking/join`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ player_name: playerName }),
          });

          if (!response.ok) return;

          const data = await response.json();

          if (!isActive) return;

          if (data.status === "matched" && data.game) {
            setStatus("matched");
            if (pollInterval) clearInterval(pollInterval);
            // Redirect to game page with game ID
            setTimeout(() => {
              router.push(`/game/${data.game.id}?player=${encodeURIComponent(playerName)}`);
            }, 1000);
          } else if (data.status === "queued") {
            setPosition(data.position || 1);
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 2000); // Poll every 2 seconds
    };

    joinMatchmaking();

    return () => {
      isActive = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [router, searchParams, playerName]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [dots, setDots] = useState("");

  useEffect(() => {
    let embedScript: HTMLScriptElement | null = null;
    let style: HTMLStyleElement | null = null;

    const initUnicornStudio = () => {
      embedScript = document.createElement("script");
      embedScript.type = "text/javascript";
      embedScript.textContent = `
        !function(){
          if(!window.UnicornStudio){
            window.UnicornStudio={isInitialized:!1};
            var i=document.createElement("script");
            i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.33/dist/unicornStudio.umd.js";
            i.onload=function(){
              window.UnicornStudio.isInitialized||(UnicornStudio.init(),window.UnicornStudio.isInitialized=!0);
              window.dispatchEvent(new Event('unicornstudio-loaded'));
            };
            (document.head || document.body).appendChild(i)
          } else if(window.UnicornStudio.isInitialized) {
            window.dispatchEvent(new Event('unicornstudio-loaded'));
          }
        }();
      `;
      document.head.appendChild(embedScript);
    };

    initUnicornStudio();

    // Add CSS to hide branding elements and crop canvas
    // Only add if it doesn't already exist
    const existingStyle = document.querySelector('style[data-unicorn-studio-style]');
    if (!existingStyle) {
      style = document.createElement("style");
      style.setAttribute('data-unicorn-studio-style', 'true');
      style.textContent = `
        [data-us-project] {
          position: relative !important;
          overflow: hidden !important;
        }
        
        [data-us-project] canvas {
          clip-path: inset(0 0 10% 0) !important;
        }
        
        [data-us-project] * {
          pointer-events: none !important;
        }
        [data-us-project] a[href*="unicorn"],
        [data-us-project] button[title*="unicorn"],
        [data-us-project] div[title*="Made with"],
        [data-us-project] .unicorn-brand,
        [data-us-project] [class*="brand"],
        [data-us-project] [class*="credit"],
        [data-us-project] [class*="watermark"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          position: absolute !important;
          left: -9999px !important;
          top: -9999px !important;
        }
      `;
      document.head.appendChild(style);
    }

    const hideBranding = () => {
      const projectDiv = document.querySelector("[data-us-project]");
      if (projectDiv) {
        const allElements = projectDiv.querySelectorAll("*");
        allElements.forEach((el) => {
          const text = (el.textContent || "").toLowerCase();
          if (text.includes("made with") || text.includes("unicorn")) {
            el.remove();
          }
        });
      }
    };

    hideBranding();
    const interval = setInterval(hideBranding, 100);

    setTimeout(hideBranding, 1000);
    setTimeout(hideBranding, 3000);
    setTimeout(hideBranding, 5000);

    // Wait for UnicornStudio to load and the project to initialize
    let unicornLoaded = false;
    let minTimeElapsed = false;

    const checkAndShow = () => {
      if (unicornLoaded && minTimeElapsed) {
        setIsLoaded(true);
      }
    };

    const handleUnicornLoad = () => {
      // Give UnicornStudio a moment to render the project
      setTimeout(() => {
        unicornLoaded = true;
        checkAndShow();
      }, 500);
    };

    window.addEventListener('unicornstudio-loaded', handleUnicornLoad);

    // Also ensure minimum loading time for smooth experience
    const minTimeout = setTimeout(() => {
      minTimeElapsed = true;
      checkAndShow();
    }, 1500);

    // Fallback: show content after max wait time even if UnicornStudio hasn't loaded
    const maxTimeout = setTimeout(() => {
      setIsLoaded(true);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(minTimeout);
      clearTimeout(maxTimeout);
      window.removeEventListener('unicornstudio-loaded', handleUnicornLoad);
      // Only remove script if we created it and UnicornStudio isn't initialized
      // (don't remove if it's being used by other pages)
      if (embedScript && document.head.contains(embedScript) && !window.UnicornStudio?.isInitialized) {
        document.head.removeChild(embedScript);
      }
      // Don't remove the style - it's shared across pages and has a data attribute to prevent duplicates
    };
  }, []);

  // Animated dots effect for searching
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      {/* Unicorn Studio background - desktop */}
      <div 
        className="absolute inset-0 w-full h-full hidden lg:block transition-opacity duration-700"
        style={{ opacity: isLoaded ? 1 : 0 }}
      >
        <div
          data-us-project="sruhpQe3j1VOgVQHtJZf"
          style={{ width: "100%", height: "100%", minHeight: "100vh" }}
        />
      </div>

      {/* Mobile stars background */}
      <div 
        className="absolute inset-0 w-full h-full lg:hidden stars-bg transition-opacity duration-700"
        style={{ opacity: isLoaded ? 1 : 0 }}
      />

      {/* Foreground content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          {status === "connecting" && (
            <TypingAnimation
              className="text-4xl font-bold text-white"
              text="Connecting to server..."
            />
          )}
          {status === "queued" && (
            <>
              <TypingAnimation
                className="text-4xl font-bold text-white"
                text="Finding Opponent..."
              />
              {position > 0 && (
                <p className="text-white/70 text-lg font-mono">
                  Position in queue: {position}
                </p>
              )}
            </>
          )}
          {status === "matched" && (
            <TypingAnimation
              className="text-4xl font-bold text-green-400"
              text="Match Found! Redirecting..."
            />
          )}
          {status === "error" && (
            <div className="space-y-3">
              <p className="text-4xl font-bold text-red-400">Connection Error</p>
              <p className="text-white/70 text-sm font-mono max-w-md">
                {errorMessage}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-white text-black font-mono text-sm hover:bg-white/90 transition-colors"
              >
                RETRY
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .stars-bg {
          background-image: radial-gradient(1px 1px at 20% 30%, white, transparent),
            radial-gradient(1px 1px at 60% 70%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1px 1px at 80% 10%, white, transparent),
            radial-gradient(1px 1px at 90% 60%, white, transparent),
            radial-gradient(1px 1px at 33% 80%, white, transparent),
            radial-gradient(1px 1px at 15% 60%, white, transparent),
            radial-gradient(1px 1px at 70% 40%, white, transparent);
          background-size: 200% 200%, 180% 180%, 250% 250%, 220% 220%, 190% 190%,
            240% 240%, 210% 210%, 230% 230%;
          background-position: 0% 0%, 40% 40%, 60% 60%, 20% 20%, 80% 80%, 30% 30%,
            70% 70%, 50% 50%;
          opacity: 0.3;
        }
      `}</style>
    </main>
  );
}
