import * as React from "react";

interface LoaderProps {
  text?: string;
}

export const Component: React.FC<LoaderProps> = ({
  text = "Generating",
}) => {
  const letters = text.split("");

  return (
    <div className="flex items-center justify-center">
      <div className="relative flex items-center justify-center font-inter select-none">
        <div className="flex space-x-1">
          {letters.map((letter, index) => (
            <span
              key={index}
              className="inline-block text-black animate-loaderLetter text-5xl font-semibold"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes loaderLetter {
          0%, 100% {
            transform: scale(1);
          }
          40% {
            transform: scale(1.20); /* stronger pop animation */
          }
        }

        .animate-loaderLetter {
          animation: loaderLetter 1.8s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
