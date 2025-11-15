"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { Users, PenTool, Sparkles, Trophy } from "lucide-react"

interface HowItWorksProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const steps = [
  {
    icon: Users,
    title: "Join a 1v1 Match",
    description: "Get paired with an opponent and see a mystery app interface you both need to recreate.",
  },
  {
    icon: PenTool,
    title: "Write Your Prompt",
    description: "You have one shot to describe how to recreate the UI. No brand names allowed—describe it by vibe alone.",
  },
  {
    icon: Sparkles,
    title: "AI Generates & Judges",
    description: "An AI model turns both prompts into HTML and decides whose design best captures the original vibe.",
  },
  {
    icon: Trophy,
    title: "Compare & Queue Up",
    description: "View both generated UIs side-by-side, see the results, and jump into the next round.",
  },
]

export function HowItWorks({ open, onOpenChange }: HowItWorksProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">
            How It Works
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="flex gap-4 group"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1 pt-1">
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
                  Step {index + 1}: {step.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="pt-6 border-t border-white/10"
        >
          <p className="text-center text-sm text-gray-400">
            No coding required. Just creativity, strategy, and a keen eye for design vibes.
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

