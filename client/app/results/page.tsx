"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Component } from "@/components/ui/etheral-shadow";

interface CodeContent {
  html?: string;
  css?: string;
  js?: string;
}

interface GameResult {
  player1: {
    username: string;
    prompt: string;
    code: string | CodeContent;
    output: string;
    score: number;
  };
  player2: {
    username: string;
    prompt: string;
    code: string | CodeContent;
    output: string;
    score: number;
  };
  targetImage: string;
  winner: string;
}

interface CategoryScore {
  name: string;
  key: string;
  score: number;
}

interface PlayerCardProps {
  player: {
    username: string;
    prompt: string;
    output: string;
    score: number;
  };
  isWinner: boolean;
  categories: CategoryScore[];
  opponentCategories?: CategoryScore[];
  onOpenModal?: () => void;
}

const player1Categories: CategoryScore[] = [
  { name: "Visual Design and Aesthetics", key: "color", score: 92 },
  { name: "Adherence to requirement", key: "composition", score: 88 },
  { name: "Creativity and Innovation", key: "detail", score: 85 },
  { name: "Prompt Clearity", key: "lighting", score: 90 },
  { name: "Prompt Formulation", key: "overall", score: 87 },
];

const player2Categories: CategoryScore[] = [
  { name: "Visual Design and Aesthetics", key: "color", score: 85 },
  { name: "Adherence to requirement", key: "composition", score: 91 },
  { name: "Creativity and Innovation", key: "detail", score: 82 },
  { name: "Prompt Clearity", key: "lighting", score: 88 },
  { name: "Prompt Formulation", key: "overall", score: 84 },
];

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  code: string | CodeContent;
  username: string;
}

