"use client";

import { useState, useEffect } from "react";
import { Component as AICard } from "@/components/ui/ai-assistant-card";
import { Component as AILoader } from "@/components/ui/ai-loader";

export default function GameplayPage() {
  const opponentID = "Player2";
  const question = "Make an app that allows users to do e-transfer";
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [translateX, setTranslateX] = useState(0);

  useEffect(() => {
    const updateTranslation = () => {
      if (typeof window !== "undefined") {
        const screenWidth = window.innerWidth;
        const cardWidth = 480; // max-w-[480px]
        const padding = 32; // p-8

        const centerPosition = (screenWidth - cardWidth) / 2;
        const leftPosition = padding;
        const translation = centerPosition - leftPosition;

        setTranslateX(translation);
      }
    };

    updateTranslation();
    window.addEventListener("resize", updateTranslation);
    return () => window.removeEventListener("resize", updateTranslation);
  }, []);

  const handleSubmit = (submitted: boolean) => {
    setIsSubmitted(submitted);
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        backgroundImage: "url(/IMG_1445.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Blur overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
      />

      {/* Main row: card on left, loader on right */}
      <div className="absolute inset-0 flex items-center p-8">
        {/* Card container with smooth transform animation */}
        <div
          className="flex-shrink-0 will-change-transform"
          style={{
            transform: `translateX(${isSubmitted ? 0 : translateX}px)`,
            transition: "transform 2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <AICard
            opponentID={opponentID}
            question={question}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Right side content that fades in */}
        <div
          className={`flex-1 ml-8 flex items-center justify-center transition-opacity duration-1000 delay-1000 ${
            isSubmitted ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {isSubmitted && <AILoader />}
        </div>
      </div>
    </div>
  );
}
