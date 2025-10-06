"use client";

import { useEffect, useState } from "react";

type LoopingTextProps = {
  texts: string[];
  interval?: number; // total time per text
  className?: string;
};

export default function LoopingText({
  texts,
  interval = 2500,
  className = "",
}: LoopingTextProps) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false); // fade out

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % texts.length);
        setFade(true); // fade in
      }, 300);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, texts.length]);

  const referenceText = texts.reduce(
    (longest, word) => (word.length > longest.length ? word : longest),
    ""
  );

  return (
    <div
      className={`relative flex justify-center items-center text-center ${className} w-full max-w-full px-2`}
    >
      {/* Invisible reference to lock dimensions */}
      <span className="invisible">{referenceText}</span>

      {/* Animated visible text */}
      <span
        className={`absolute transition-all duration-300 ease-in-out break-words ${
          fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        } text-base sm:text-lg md:text-xl lg:text-2xl font-semibold`}
        style={{
          color: "#FFFFFF",
          textShadow: "2px 2px 8px rgba(0,0,0,0.7)",
        }}
      >
        {texts[index]}
      </span>
    </div>
  );
}
