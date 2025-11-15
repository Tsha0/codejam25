"use client"

import { motion } from "framer-motion"
import { Heart } from "lucide-react"

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="w-full py-8 px-4"
    >
      <div className="max-w-6xl mx-auto">
        <div className="border-t border-white/5 pt-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-gray-400 flex items-center gap-2">
              Built for fun and competitive creativity
              <Heart className="w-4 h-4 text-gray-400" />
            </p>
            <div className="flex gap-6 text-xs text-gray-500">
              <a href="#" className="hover:text-gray-300 transition-colors">Terms</a>
              <span className="text-gray-700">•</span>
              <a href="#" className="hover:text-gray-300 transition-colors">Privacy</a>
              <span className="text-gray-700">•</span>
              <a href="#" className="hover:text-gray-300 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}

