"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";


interface ComponentProps {
  opponentID?: string;
  question?: string;
  onSubmit?: (isSubmitted: boolean, promptText: string) => void;
  submittedPrompts?: string[];
  allowMultipleSubmissions?: boolean;
  gameCompleted?: boolean;
  onViewResults?: () => void;
}

export const Component = ({ 
  opponentID = "Loading...", 
  question = "Make an app that allows users to do e-transfer",
  onSubmit,
  submittedPrompts = [],
  allowMultipleSubmissions = false,
  gameCompleted = false,
  onViewResults
}: ComponentProps) => {
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds
  const [promptText, setPromptText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const promptTextRef = useRef(promptText);
  const isSubmittedRef = useRef(isSubmitted);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    promptTextRef.current = promptText;
  }, [promptText]);

  useEffect(() => {
    isSubmittedRef.current = isSubmitted;
  }, [isSubmitted]);

  // Reset timer and states when a new game starts (question changes)
  useEffect(() => {
    setTimeLeft(30);
    setPromptText("");
    setIsSubmitted(false);
    isSubmittedRef.current = false;
  }, [question]);

  // Timer effect - uses refs to avoid dependency issues
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Don't start timer if time is already up
    if (timeLeft === 0) {
      return;
    }

    // Start the timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = Math.max(0, prev - 1);
        
        // Auto-submit when time reaches 0 (only if first submission hasn't happened)
        if (newTime === 0 && !isSubmittedRef.current && onSubmit && submittedPrompts.length === 0) {
          setIsSubmitted(true);
          onSubmit(true, promptTextRef.current);
        }
        
        // Stop the timer when time reaches 0
        if (newTime === 0 && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        return newTime;
      });
    }, 1000);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]); // Restart timer when question changes (new game starts)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = () => {
    // Allow submission if:
    // 1. First submission (not submitted yet)
    // 2. OR multiple submissions allowed and time hasn't run out
    if (!isSubmitted || (allowMultipleSubmissions && timeLeft > 0 && promptText.trim())) {
      if (!isSubmitted) {
        setIsSubmitted(true);
      }
      if (onSubmit && promptText.trim()) {
        onSubmit(true, promptText);
        // Clear the input after submission
        setPromptText("");
      }
    }
  };

  const isTimeUp = timeLeft === 0;
  const hasFirstSubmission = submittedPrompts.length > 0;
  return (
    <Card className="flex h-full min-h-[800px] w-full max-w-[480px] flex-col gap-6 p-4 shadow-2xl bg-white/20 backdrop-blur-lg border-2 border-white/60">
      <div className="flex flex-row items-center justify-end p-0">
        <Button variant="ghost" size="icon" className="size-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 text-gray-700"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M18 6l-12 12" />
            <path d="M6 6l12 12" />
          </svg>
        </Button>
      </div>
      <CardContent className="flex flex-1 flex-col p-0">
        <div className="flex flex-col items-start justify-start space-y-8 p-6">
          <svg
            fill="none"
            height="48"
            viewBox="0 0 48 48"
            width="48"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
          >
            <filter
              id="a"
              colorInterpolationFilters="sRGB"
              filterUnits="userSpaceOnUse"
              height="54"
              width="48"
              x="0"
              y="-3"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend
                in="SourceGraphic"
                in2="BackgroundImageFix"
                mode="normal"
                result="shape"
              />
              <feColorMatrix
                in="SourceAlpha"
                result="hardAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              />
              <feOffset dy="-3" />
              <feGaussianBlur stdDeviation="1.5" />
              <feComposite
                in2="hardAlpha"
                k2="-1"
                k3="1"
                operator="arithmetic"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
              />
              <feBlend
                in2="shape"
                mode="normal"
                result="effect1_innerShadow_3051_46851"
              />
              <feColorMatrix
                in="SourceAlpha"
                result="hardAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              />
              <feOffset dy="3" />
              <feGaussianBlur stdDeviation="1.5" />
              <feComposite
                in2="hardAlpha"
                k2="-1"
                k3="1"
                operator="arithmetic"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.1 0"
              />
              <feBlend
                in2="effect1_innerShadow_3051_46851"
                mode="normal"
                result="effect2_innerShadow_3051_46851"
              />
              <feColorMatrix
                in="SourceAlpha"
                result="hardAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              />
              <feMorphology
                in="SourceAlpha"
                operator="erode"
                radius="1"
                result="effect3_innerShadow_3051_46851"
              />
              <feOffset />
              <feComposite
                in2="hardAlpha"
                k2="-1"
                k3="1"
                operator="arithmetic"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.0627451 0 0 0 0 0.0941176 0 0 0 0 0.156863 0 0 0 0.24 0"
              />
              <feBlend
                in2="effect2_innerShadow_3051_46851"
                mode="normal"
                result="effect3_innerShadow_3051_46851"
              />
            </filter>
            <filter
              id="b"
              colorInterpolationFilters="sRGB"
              filterUnits="userSpaceOnUse"
              height="42"
              width="42"
              x="3"
              y="5.25"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix
                in="SourceAlpha"
                result="hardAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              />
              <feMorphology
                in="SourceAlpha"
                operator="erode"
                radius="1.5"
                result="effect1_dropShadow_3051_46851"
              />
              <feOffset dy="2.25" />
              <feGaussianBlur stdDeviation="2.25" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.141176 0 0 0 0 0.141176 0 0 0 0 0.141176 0 0 0 0.1 0"
              />
              <feBlend
                in2="BackgroundImageFix"
                mode="normal"
                result="effect1_dropShadow_3051_46851"
              />
              <feBlend
                in="SourceGraphic"
                in2="effect1_dropShadow_3051_46851"
                mode="normal"
                result="shape"
              />
            </filter>
            <linearGradient
              id="c"
              gradientUnits="userSpaceOnUse"
              x1="24"
              x2="26"
              y1=".000001"
              y2="48"
            >
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#fff" stopOpacity=".12" />
            </linearGradient>
            <linearGradient
              id="d"
              gradientUnits="userSpaceOnUse"
              x1="24"
              x2="24"
              y1="6"
              y2="42"
            >
              <stop offset="0" stopColor="#fff" stopOpacity=".8" />
              <stop offset="1" stopColor="#fff" stopOpacity=".5" />
            </linearGradient>
            <linearGradient
              id="e"
              gradientUnits="userSpaceOnUse"
              x1="24"
              x2="24"
              y1="0"
              y2="48"
            >
              <stop offset="0" stopColor="#fff" stopOpacity=".12" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="f">
              <rect height="48" rx="12" width="48" />
            </clipPath>
            <g filter="url(#a)">
              <g clipPath="url(#f)">
                <rect fill="#0A0D12" height="48" rx="12" width="48" />
                <path d="m0 0h48v48h-48z" fill="url(#c)" />
                <g filter="url(#b)">
                  <path
                    clipRule="evenodd"
                    d="m6 24c11.4411 0 18-6.5589 18-18 0 11.4411 6.5589 18 18 18-11.4411 0-18 6.5589-18 18 0-11.4411-6.5589-18-18-18z"
                    fill="url(#d)"
                    fillRule="evenodd"
                  />
                </g>
              </g>
              <rect
                height="46"
                rx="11"
                stroke="url(#e)"
                strokeWidth="2"
                width="46"
                x="1"
                y="1"
              />
            </g>
          </svg>

          <div className="flex flex-col space-y-6 text-left w-full">
            <div className="flex flex-col space-y-3">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                Your challenger is {opponentID}
              </h2>
              <p className="text-sm text-gray-800">
                Write the best detailed prompt possible to solve the question.
              </p>
            </div>

            <div className="flex flex-col space-y-4 w-full">
              <div className="rounded-lg border border-white/50 bg-white/30 backdrop-blur-sm p-4 shadow-lg">
                <h3 className="text-xs font-medium uppercase tracking-wide text-gray-800 mb-2">
                  Question
                </h3>
                <p className="text-base font-medium text-gray-900">
                  {question}
                </p>
              </div>

              <div className="flex flex-col items-start justify-start py-2 space-y-4 min-h-[100px]">
                {/* Timer - stays visible to show time remaining for modifications */}
                <div className="flex flex-col items-start gap-2">
                  <span className="text-xs text-gray-700 uppercase tracking-wide">Time Remaining</span>
                  <div className={`text-5xl font-bold tabular-nums tracking-tight ${
                    timeLeft <= 10 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatTime(timeLeft)}
                  </div>
                </div>

                {/* "Coding your vibe" and View Results button - positioned below timer */}
                <div className="flex flex-col items-start gap-3 w-full">
                  <div className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                    Coding your vibe
                  </div>
                  {/* View Results button - appears when game is completed */}
                  {gameCompleted && onViewResults && (
                    <button
                      onClick={onViewResults}
                      className="h-8 px-4 text-sm font-medium bg-gray-700/70 hover:bg-gray-800/80 border border-white/50 text-white shadow-lg hover:shadow-xl transition-all relative z-10"
                    >
                      View Results
                    </button>
                    
                  
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-auto flex-col rounded-md ring-1 ring-white/50 bg-white/25 backdrop-blur-md shadow-inner">
          {/* Display submitted prompts above input */}
          {hasFirstSubmission && submittedPrompts.length > 0 && (
            <div className="border-b border-white/50 bg-white/20 backdrop-blur-sm p-3 max-h-[150px] overflow-y-auto relative z-0">
              <h4 className="text-xs font-medium uppercase tracking-wide text-gray-800 mb-2">
                Submitted Prompts ({submittedPrompts.length})
              </h4>
              <div className="space-y-1">
                {submittedPrompts.map((prompt, index) => (
                  <div key={index} className="text-xs text-gray-700 bg-white/30 rounded px-2 py-1">
                    <span className="font-semibold">{index + 1}.</span> {prompt}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="relative">
            <Textarea
              placeholder={hasFirstSubmission ? "Write a modification prompt here..." : "Write your prompt here..."}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              disabled={isTimeUp}
              className="peer bg-transparent text-gray-900 placeholder:text-gray-700 min-h-[100px] max-h-[400px] resize-none rounded-b-none border-none py-3 ps-3 pe-9 shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                height: 'auto',
                minHeight: '100px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 400)}px`;
              }}
            />

            <div className="pointer-events-none absolute start-0 top-[14px] hidden items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                className="size-4"
              >
                <g fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11.5" cy="11.5" r="9.5" />
                  <path strokeLinecap="round" d="M18.5 18.5L22 22" />
                </g>
              </svg>
            </div>

          </div>

          <div className="flex items-center justify-end rounded-b-md border-t border-white/50 bg-white/30 backdrop-blur-sm px-3 py-2">
            <Button 
              className="h-8 px-4 text-sm font-medium bg-gray-700/70 hover:bg-gray-800/80 border border-white/50 text-white shadow-lg hover:shadow-xl transition-all"
              disabled={isTimeUp || !promptText.trim()}
              onClick={handleSubmit}
            >
              {isTimeUp 
                ? "Time's Up" 
                : hasFirstSubmission 
                  ? "Submit Modification" 
                  : "Submit Prompt"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
