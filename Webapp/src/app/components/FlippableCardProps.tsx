"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { FLIP_INTERVAL_MS } from "../constants/cardText";

export interface FlippableCardProps {
  frontImageUrl: string | null;
  backImageUrl: string | null;
  aspectRatioClass?: string;
}

export default function FlippableCard({
  frontImageUrl,
  backImageUrl,
  aspectRatioClass = "aspect-[0.6667]",
}: FlippableCardProps): JSX.Element {
  const [flipped, setFlipped] = useState<boolean>(false);
  const [autoFlip, setAutoFlip] = useState<boolean>(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (autoFlip) {
      intervalRef.current = setInterval(() => {
        setFlipped((prev) => !prev);
      }, FLIP_INTERVAL_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoFlip]);

  const handleClick = useCallback((): void => {
    setFlipped((prev) => !prev);
    setAutoFlip(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const renderImage = (src: string | null, alt: string): JSX.Element => {
    if (!src) {
      return (
        <div className="w-full h-full bg-gray-500 flex items-center justify-center text-white rounded-xl">
          {alt} not available
        </div>
      );
    }
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className="rounded-xl object-cover shadow-lg"
        sizes="(max-width: 768px) 100vw, 320px"
        unoptimized
      />
    );
  };

  return (
    <div
      className={`perspective-1000 cursor-pointer w-full max-w-xs mx-auto ${aspectRatioClass}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Flip card to see front and back"
      aria-pressed={flipped}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 ease-in-out transform ${
          flipped ? "rotate-y-180" : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="absolute w-full h-full backface-hidden">
          {renderImage(frontImageUrl, "Front Image")}
        </div>
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          {renderImage(backImageUrl, "Back Image")}
        </div>
      </div>
    </div>
  );
}