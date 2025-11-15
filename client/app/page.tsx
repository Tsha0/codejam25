"use client"

import { useState, useEffect } from "react"
import { MeshGradient } from "@paper-design/shaders-react"
import { HeroSection } from "@/components/hero-section"
import { MockPreview } from "@/components/mock-preview"
import { ComingSoonDialog } from "@/components/coming-soon-dialog"
import { Footer } from "@/components/footer"
import { SpiralAnimation } from "@/components/ui/spiral-animation"

export default function Home() {
  const [comingSoonOpen, setComingSoonOpen] = useState(false)
  const [contentVisible, setContentVisible] = useState(false)
  const [buttonVisible, setButtonVisible] = useState(false)

  const handleFindGame = () => {
    setComingSoonOpen(true)
  }

  const handleEnterSite = () => {
    setContentVisible(true)
  }

  // Fade in the Enter button after animation plays for a bit
  useEffect(() => {
    const timer = setTimeout(() => {
      setButtonVisible(true)
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black">
      {/* Spiral Animation Background - Fades out when content appears */}
      <div 
        className={`
          absolute inset-0
          transition-opacity duration-1500 ease-out
          ${contentVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
      >
        <SpiralAnimation />
      </div>
      
      {/* Enter Button - Shows over spiral animation */}
      {!contentVisible && (
        <div 
          className={`
            absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10
            transition-all duration-1500 ease-out
            ${buttonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <button 
            onClick={handleEnterSite}
            className="
              text-white text-2xl tracking-[0.2em] uppercase font-extralight
              transition-all duration-700
              hover:tracking-[0.3em] animate-pulse
            "
          >
            Enter
          </button>
        </div>
      )}
      
      {/* Paper Shaders Background - Fades in with landing content */}
      <div 
        className={`
          absolute inset-0
          transition-opacity duration-1500 ease-out
          ${contentVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        <MeshGradient
          className="w-full h-full"
          colors={["#000000", "#1a1a1a", "#333333", "#555555"]}
          speed={0.8}
        />
      </div>

      {/* Landing Page Content - Fades in after clicking Enter */}
      <div 
        className={`
          absolute inset-0 overflow-auto
          transition-opacity duration-1500 ease-out
          ${contentVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        <main className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12 md:py-16 lg:py-20 z-10">
          <div className="w-full max-w-7xl mx-auto space-y-8 md:space-y-12 lg:space-y-16">
            {/* Hero Section */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start">
              <div className="w-full lg:w-1/2">
                <HeroSection onFindGame={handleFindGame} />
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
        <ComingSoonDialog open={comingSoonOpen} onOpenChange={setComingSoonOpen} />
      </div>
    </div>
  )
}
