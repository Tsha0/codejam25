"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Canvas } from "@react-three/fiber"
import { ShaderPlane } from "./ui/background-paper-shaders"

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
            <ShaderPlane position={[0, 0, 0]} color1="#666666" color2="#ffffff" />
          </Canvas>
        </div>
        
        <Card className="relative border-white/10 bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-zinc-950/90 backdrop-blur-xl shadow-2xl shadow-white/10">
          <div className="p-8 md:p-12 lg:p-16 space-y-8">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 pb-1">
                  Competitive Vibecoding
                </h1>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
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
                  className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-semibold px-8 py-6 text-lg rounded-full transition-all duration-300"
                >
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
                  className="text-gray-300 hover:text-white hover:bg-white/5 font-medium px-8 py-6 text-lg rounded-full transition-all duration-300"
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

