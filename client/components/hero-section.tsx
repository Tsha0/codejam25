"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Canvas } from "@react-three/fiber"
import { ShaderPlane } from "./ui/background-paper-shaders"
import { Sparkles } from "lucide-react"

interface HeroSectionProps {
  onFindGame: () => void
  onHowItWorks: () => void
}

export function HeroSection({ onFindGame, onHowItWorks }: HeroSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full"
    >
      <div className="relative rounded-3xl overflow-hidden">
        {/* Three.js WebGL Shader Background */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
            <ShaderPlane position={[0, 0, 0]} color1="#9333ea" color2="#ffffff" />
          </Canvas>
        </div>
        
        <Card className="relative border-white/10 bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-purple-950/90 backdrop-blur-xl shadow-2xl shadow-purple-500/10">
          <div className="p-8 md:p-12 lg:p-16 space-y-8">
            {/* Title with animated icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />
                </motion.div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-purple-400">
                  Competitive Vibecoding
                </h1>
              </div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-xl md:text-2xl text-purple-200 text-center font-medium"
              >
                A 1v1 prompt battle to recreate iconic apps by vibe alone.
              </motion.p>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-base md:text-lg text-gray-300 text-center max-w-2xl mx-auto leading-relaxed"
            >
              Challenge your friends in a creative showdown. Each player writes one prompt to recreate a mystery app's UI. 
              An AI judges which design captures the essence—no code needed, just pure creative instinct.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  onClick={onFindGame}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold px-8 py-6 text-lg rounded-full shadow-lg shadow-purple-500/30 transition-all duration-300"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Find Game
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  onClick={onHowItWorks}
                  size="lg"
                  variant="ghost"
                  className="text-purple-200 hover:text-white hover:bg-white/5 font-medium px-8 py-6 text-lg rounded-full transition-all duration-300"
                >
                  How it works
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </Card>
      </div>
    </motion.div>
  )
}

