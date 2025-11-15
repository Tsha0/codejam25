"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Canvas } from "@react-three/fiber"
import { ShaderPlane } from "./ui/background-paper-shaders"
import { Monitor } from "lucide-react"

export function MockPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
      className="w-full"
    >
      <div className="relative rounded-3xl overflow-hidden">
        {/* Three.js WebGL Shader Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
            <ShaderPlane position={[0, 0, 0]} color1="#7c3aed" color2="#ffffff" />
          </Canvas>
        </div>
        
        <Card className="relative border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl shadow-xl overflow-hidden">
          {/* Browser/Device Frame Header */}
        <div className="bg-zinc-900/90 border-b border-white/5 px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1.5 bg-zinc-800/50 rounded-md text-xs text-gray-400 flex items-center gap-2">
              <Monitor className="w-3 h-3" />
              <span>Game Preview</span>
            </div>
          </div>
        </div>

        {/* Mock Game Interface */}
        <div className="p-6 md:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Target App Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="lg:col-span-1 space-y-3"
            >
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
                Target App
              </div>
              <div className="aspect-[9/16] lg:aspect-[3/4] rounded-lg bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-white/5 flex items-center justify-center backdrop-blur-sm overflow-hidden">
                <div className="relative w-full h-full p-4 space-y-3">
                  {/* Mock app interface elements */}
                  <div className="h-8 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-white/5 rounded"></div>
                    <div className="h-4 w-1/2 bg-white/5 rounded"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded"></div>
                    <div className="h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-5xl opacity-20">?</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Player Results Side by Side */}
            <div className="lg:col-span-2 space-y-3">
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
                Player Submissions
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Player 1 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold">
                      P1
                    </div>
                    <span className="text-gray-400">Player 1</span>
                  </div>
                  <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-cyan-600/10 to-blue-600/10 border border-cyan-500/20 p-3 space-y-2">
                    <div className="h-6 bg-cyan-500/20 rounded"></div>
                    <div className="space-y-1.5">
                      <div className="h-3 w-full bg-white/5 rounded"></div>
                      <div className="h-3 w-2/3 bg-white/5 rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div className="h-16 bg-cyan-500/10 rounded"></div>
                      <div className="h-16 bg-blue-500/10 rounded"></div>
                    </div>
                  </div>
                </motion.div>

                {/* Player 2 */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                      P2
                    </div>
                    <span className="text-gray-400">Player 2</span>
                  </div>
                  <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-pink-600/10 to-purple-600/10 border border-purple-500/20 p-3 space-y-2">
                    <div className="h-6 bg-purple-500/20 rounded"></div>
                    <div className="space-y-1.5">
                      <div className="h-3 w-full bg-white/5 rounded"></div>
                      <div className="h-3 w-3/4 bg-white/5 rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div className="h-16 bg-pink-500/10 rounded"></div>
                      <div className="h-16 bg-purple-500/10 rounded"></div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Result indicator */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">AI judges which design captures the vibe best</span>
            </div>
          </motion.div>
        </div>
      </Card>
      </div>
    </motion.div>
  )
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4l12.8-12.8" />
    </svg>
  )
}

