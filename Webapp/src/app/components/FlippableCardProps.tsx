"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";

interface FlippableCardProps {
  frontImageUrl: string | null;
  backImageUrl: string | null;
  aspectRatioClass?: string; // Tailwind aspect ratio class
}

export default function FlippableCard({
  frontImageUrl,
  backImageUrl,
  aspectRatioClass = "aspect-[0.6667]", // default 2:3
}: FlippableCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [autoFlip, setAutoFlip] = useState(true);
  const intervalRef = useRef<number | null>(null);

  // Automatic flipping every 3 seconds
  useEffect(() => {
    if (autoFlip) {
      intervalRef.current = window.setInterval(() => {
        setFlipped((prev) => !prev);
      }, 3000);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [autoFlip]);

  const handleClick = () => {
    setFlipped((prev) => !prev);
    setAutoFlip(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const renderImage = (src: string | null, alt: string) => {
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
      />
    );
  };

  return (
    <div
      className={`cursor-pointer w-full max-w-xs mx-auto ${aspectRatioClass}`}
      onClick={handleClick}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 ease-in-out transform ${
          flipped ? "rotate-y-180" : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden">
          {renderImage(frontImageUrl, "Front Image")}
        </div>

        {/* Back */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          {renderImage(backImageUrl, "Back Image")}
        </div>
      </div>
    </div>
  );
}