function PromptModal({ isOpen, onClose, prompt, code, username }: PromptModalProps) {
  const [activeTab, setActiveTab] = useState<'prompt' | 'code'>('prompt');
  const [activeSubTab, setActiveSubTab] = useState<'html' | 'css' | 'js'>('html');
  
  // Parse code if it's a string, otherwise use the CodeContent object
  const codeContent: CodeContent = typeof code === 'string' 
    ? { html: code } // Default to HTML if string
    : code;
  
  const hasSubtabs = activeTab === 'code' && (codeContent.html || codeContent.css || codeContent.js);
  
  // Reset subtab when switching to code tab
  const handleTabChange = (tab: 'prompt' | 'code') => {
    setActiveTab(tab);
    if (tab === 'code') {
      // Set to first available subtab
      if (codeContent.html) setActiveSubTab('html');
      else if (codeContent.css) setActiveSubTab('css');
      else if (codeContent.js) setActiveSubTab('js');
    }
  };
  
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-[#0a0a0a] border-2 border-green-500/50 rounded-lg shadow-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 30px rgba(34, 197, 94, 0.3), 0 0 60px rgba(34, 197, 94, 0.1)',
        }}
      >
        {/* Terminal Header */}
        <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 border-b border-green-500/30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-green-400 text-sm font-mono ml-2">
              {username}@prompt-terminal
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-green-400 hover:text-green-300 transition-colors text-xl font-mono"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-black/30 border-b border-green-500/20">
          <div className="flex">
            <button
              onClick={() => handleTabChange('prompt')}
              className={`px-6 py-3 font-mono text-sm transition-all ${
                activeTab === 'prompt'
                  ? 'text-green-400 bg-green-900/20 border-b-2 border-green-500'
                  : 'text-green-600 hover:text-green-500 hover:bg-green-900/10'
              }`}
            >
              Prompt
            </button>
            <button
              onClick={() => handleTabChange('code')}
              className={`px-6 py-3 font-mono text-sm transition-all ${
                activeTab === 'code'
                  ? 'text-green-400 bg-green-900/20 border-b-2 border-green-500'
                  : 'text-green-600 hover:text-green-500 hover:bg-green-900/10'
              }`}
            >
              Code
            </button>
          </div>
          
          {/* Subtabs for Code */}
          {hasSubtabs && (
            <div className="flex border-t border-green-500/10 bg-black/20">
              {codeContent.html && (
                <button
                  onClick={() => setActiveSubTab('html')}
                  className={`px-4 py-2 font-mono text-xs transition-all ${
                    activeSubTab === 'html'
                      ? 'text-green-400 bg-green-900/10 border-b border-green-500'
                      : 'text-green-600/70 hover:text-green-500 hover:bg-green-900/5'
                  }`}
                >
                  HTML
                </button>
              )}
              {codeContent.css && (
                <button
                  onClick={() => setActiveSubTab('css')}
                  className={`px-4 py-2 font-mono text-xs transition-all ${
                    activeSubTab === 'css'
                      ? 'text-green-400 bg-green-900/10 border-b border-green-500'
                      : 'text-green-600/70 hover:text-green-500 hover:bg-green-900/5'
                  }`}
                >
                  CSS
                </button>
              )}
              {codeContent.js && (
                <button
                  onClick={() => setActiveSubTab('js')}
                  className={`px-4 py-2 font-mono text-xs transition-all ${
                    activeSubTab === 'js'
                      ? 'text-green-400 bg-green-900/10 border-b border-green-500'
                      : 'text-green-600/70 hover:text-green-500 hover:bg-green-900/5'
                  }`}
                >
                  JS
                </button>
              )}
            </div>
          )}
        </div>

        {/* Terminal Content */}
        <div className="p-6 font-mono text-sm max-h-[60vh] overflow-y-auto">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-green-500">$</span>
            <span className="text-green-400">
              {activeTab === 'prompt' 
                ? 'cat prompt.txt' 
                : activeSubTab === 'html' 
                  ? 'cat generated.html' 
                  : activeSubTab === 'css'
                    ? 'cat generated.css'
                    : 'cat generated.js'}
            </span>
          </div>
          
          <div className="bg-black/40 border border-green-500/20 rounded p-4 mb-4">
            {activeTab === 'prompt' ? (
              <pre className="text-green-300 whitespace-pre-wrap leading-relaxed">
                {prompt}
              </pre>
            ) : (
              <pre className="text-green-300 whitespace-pre-wrap leading-relaxed text-xs">
                {activeSubTab === 'html' && codeContent.html
                  ? codeContent.html
                  : activeSubTab === 'css' && codeContent.css
                    ? codeContent.css
                    : activeSubTab === 'js' && codeContent.js
                      ? codeContent.js
                      : '// Code not available'}
              </pre>
            )}
          </div>

          <div className="flex items-center gap-2 text-green-500/60">
            <span className="animate-pulse">▊</span>
            <span className="text-xs">Press ESC or click outside to close</span>
          </div>
        </div>

        {/* Scanline Effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 197, 94, 0.1) 2px, rgba(34, 197, 94, 0.1) 4px)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

function PlayerCard({ player, isWinner, side, categories, opponentCategories, onOpenModal }: PlayerCardProps & { side: 'left' | 'right' }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    // Trigger category animation after a short delay
    const timer = setTimeout(() => {
      setShowCategories(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const isHigherThanOpponent = (categoryKey: string, myScore: number): boolean => {
    if (!opponentCategories) return false;
    const opponentCategory = opponentCategories.find(cat => cat.key === categoryKey);
    return opponentCategory ? myScore > opponentCategory.score : false;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Image with hover effect */}
      <motion.div
        className="relative w-[25vw] aspect-video cursor-pointer mb-3"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={onOpenModal}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: 1,
          scale: isHovered ? 1.05 : 1,
        }}
        transition={{
          opacity: { duration: 0.5 },
          scale: { duration: 0.3 },
        }}
        style={
          isWinner
            ? {
                filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5)) drop-shadow(0 0 40px rgba(240, 248, 255, 0.35)) drop-shadow(0 0 60px rgba(255, 255, 255, 0.15))',
              }
            : {}
        }
      >
        <img
          src={player.output}
          alt={`${player.username}'s submission`}
          className="w-full h-full object-cover rounded-lg shadow-2xl transition-all duration-300"
        />
      </motion.div>

      {/* Categories that fade in one by one */}
      <div className="space-y-1.5 w-[25vw]">
        {categories.map((category, index) => {
          const isHigher = isHigherThanOpponent(category.key, category.score);
          return (
            <motion.div
              key={category.key}
              initial={{ opacity: 0, y: 10 }}
              animate={
                showCategories
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 10 }
              }
              transition={{
                duration: 0.3,
                delay: index * 0.08, // Stagger animation (0.4s total for 5 items)
              }}
              className="bg-gradient-to-br from-gray-900 to-black rounded-lg p-2 border border-gray-700 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
              }}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs text-white font-medium">{category.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={showCategories ? { width: `${category.score}%` } : { width: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.08 + 0.2,
                      }}
                      className="h-full relative"
                      style={{
                        background: 'linear-gradient(to right, #A8A8A8, #E8E8E8, #C0C0C0, #F0F0F0, #B8B8B8)',
                      }}
                    >
                      {isHigher && (
                        <motion.div
                          className="absolute inset-0"
                          animate={{
                            backgroundPosition: ['0% 0%', '200% 0%'],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)',
                            backgroundSize: '50% 100%',
                          }}
                        />
                      )}
                    </motion.div>
                  </div>
                  <span className="text-xs text-white font-semibold w-8 text-right">
                    {category.score}%
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface PlayerInfoProps {
  player: {
    username: string;
    score: number;
  };
  isWinner: boolean;
}

