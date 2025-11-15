"use client";

import React from "react";
import { motion } from "framer-motion";

interface CompareProps {
  firstImage: string;
  secondImage: string;
  firstImageClassName?: string;
  secondImageClassName?: string;
  className?: string;
  slideMode?: "hover" | "drag";
  autoplay?: boolean;
}

export const Compare = ({
  firstImage,
  secondImage,
  firstImageClassName,
  secondImageClassName,
  className,
  slideMode = "hover",
  autoplay = false,
}: CompareProps) => {
  const [sliderXPercent, setSliderXPercent] = React.useState(50);
  const [isDragging, setIsDragging] = React.useState(false);

  const sliderRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    if (slideMode === "drag" && !isDragging) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    setSliderXPercent(Math.max(0, Math.min(100, percent)));
  };

  const handleMouseDown = () => {
    if (slideMode === "drag") {
      setIsDragging(true);
    }
  };

  const handleMouseUp = () => {
    if (slideMode === "drag") {
      setIsDragging(false);
    }
  };

  return (
    <div
      ref={sliderRef}
      className={`relative w-full overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: slideMode === "drag" ? (isDragging ? "grabbing" : "grab") : "col-resize" }}
    >
      {/* First Image (Bottom Layer) */}
      <div className="absolute inset-0">
        <img
          src={secondImage}
          alt="Second"
          className={`h-full w-full object-cover ${secondImageClassName}`}
        />
      </div>

      {/* Second Image (Top Layer with clip) */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `inset(0 ${100 - sliderXPercent}% 0 0)`,
        }}
      >
        <img
          src={firstImage}
          alt="First"
          className={`h-full w-full object-cover ${firstImageClassName}`}
        />
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/80 shadow-lg"
        style={{
          left: `${sliderXPercent}%`,
          transform: "translateX(-50%)",
        }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center">
          <div className="w-4 h-4 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4 text-gray-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

