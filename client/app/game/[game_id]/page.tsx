"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Component } from "@/components/ui/ai-assistant-card";
import html2canvas from "html2canvas";

// Note: Auth routes use /auth, but game/matchmaking routes use /api
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE_URL = `${API_URL}/api`;

interface GameData {
  id: string;
  players: string[];
  assigned_image: string | null;
  prompts: Record<string, string>;
  outputs: Record<string, string>;
  scores: Record<string, number>;
  winner: string | null;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export default function GameplayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const gameId = params.game_id as string;
  const playerName = searchParams.get("player");
  
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [generatedHTML, setGeneratedHTML] = useState<string>("");
  const [generatedCSS, setGeneratedCSS] = useState<string>("");
  const [generatedJS, setGeneratedJS] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "html" | "css" | "js">("preview");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch game data
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        console.log('Fetching game data for:', gameId);
        const response = await fetch(`${API_BASE_URL}/game/${gameId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch game: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Game data received:', data);
        setGameData(data.game);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching game:', err);
        setError(err instanceof Error ? err.message : "Failed to load game");
        setLoading(false);
      }
    };

    if (gameId) {
      fetchGameData();
    }
  }, [gameId]);

  // Calculate translation for animation
  useEffect(() => {
    const updateTranslation = () => {
      if (typeof window !== 'undefined') {
        const screenWidth = window.innerWidth;
        const cardWidth = 480; // max-w-[480px]
        const padding = 32; // p-8 = 32px
        
        // Distance from center to left position
        const centerPosition = (screenWidth - cardWidth) / 2;
        const leftPosition = padding;
        const translation = centerPosition - leftPosition;
        
        setTranslateX(translation);
      }
    };

    updateTranslation();
    window.addEventListener('resize', updateTranslation);
    return () => window.removeEventListener('resize', updateTranslation);
  }, []);

  const handleSubmit = async (submitted: boolean, promptText: string) => {
    if (!submitted || !playerName) return;
    
    setIsSubmitted(submitted);
    setIsGenerating(true);

    try {
      console.log('🚀 Submitting prompt to API:', { gameId, playerName, prompt: promptText });
      
      const response = await fetch(`${API_BASE_URL}/game/${gameId}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_name: playerName,
          prompt: promptText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit prompt: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Received generated output:', data);

      // Update game data with latest status
      if (data.game) {
        setGameData(data.game);
      }

      // The output is now nested in game.outputs[playerName]
      // Each player has their own html, css, js properties
      if (data.game && data.game.outputs && playerName) {
        const playerOutput = data.game.outputs[playerName];
        if (playerOutput) {
          setGeneratedHTML(playerOutput.html || "");
          setGeneratedCSS(playerOutput.css || "");
          setGeneratedJS(playerOutput.js || "");
        }
      }
      
      
      setIsGenerating(false);
    } catch (err) {
      console.error('❌ Error submitting prompt:', err);
      setError(err instanceof Error ? err.message : "Failed to submit prompt");
      setIsGenerating(false);
    }
  };

  const captureAndSubmitPreview = useCallback(async () => {
    if (!iframeRef.current || !gameId || !playerName || !generatedHTML) {
      console.error('❌ Missing required data for submission:', {
        hasIframe: !!iframeRef.current,
        gameId,
        playerName,
        hasGeneratedHTML: !!generatedHTML
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('📸 Starting automatic preview capture and submission...');
      
      // Get the iframe's content document
      const iframe = iframeRef.current;
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!iframeDocument) {
        throw new Error('Cannot access iframe content');
      }

      // Wait a bit for any animations/rendering to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('📷 Capturing iframe as canvas...');
      // Capture the iframe body as canvas
      const canvas = await html2canvas(iframeDocument.body, {
        backgroundColor: '#ffffff',
        scale: 1,
        useCORS: true,
        logging: false,
      });

      console.log('🖼️ Converting canvas to WebP blob...');
      // Convert canvas to WebP blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob: Blob | null) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          'image/webp',
          0.9 // quality (0-1)
        );
      });

      console.log('📄 Converting blob to base64 data URL...');
      // Convert blob to base64 data URL
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read blob as data URL'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      console.log('🚀 Submitting preview to /ai/submit API...', {
        game_id: gameId,
        player_name: playerName,
        image_size: dataUrl.length
      });

      // Submit to backend
      const response = await fetch(`${API_BASE_URL}/ai/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_id: gameId,
          player_name: playerName,
          image: dataUrl, // Send as base64 data URL
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to submit: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Automatic submission successful:', data);
      console.log('🎮 Game status:', data.game?.status);
      console.log('📊 Submission data:', {
        game_id: gameId,
        player_name: playerName,
        status: data.status,
        message: data.message
      });
      
    } catch (err) {
      console.error('❌ Error capturing/submitting preview:', err);
      console.error('Error details:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        gameId,
        playerName
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [gameId, playerName, generatedHTML]);

  // Poll game status when player has submitted their prompt
  useEffect(() => {
    if (!gameId || !playerName || !generatedHTML || hasAutoSubmitted) {
      return;
    }

    const pollGameStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/game/${gameId}`);
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const game = data.game;
        
        if (game) {
          setGameData(game);
          
          // Check if game is completed and iframe is loaded
          if (game.status === 'completed' && iframeLoaded && !hasAutoSubmitted) {
            console.log('🎯 Game completed and iframe loaded - triggering automatic submission');
            setHasAutoSubmitted(true);
            await captureAndSubmitPreview();
          }
        }
      } catch (err) {
        console.error('Error polling game status:', err);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollGameStatus, 2000);
    
    // Also check immediately
    pollGameStatus();

    return () => clearInterval(interval);
  }, [gameId, playerName, generatedHTML, iframeLoaded, hasAutoSubmitted, captureAndSubmitPreview]);

  // Check if game is already completed when iframe loads
  useEffect(() => {
    if (iframeLoaded && gameData?.status === 'completed' && generatedHTML && !hasAutoSubmitted) {
      console.log('🎯 Iframe loaded and game already completed - triggering automatic submission');
      setHasAutoSubmitted(true);
      captureAndSubmitPreview();
    }
  }, [iframeLoaded, gameData?.status, generatedHTML, hasAutoSubmitted, captureAndSubmitPreview]);

  // Poll for game completion and winner after submission
  useEffect(() => {
    if (!gameId || !hasAutoSubmitted) {
      return;
    }

    const pollForCompletion = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/game/${gameId}`);
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const game = data.game;
        
        if (game) {
          setGameData(game);
          
          // Check if game is completed and winner is determined
          if (game.status === 'completed' && game.winner !== null && game.winner !== undefined) {
            console.log('🎉 Game completed with winner:', game.winner);
            setGameCompleted(true);
          }
        }
      } catch (err) {
        console.error('Error polling for game completion:', err);
      }
    };

    // Poll every 2 seconds for completion
    const interval = setInterval(pollForCompletion, 2000);
    
    // Also check immediately
    pollForCompletion();

    return () => clearInterval(interval);
  }, [gameId, hasAutoSubmitted]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl font-mono">Loading game...</div>
      </div>
    );
  }

  // Error state
  if (error || !gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-xl font-mono">
            {error || "Game not found"}
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2 bg-white text-black font-mono text-sm hover:bg-white/90 transition-colors"
          >
            RETURN TO DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  // Determine opponent
  const opponentID = gameData.players.find(p => p !== playerName) || "Unknown";
  
  // Use assigned_image as the question/prompt for now
  // TODO: This might need to be updated based on your game logic
  const question = gameData.assigned_image || "Create something amazing!";

  return (
    <div 
      className="relative min-h-screen overflow-hidden"
      style={{
        backgroundImage: 'url(/IMG_1445.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 flex items-stretch p-8 gap-8">
        {/* Card container with smooth transform animation */}
        <div
          className="shrink-0 will-change-transform"
          style={{
            transform: `translateX(${isSubmitted ? 0 : translateX}px)`,
            transition: 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Component 
            opponentID={opponentID} 
            question={question}
            onSubmit={handleSubmit}
          />
        </div>
        
        {/* Right side content that fades in */}
        <div 
          className={`flex-1 transition-opacity duration-1000 delay-1000 ${
            isSubmitted ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {isGenerating ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white text-center space-y-4">
                <div className="text-2xl font-mono animate-pulse">
                  Generating your creation...
                </div>
                <div className="text-sm text-slate-400">
                  AI is bringing your prompt to life
                </div>
              </div>
            </div>
          ) : generatedHTML ? (
            <div className="w-full h-full flex flex-col space-y-4 p-4">
              {/* Game completion notification */}
              {gameCompleted && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg shadow-lg border-2 border-blue-400/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🎉</div>
                      <div>
                        <div className="font-bold text-lg">Game Completed!</div>
                        <div className="text-sm text-blue-100">
                          Winner: {gameData?.winner || 'Determined'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/results?game_id=${gameId}`)}
                      className="px-6 py-2 bg-white text-blue-700 font-bold rounded hover:bg-blue-50 transition-colors shadow-md"
                    >
                      View Results →
                    </button>
                  </div>
                </div>
              )}
              {/* Header with tabs */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="text-white text-lg font-mono shrink-0">
                  Your Generated Creation
                </div>
                <div className="flex gap-2 shrink-0">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveTab("preview")}
                      className={`px-3 py-2 font-mono text-xs transition-colors ${
                        activeTab === "preview"
                          ? "bg-white text-black"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setActiveTab("html")}
                      className={`px-3 py-2 font-mono text-xs transition-colors ${
                        activeTab === "html"
                          ? "bg-white text-black"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      HTML
                    </button>
                    <button
                      onClick={() => setActiveTab("css")}
                      className={`px-3 py-2 font-mono text-xs transition-colors ${
                        activeTab === "css"
                          ? "bg-white text-black"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      CSS
                    </button>
                    <button
                      onClick={() => setActiveTab("js")}
                      className={`px-3 py-2 font-mono text-xs transition-colors ${
                        activeTab === "js"
                          ? "bg-white text-black"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      JS
                    </button>
                  </div>
                  {isSubmitting && (
                    <div className="px-4 py-2 font-mono text-xs bg-green-600 text-white">
                      Submitting...
                    </div>
                  )}
                  {hasAutoSubmitted && !isSubmitting && !gameCompleted && (
                    <div className="px-4 py-2 font-mono text-xs bg-green-700 text-white">
                      ✓ Submitted
                    </div>
                  )}
                  {gameCompleted && (
                    <button
                      onClick={() => router.push(`/results?game_id=${gameId}`)}
                      className="px-4 py-2 font-mono text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      View Results →
                    </button>
                  )}
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-1 bg-white rounded-lg shadow-2xl overflow-auto border-4 border-slate-400/50 min-h-0">
                {activeTab === "preview" && (
                  <iframe
                    ref={iframeRef}
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <style>
                            body {
                              margin: 0;
                              padding: 16px;
                              font-family: system-ui, -apple-system, sans-serif;
                            }
                            ${generatedCSS}
                          </style>
                        </head>
                        <body>
                          ${generatedHTML}
                          <script>
                            ${generatedJS}
                          </script>
                        </body>
                      </html>
                    `}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                    title="Generated Output"
                    onLoad={() => {
                      console.log('✅ Iframe successfully loaded and rendered');
                      setIframeLoaded(true);
                    }}
                  />
                )}
                {activeTab === "html" && (
                  <pre className="w-full h-full p-6 overflow-auto bg-slate-900 text-green-400 font-mono text-sm">
                    <code>{generatedHTML}</code>
                  </pre>
                )}
                {activeTab === "css" && (
                  <pre className="w-full h-full p-6 overflow-auto bg-slate-900 text-blue-400 font-mono text-sm">
                    <code>{generatedCSS}</code>
                  </pre>
                )}
                {activeTab === "js" && (
                  <pre className="w-full h-full p-6 overflow-auto bg-slate-900 text-yellow-400 font-mono text-sm">
                    <code>{generatedJS}</code>
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white text-lg">
                <div className="font-mono space-y-2 text-center">
                  <p className="text-2xl">⏳</p>
                  <p>Waiting for generation to complete...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