function PlayerInfo({ player, isWinner, side }: PlayerInfoProps & { side: 'left' | 'right' }) {
  return (
    <div className={`flex flex-col ${side === 'left' ? 'items-end' : 'items-start'} justify-center gap-2`}>
      <div className="flex items-center gap-2">
        {isWinner && side === 'right' && <span className="text-xl">👑</span>}
        <h3 className="text-lg font-bold text-white whitespace-nowrap">
          {player.username}
        </h3>
        {isWinner && side === 'left' && <span className="text-xl">👑</span>}
      </div>
      <Badge variant="secondary" className="text-xs px-2 py-0.5">
        Score: {player.score}
      </Badge>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState<'player1' | 'player2' | null>(null);

  useEffect(() => {
    // TODO: Fetch actual game results from your backend
    // For now, using mock data
    const mockResult: GameResult = {
      player1: {
        username: "CodeWarrior",
        prompt: "A serene mountain landscape with snow-capped peaks at sunset",
        code: {
          html: `<div class="landscape-container">
  <div class="mountains">
    <div class="mountain peak-1"></div>
    <div class="mountain peak-2"></div>
    <div class="mountain peak-3"></div>
  </div>
  <div class="sun"></div>
  <div class="snow-layer"></div>
</div>`,
          css: `.landscape-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: linear-gradient(to bottom, #ff6b35, #8b5cf6, #1e3a8a);
  overflow: hidden;
}

.mountains {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 66.67%;
}

.mountain {
  position: absolute;
  bottom: 0;
  background: linear-gradient(to top, #1f2937, #4b5563);
  clip-path: polygon(0 100%, 50% 0, 100% 100%);
}

.peak-1 { left: 10%; width: 30%; height: 100%; }
.peak-2 { left: 40%; width: 35%; height: 120%; }
.peak-3 { left: 70%; width: 25%; height: 90%; }

.sun {
  position: absolute;
  top: 25%;
  left: 50%;
  transform: translateX(-50%);
  width: 128px;
  height: 128px;
  background: #fb923c;
  border-radius: 50%;
  box-shadow: 0 0 40px rgba(251, 146, 60, 0.8);
}

.snow-layer {
  position: absolute;
  top: 0;
  width: 100%;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.8), transparent);
}`,
          js: `document.addEventListener('DOMContentLoaded', () => {
  const sun = document.querySelector('.sun');
  const mountains = document.querySelectorAll('.mountain');
  
  // Animate sun movement
  let sunPosition = 25;
  setInterval(() => {
    sunPosition = (sunPosition + 0.1) % 100;
    sun.style.top = sunPosition + '%';
  }, 50);
  
  // Add parallax effect to mountains
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    mountains.forEach((mountain, index) => {
      const speed = 0.5 + (index * 0.1);
      mountain.style.transform = \`translateY(\${scrolled * speed}px)\`;
    });
  });
});`
        },
        output: "/p1.png",
        score: 87.5,
      },
      player2: {
        username: "AIArtist",
        prompt: "Beautiful mountain scenery during golden hour with dramatic clouds",
        code: {
          html: `<div class="golden-hour-scene">
  <div class="clouds">
    <div class="cloud cloud-1"></div>
    <div class="cloud cloud-2"></div>
    <div class="cloud cloud-3"></div>
  </div>
  <svg class="mountain-range" viewBox="0 0 1200 400">
    <polygon class="mountain-silhouette" points="0,400 200,100 400,200 600,50 800,150 1000,80 1200,400" />
  </svg>
</div>`,
          css: `.golden-hour-scene {
  position: relative;
  width: 100%;
  height: 100vh;
  background: linear-gradient(to bottom, #fde047, #fb923c, #9333ea);
  overflow: hidden;
}

.clouds {
  position: absolute;
  top: 0;
  width: 100%;
  height: 40%;
}

.cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  filter: blur(40px);
}

.cloud-1 {
  top: 80px;
  left: 40px;
  width: 192px;
  height: 96px;
}

.cloud-2 {
  top: 128px;
  right: 80px;
  width: 256px;
  height: 128px;
  background: rgba(255, 255, 255, 0.4);
  filter: blur(60px);
}

.cloud-3 {
  top: 160px;
  left: 50%;
  width: 180px;
  height: 90px;
}

.mountain-range {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 60%;
}

.mountain-silhouette {
  fill: url(#mountain-gradient);
}

.mountain-range defs linearGradient {
  --gradient-start: #4b5563;
  --gradient-end: #1f2937;
}`,
          js: `document.addEventListener('DOMContentLoaded', () => {
  const clouds = document.querySelectorAll('.cloud');
  
  // Animate clouds drifting
  clouds.forEach((cloud, index) => {
    let position = index * 20;
    setInterval(() => {
      position = (position + 0.2) % 100;
      cloud.style.left = position + '%';
    }, 50);
  });
  
  // Add golden hour glow effect
  const scene = document.querySelector('.golden-hour-scene');
  let glowIntensity = 0.5;
  setInterval(() => {
    glowIntensity = 0.5 + Math.sin(Date.now() / 2000) * 0.2;
    scene.style.filter = \`brightness(\${1 + glowIntensity})\`;
  }, 50);
});`
        },
        output: "/p2.png",
        score: 72.3,
      },
      targetImage: "/IMG_1445.JPG",
      winner: "CodeWarrior",
    };

    // Simulate loading
    setTimeout(() => {
      setGameResult(mockResult);
      setLoading(false);
    }, 500);
  }, []);

  // ESC key handler to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenModal(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  if (loading || !gameResult) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 z-0">
          <Component
            color="rgba(30, 30, 35, 1)"
            animation={{ scale: 100, speed: 90 }}
            noise={{ opacity: 0.8, scale: 1.2 }}
            sizing="fill"
          />
        </div>
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-white text-2xl">Loading results...</div>
        </div>
      </div>
    );
  }

  const isPlayer1Winner = gameResult.winner === gameResult.player1.username;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Ethereal Shadow Background */}
      <div className="absolute inset-0 z-0">
        <Component
          color="rgba(30, 30, 35, 1)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 0.8, scale: 1.2 }}
          sizing="fill"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between py-8 px-8 text-white">
        {/* Player Comparison - Side by Side */}
        <div className="flex justify-center items-center gap-8 px-8 flex-1">
          {/* Player 1 Info */}
          <PlayerInfo
            player={gameResult.player1}
            isWinner={isPlayer1Winner}
            side="left"
          />
          
          {/* Player 1 Card */}
          <PlayerCard
            player={gameResult.player1}
            isWinner={isPlayer1Winner}
            side="left"
            categories={player1Categories}
            opponentCategories={player2Categories}
            onOpenModal={() => setOpenModal('player1')}
          />

          {/* Player 2 Card */}
          <PlayerCard
            player={gameResult.player2}
            isWinner={!isPlayer1Winner}
            side="right"
            categories={player2Categories}
            opponentCategories={player1Categories}
            onOpenModal={() => setOpenModal('player2')}
          />
          
          {/* Player 2 Info */}
          <PlayerInfo
            player={gameResult.player2}
            isWinner={!isPlayer1Winner}
            side="right"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            onClick={() => router.push("/dashboard")}
            className="relative overflow-hidden group"
            style={{
              background: 'linear-gradient(145deg, #4a4a4a, #2a2a2a)',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(150, 150, 150, 0.3)',
            }}
          >
            <span className="relative z-10 text-white font-semibold">Dashboard</span>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
              }}
            />
          </Button>
          <Button
            size="lg"
            onClick={() => router.push("/game/waiting")}
            className="relative overflow-hidden group"
            style={{
              background: 'linear-gradient(145deg, #1a4d2e, #0d3320)',
              boxShadow: '0 8px 16px rgba(34, 197, 94, 0.3), 0 0 20px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
            }}
          >
            <span className="relative z-10 text-green-300 font-semibold">Play Again</span>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(145deg, rgba(34, 197, 94, 0.2) 0%, transparent 50%, rgba(34, 197, 94, 0.2) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
              }}
            />
          </Button>
        </div>
        
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>

      {/* Modals */}
      <PromptModal
        isOpen={openModal === 'player1'}
        onClose={() => setOpenModal(null)}
        prompt={gameResult.player1.prompt}
        code={gameResult.player1.code}
        username={gameResult.player1.username}
      />
      <PromptModal
        isOpen={openModal === 'player2'}
        onClose={() => setOpenModal(null)}
        prompt={gameResult.player2.prompt}
        code={gameResult.player2.code}
        username={gameResult.player2.username}
      />
    </div>
  );
}
