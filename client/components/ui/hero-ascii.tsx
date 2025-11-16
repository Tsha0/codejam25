'use client';
import Link from "next/link";
import { useEffect, useState } from 'react';
import { Info, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { MockPreview } from '@/components/mock-preview';

// Extend Window interface for UnicornStudio
declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized: boolean;
      init?: () => void;
    };
  }
}

// Typing Test Popover Component
function TypingTestPopover() {
  const testSentences = [
    "The quick brown fox jumps over the lazy dog",
    "Pack my box with five dozen liquor jugs",
    "How vexingly quick daft zebras jump",
    "The five boxing wizards jump quickly"
  ];
  
  const [sentence, setSentence] = useState(testSentences[0]);
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isComplete, setIsComplete] = useState(false);
  const [finalWpm, setFinalWpm] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(100);

  const resetTest = () => {
    setSentence(testSentences[Math.floor(Math.random() * testSentences.length)]);
    setInput("");
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setIsComplete(false);
    setFinalWpm(0);
    setFinalAccuracy(100);
  };

  const finishTest = () => {
    if (input.trim().length > 0 && startTime) {
      setIsComplete(true);
      setFinalWpm(wpm);
      setFinalAccuracy(accuracy);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isComplete) return;
    
    const value = e.target.value;
    
    if (!startTime) {
      setStartTime(Date.now());
    }

    setInput(value);

    // Calculate accuracy
    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === sentence[i]) {
        correct++;
      }
    }
    const currentAccuracy = value.length > 0 ? Math.round((correct / value.length) * 100) : 100;
    setAccuracy(currentAccuracy);

    // Calculate WPM
    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
      const wordsTyped = value.trim().split(' ').length;
      const currentWpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
      setWpm(currentWpm);
    }

    // Check if complete (typed entire sentence)
    if (value === sentence) {
      setIsComplete(true);
      setFinalWpm(wpm);
      setFinalAccuracy(currentAccuracy);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isComplete) {
      finishTest();
    }
  };

  return (
    <div className="w-[400px] bg-black/20 backdrop-blur-md border border-white/20 text-white shadow-2xl">
      <div className="p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <h3 className="font-mono text-sm font-bold tracking-widest">TYPING WARMUP</h3>
            </div>
            <button 
              onClick={resetTest}
              className="text-[10px] font-mono text-white/60 hover:text-white hover:bg-white/10 transition-all px-3 py-1.5 border border-white/30 hover:border-white/60 relative group"
            >
              <span className="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="absolute -bottom-px -right-px w-1.5 h-1.5 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
              NEW
            </button>
          </div>

          {!isComplete ? (
            <>
              <div className="flex gap-6 text-xs font-mono bg-white/5 p-3 border border-white/10">
                <div className="flex flex-col items-center flex-1">
                  <span className="text-white/50 text-[10px] mb-1">WPM</span>
                  <span className="text-2xl font-bold text-white tabular-nums">{wpm}</span>
                </div>
                <div className="w-px bg-white/20"></div>
                <div className="flex flex-col items-center flex-1">
                  <span className="text-white/50 text-[10px] mb-1">ACCURACY</span>
                  <span className="text-2xl font-bold text-white tabular-nums">{accuracy}%</span>
                </div>
              </div>

              <div className="bg-white/5 p-4 border border-white/20 font-mono text-sm leading-relaxed">
                {sentence.split('').map((char, i) => {
                  let color = 'text-white/40';
                  if (i < input.length) {
                    color = input[i] === char ? 'text-green-400' : 'text-red-400';
                  } else if (i === input.length) {
                    color = 'text-white/60 bg-white/20';
                  }
                  return (
                    <span key={i} className={color}>
                      {char}
                    </span>
                  );
                })}
              </div>

              <input
                type="text"
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Start typing here..."
                className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-white/60 focus:bg-white/10 transition-all"
                autoComplete="off"
              />

              <div className="text-center text-[10px] font-mono text-white/40">
                Press <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/30 rounded">ENTER</kbd> to finish
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-green-400 text-sm font-mono mb-3">✓ TEST COMPLETE</div>
                <div className="flex gap-6 justify-center">
                  <div className="flex flex-col items-center">
                    <span className="text-white/50 text-xs font-mono mb-1">FINAL WPM</span>
                    <span className="text-4xl font-bold text-white tabular-nums">{finalWpm}</span>
                  </div>
                  <div className="w-px bg-white/20"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-white/50 text-xs font-mono mb-1">ACCURACY</span>
                    <span className="text-4xl font-bold text-white tabular-nums">{finalAccuracy}%</span>
                  </div>
                </div>
              </div>
              <div className="text-center text-xs font-mono text-white/60 border-t border-white/20 pt-4">
                Click <span className="text-white">NEW</span> to try again
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let embedScript: HTMLScriptElement | null = null;
    let style: HTMLStyleElement | null = null;

    const initUnicornStudio = () => {
      embedScript = document.createElement('script');
      embedScript.type = 'text/javascript';
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
    // Only add if it doesn't already exist
    const existingStyle = document.querySelector('style[data-unicorn-studio-style]');
    if (!existingStyle) {
      style = document.createElement('style');
      style.setAttribute('data-unicorn-studio-style', 'true');
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
    }

    // Function to aggressively hide branding
    const hideBranding = () => {
      const projectDiv = document.querySelector('[data-us-project]');
      if (projectDiv) {
        // Find and remove any elements containing branding text
        const allElements = projectDiv.querySelectorAll('*');
        allElements.forEach(el => {
          const text = (el.textContent || '').toLowerCase();
          if (text.includes('made with') || text.includes('unicorn')) {
            el.remove(); // Completely remove the element
          }
        });
      }
    };

    // Run immediately and periodically
    hideBranding();
    const interval = setInterval(hideBranding, 100);
    
    // Also try after delays
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
    }, 800);

    // Fallback: show content after max wait time even if UnicornStudio hasn't loaded
    const maxTimeout = setTimeout(() => {
      setIsLoaded(true);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(minTimeout);
      clearTimeout(maxTimeout);
      window.removeEventListener('unicornstudio-loaded', handleUnicornLoad);
      // Only remove script if we created it and UnicornStudio isn't initialized
      // (don't remove if it's being used by other pages)
      if (embedScript && document.head.contains(embedScript) && !window.UnicornStudio?.isInitialized) {
        document.head.removeChild(embedScript);
      }
      // Don't remove the style - it's shared across pages and has a data attribute to prevent duplicates
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      {/* Vitruvian man animation - hidden on mobile */}
      <div 
        className="absolute inset-0 w-full h-full hidden lg:block transition-opacity duration-700" 
        style={{ opacity: isLoaded ? 1 : 0 }}
      >
        <div 
          data-us-project="oppWN740DyWExbZkLm4s" 
          style={{ width: '100%', height: '100%', minHeight: '100vh' }}
        />
        
      </div>

      {/* Mobile stars background */}
      <div 
        className="absolute inset-0 w-full h-full lg:hidden stars-bg transition-opacity duration-700"
        style={{ opacity: isLoaded ? 1 : 0 }}
      ></div>

      {/* Top Header */}
      <div 
        className="absolute top-0 left-0 right-0 z-20 border-b border-white/20 transition-opacity duration-700"
        style={{ opacity: isLoaded ? 1 : 0 }}
      >
        <div className="container mx-auto px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="font-mono text-white text-xl lg:text-2xl font-bold tracking-widest italic transform -skew-x-12">
              CODEJAM15
            </div>
            <div className="h-3 lg:h-4 w-px bg-white/40"></div>
            {/* <span className="text-white/60 text-[8px] lg:text-[10px] font-mono">EST. 2025</span> */}
          </div>
          
          {/* <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-white/60">
            <span>LAT: 37.7749°</span>
            <div className="w-1 h-1 bg-white/40 rounded-full"></div>
            <span>LONG: 122.4194°</span>
          </div> */}
        </div>
      </div>

      {/* Corner Frame Accents */}
      <div 
        className="absolute top-0 left-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-l-2 border-white/30 z-20 transition-opacity duration-700"
        style={{ opacity: isLoaded ? 1 : 0 }}
      ></div>
      <div 
        className="absolute top-0 right-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-r-2 border-white/30 z-20 transition-opacity duration-700"
        style={{ opacity: isLoaded ? 1 : 0 }}
      ></div>
      <div 
        className="absolute left-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-l-2 border-white/30 z-20 transition-opacity duration-700" 
        style={{ bottom: '5vh', opacity: isLoaded ? 1 : 0 }}
      ></div>
      <div 
        className="absolute right-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-r-2 border-white/30 z-20 transition-opacity duration-700" 
        style={{ bottom: '5vh', opacity: isLoaded ? 1 : 0 }}
      ></div>

      {/* 
        WARM UP POPOVER - MANUAL POSITIONING GUIDE
        ==========================================
        To adjust the position, modify these values:
        
        Horizontal (left-right):
        - right-[15%] = 15% from right edge (increase % to move left, decrease to move right)
        - You can also use: right-[100px], right-[20vw], etc.
        - Or switch to: left-[60%], left-[500px], etc.
        
        Vertical (up-down):
        - top-1/2 = middle of screen (you can use: top-[40%], top-[200px], etc.)
        - -translate-y-1/2 centers it vertically (adjust to -translate-y-[40%] to fine-tune)
        - Or use bottom-[20%] instead of top
        
        Examples:
        - Move lower: change top-1/2 to top-[60%]
        - Move higher: change top-1/2 to top-[40%]  
        - Move more right: change right-[15%] to right-[8%]
        - Move more left: change right-[15%] to right-[25%]
      */}
      <div 
        className="hidden lg:flex absolute right-[15%] top-1/2 transform -translate-y-1/2 z-30 transition-opacity duration-700"
        style={{ opacity: isLoaded ? 1 : 0 }}
      >
        <TypingTestPopover />
      </div>

      <div 
        className="relative z-10 flex min-h-screen items-center pt-16 lg:pt-0 transition-opacity duration-700" 
        style={{ marginTop: '5vh', opacity: isLoaded ? 1 : 0 }}
      >
        <div className="container mx-auto px-6 lg:px-16 lg:ml-[10%]">
          <div className="max-w-lg relative">
            {/* Top decorative line */}
            <div className="flex items-center gap-2 mb-3 opacity-60">
              <div className="w-8 h-px bg-white"></div>
              <span className="text-white text-[10px] font-mono tracking-wider">v1.0</span>
              <div className="flex-1 h-px bg-white"></div>
            </div>

            {/* Title with dithered accent */}
            <div className="relative">
              <div className="hidden lg:block absolute -left-3 top-0 bottom-0 w-1 dither-pattern opacity-40"></div>
              <h1 className="text-2xl lg:text-5xl font-bold text-white mb-3 lg:mb-4 leading-tight font-mono tracking-wider" style={{ letterSpacing: '0.1em' }}>
                VIBECODING
                <span className="block text-white mt-1 lg:mt-2 opacity-90">
                  CHALLENGE
                </span>
              </h1>
            </div>

            {/* Decorative dots pattern - desktop only */}
            <div className="hidden lg:flex gap-1 mb-3 opacity-40">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="w-0.5 h-0.5 bg-white rounded-full"></div>
              ))}
            </div>

            {/* Description with subtle grid pattern */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <p className="text-xs lg:text-base text-gray-300 mb-5 lg:mb-6 leading-relaxed font-mono opacity-80">
                  You got what it takes to outvibe your opponent?
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="mb-5 lg:mb-6 text-white/60 hover:text-white transition-colors duration-200 cursor-pointer group">
                      <Info className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] lg:max-w-5xl bg-black/95 border-white/20 text-white">
                    <DialogTitle className="sr-only">Game Preview</DialogTitle>
                    <MockPreview />
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Technical corner accent - desktop only */}
              <div className="hidden lg:block absolute -right-4 top-1/2 w-3 h-3 border border-white opacity-30" style={{ transform: 'translateY(-50%)' }}>
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white" style={{ transform: 'translate(-50%, -50%)' }}></div>
              </div>
            </div>

            {/* Buttons with technical accents */}
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
              {/* <button className="relative px-5 lg:px-6 py-2 lg:py-2.5 bg-transparent text-white font-mono text-xs lg:text-sm border border-white hover:bg-white hover:text-black transition-all duration-200 group">
                <span className="hidden lg:block absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="hidden lg:block absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
                FIND GAME
              </button> */}
              <Link
                href="/game/waiting"
                className="relative px-5 lg:px-6 py-2 lg:py-2.5 bg-transparent text-white font-mono text-xs lg:text-sm border border-white hover:bg-white hover:text-black transition-all duration-200 group inline-flex items-center justify-center"
              >
                <span className="hidden lg:block absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="hidden lg:block absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
                FIND GAME
              </Link>
              
              <Link
                href="/dashboard"
                className="relative px-5 lg:px-6 py-2 lg:py-2.5 bg-transparent border border-white text-white font-mono text-xs lg:text-sm hover:bg-white hover:text-black transition-all duration-200 inline-flex items-center justify-center"
                style={{ borderWidth: '1px' }}
              >
                VISIT DASHBOARD
              </Link>
            </div>

            {/* Bottom technical notation - desktop only */}
            <div className="hidden lg:flex items-center gap-2 mt-6 opacity-40">
              <span className="text-white text-[9px] font-mono">∞</span>
              <div className="flex-1 h-px bg-white"></div>
              <span className="text-white text-[9px] font-mono">FraudulentFour</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div 
        className="absolute left-0 right-0 z-20 border-t border-white/20 bg-black/40 backdrop-blur-sm transition-opacity duration-700" 
        style={{ bottom: '5vh', opacity: isLoaded ? 1 : 0 }}
      >
        <div className="container mx-auto px-4 lg:px-8 py-2 lg:py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-6 text-[8px] lg:text-[9px] font-mono text-white/50">
            {/* <span className="hidden lg:inline">SYSTEM.ACTIVE</span> */}
            <span className="lg:hidden">SYS.ACT</span>
            {/* <div className="hidden lg:flex gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-1 h-3 bg-white/30" style={{ height: `${Math.random() * 12 + 4}px` }}></div>
              ))}
            </div> */}
            {/* <span>V1.0.0</span> */}
          </div>
          
          {/* <div className="flex items-center gap-2 lg:gap-4 text-[8px] lg:text-[9px] font-mono text-white/50">
            <span className="hidden lg:inline">◐ RENDERING</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="hidden lg:inline">FRAME: ∞</span>
          </div> */}
        </div>
      </div>

      <style jsx>{`
        .dither-pattern {
          background-image: 
            repeating-linear-gradient(0deg, transparent 0px, transparent 1px, white 1px, white 2px),
            repeating-linear-gradient(90deg, transparent 0px, transparent 1px, white 1px, white 2px);
          background-size: 3px 3px;
        }
        
        .stars-bg {
          background-image: 
            radial-gradient(1px 1px at 20% 30%, white, transparent),
            radial-gradient(1px 1px at 60% 70%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1px 1px at 80% 10%, white, transparent),
            radial-gradient(1px 1px at 90% 60%, white, transparent),
            radial-gradient(1px 1px at 33% 80%, white, transparent),
            radial-gradient(1px 1px at 15% 60%, white, transparent),
            radial-gradient(1px 1px at 70% 40%, white, transparent);
          background-size: 200% 200%, 180% 180%, 250% 250%, 220% 220%, 190% 190%, 240% 240%, 210% 210%, 230% 230%;
          background-position: 0% 0%, 40% 40%, 60% 60%, 20% 20%, 80% 80%, 30% 30%, 70% 70%, 50% 50%;
          opacity: 0.3;
        }
      `}</style>
    </main>
  );
}
