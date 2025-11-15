"use client"

import { useState } from "react"
import { MeshGradient } from "@paper-design/shaders-react"
import { HeroSection } from "@/components/hero-section"
import { HowItWorks } from "@/components/how-it-works"
import { MockPreview } from "@/components/mock-preview"
import { ComingSoonDialog } from "@/components/coming-soon-dialog"
import { Footer } from "@/components/footer"

export default function Home() {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)
  const [comingSoonOpen, setComingSoonOpen] = useState(false)

  const handleFindGame = () => {
    setComingSoonOpen(true)
  }

  const handleHowItWorks = () => {
    setHowItWorksOpen(true)
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Paper Shaders */}
      <MeshGradient
        className="w-full h-full fixed inset-0"
        colors={["#000000", "#1a1a1a", "#333333", "#555555"]}
        speed={0.8}
      />
      
      <main className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12 md:py-16 lg:py-20 z-10">
        <div className="w-full max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16">
          {/* Hero Section */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start">
            <div className="w-full lg:w-1/2">
              <HeroSection onFindGame={handleFindGame} onHowItWorks={handleHowItWorks} />
            </div>
            
            {/* Mock Preview - Side by side on desktop, stacked on mobile */}
            <div className="w-full lg:w-1/2">
              <MockPreview />
            </div>
        </div>

          {/* Footer */}
          <Footer />
        </div>
      </main>

      {/* Modals */}
      <HowItWorks open={howItWorksOpen} onOpenChange={setHowItWorksOpen} />
      <ComingSoonDialog open={comingSoonOpen} onOpenChange={setComingSoonOpen} />
    </div>
  )
}
