"use client";

import { useEffect, useState, useRef } from "react";

export interface LoopingTextProps {
  texts: string[];
  interval?: number;
  className?: string;
}

const FADE_DURATION_MS = 300;

export default function LoopingText({
  texts,
  interval = 2500,
  className = "",
}: LoopingTextProps): JSX.Element {
  const [index, setIndex] = useState<number>(0);
  const [fade, setFade] = useState<boolean>(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);

      timeoutRef.current = setTimeout(() => {
        setIndex((prev) => (prev + 1) % texts.length);
        setFade(true);
      }, FADE_DURATION_MS);
    }, interval);

    return () => {
      clearInterval(timer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [interval, texts.length]);

  const referenceText = texts.reduce(
    (longest, word) => (word.length > longest.length ? word : longest),
    ""
  );

  return (
    <div
      className={`relative flex justify-center items-center text-center ${className} w-full max-w-full px-2`}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="invisible" aria-hidden="true">
        {referenceText}
      </span>

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