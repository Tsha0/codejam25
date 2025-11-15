"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Sparkles, Clock } from "lucide-react"

interface ComingSoonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ComingSoonDialog({ open, onOpenChange }: ComingSoonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gradient-to-br from-zinc-900 to-zinc-950 border-white/10 text-white">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center mb-4"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Clock className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          
          <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">
            Matchmaking Coming Soon
          </DialogTitle>
          
          <DialogDescription className="text-center text-gray-400 pt-2">
            We're putting the finishing touches on the matchmaking system. Get ready to battle it out with your creative prompts!
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="pt-4 space-y-4"
        >
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-medium">
              <Sparkles className="w-4 h-4" />
              <span>What to expect:</span>
            </div>
            <ul className="text-sm text-gray-400 space-y-1 ml-6">
              <li>• Real-time 1v1 matchmaking</li>
              <li>• AI-powered vibe judging</li>
              <li>• Competitive rankings</li>
              <li>• Amazing prize pool (maybe)</li>
            </ul>
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold"
          >
            Got it!
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

