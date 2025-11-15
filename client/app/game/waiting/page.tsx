"use client";

import { useEffect, useState } from "react";
import { TypingAnimation } from "@/components/ui/typing-animation";

// Extend Window interface for UnicornStudio
declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized: boolean;
      init?: () => void;
    };
  }
}

export default function WaitingPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dots, setDots] = useState("");

  useEffect(() => {
    let embedScript: HTMLScriptElement | null = null;
    let style: HTMLStyleElement | null = null;

    const initUnicornStudio = () => {
      embedScript = document.createElement("script");
      embedScript.type = "text/javascript";
      embedScript.textContent = `
        !function(){
          if(!window.UnicornStudio){
            window.UnicornStudio={isInitialized:!1};
            var i=document.createElement("script");
            i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.33/dist/unicornStudio.umd.js";
            i.onload=function(){
              window.UnicornStudio.isInitialized||(UnicornStudio.init(),window.UnicornStudio.isInitialized=!0);
              window.dispatchEvent(new Event('unicornstudio-loaded'));
            };
            (document.head || document.body).appendChild(i)
          } else if(window.UnicornStudio.isInitialized) {
            window.dispatchEvent(new Event('unicornstudio-loaded'));
          }
        }();
      `;
      document.head.appendChild(embedScript);
    };

    initUnicornStudio();

    // Add CSS to hide branding elements and crop canvas
    style = document.createElement("style");
    style.textContent = `
      [data-us-project] {
        position: relative !important;
        overflow: hidden !important;
      }
      
      [data-us-project] canvas {
        clip-path: inset(0 0 10% 0) !important;
      }
      
      [data-us-project] * {
        pointer-events: none !important;
      }
      [data-us-project] a[href*="unicorn"],
      [data-us-project] button[title*="unicorn"],
      [data-us-project] div[title*="Made with"],
      [data-us-project] .unicorn-brand,
      [data-us-project] [class*="brand"],
      [data-us-project] [class*="credit"],
      [data-us-project] [class*="watermark"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
      }
    `;
    document.head.appendChild(style);

    const hideBranding = () => {
      const projectDiv = document.querySelector("[data-us-project]");
      if (projectDiv) {
        const allElements = projectDiv.querySelectorAll("*");
        allElements.forEach((el) => {
          const text = (el.textContent || "").toLowerCase();
          if (text.includes("made with") || text.includes("unicorn")) {
            el.remove();
          }
        });
      }
    };

    hideBranding();
    const interval = setInterval(hideBranding, 100);

    setTimeout(hideBranding, 1000);
    setTimeout(hideBranding, 3000);
    setTimeout(hideBranding, 5000);

    // Wait for UnicornStudio to load and the project to initialize
    let unicornLoaded = false;
    let minTimeElapsed = false;

    const checkAndShow = () => {
      if (unicornLoaded && minTimeElapsed) {
        setIsLoaded(true);
      }
    };

    const handleUnicornLoad = () => {
      // Give UnicornStudio a moment to render the project
      setTimeout(() => {
        unicornLoaded = true;
        checkAndShow();
      }, 500);
    };

    window.addEventListener('unicornstudio-loaded', handleUnicornLoad);

    // Also ensure minimum loading time for smooth experience
    const minTimeout = setTimeout(() => {
      minTimeElapsed = true;
      checkAndShow();
    }, 1500);

    // Fallback: show content after max wait time even if UnicornStudio hasn't loaded
    const maxTimeout = setTimeout(() => {
      setIsLoaded(true);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(minTimeout);
      clearTimeout(maxTimeout);
      window.removeEventListener('unicornstudio-loaded', handleUnicornLoad);
      if (embedScript && document.head.contains(embedScript)) {
        document.head.removeChild(embedScript);
      }
      if (style && document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Animated dots effect for searching
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      {/* Unicorn Studio background - desktop */}
      <div 
        className="absolute inset-0 w-full h-full hidden lg:block transition-opacity duration-700"
        style={{ opacity: isLoaded ? 1 : 0 }}
      >
        <div
          data-us-project="sruhpQe3j1VOgVQHtJZf"
          style={{ width: "100%", height: "100%", minHeight: "100vh" }}
        />
      </div>

      {/* Mobile stars background */}
      <div 
        className="absolute inset-0 w-full h-full lg:hidden stars-bg transition-opacity duration-700"
        style={{ opacity: isLoaded ? 1 : 0 }}
      />

      {/* Foreground content */}
      <div 
        className="relative z-10 min-h-screen flex items-center justify-center transition-opacity duration-700"
        style={{ opacity: isLoaded ? 1 : 0 }}
      >
        {isLoaded && (
          <div className="flex items-center">
            <TypingAnimation
              className="text-4xl lg:text-5xl font-bold text-white font-mono"
              text="Finding Opponent"
              duration={50}
            />
            <span className="text-4xl lg:text-5xl font-bold text-white font-mono inline-block w-16 text-left ml-1">
              {dots}
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        .stars-bg {
          background-image: radial-gradient(1px 1px at 20% 30%, white, transparent),
            radial-gradient(1px 1px at 60% 70%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1px 1px at 80% 10%, white, transparent),
            radial-gradient(1px 1px at 90% 60%, white, transparent),
            radial-gradient(1px 1px at 33% 80%, white, transparent),
            radial-gradient(1px 1px at 15% 60%, white, transparent),
            radial-gradient(1px 1px at 70% 40%, white, transparent);
          background-size: 200% 200%, 180% 180%, 250% 250%, 220% 220%, 190% 190%,
            240% 240%, 210% 210%, 230% 230%;
          background-position: 0% 0%, 40% 40%, 60% 60%, 20% 20%, 80% 80%, 30% 30%,
            70% 70%, 50% 50%;
          opacity: 0.3;
        }
      `}</style>
    </main>
  );
}
