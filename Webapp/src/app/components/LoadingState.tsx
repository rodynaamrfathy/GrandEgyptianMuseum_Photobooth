"use client";

import Image from "next/image";
import LoopingText from "./LoopingText";
import { useTranslation } from "react-i18next";

export interface LoadingStateProps {
  className?: string;
}

export default function LoadingState({
  className = "",
}: LoadingStateProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-col items-center justify-center gap-6 py-12 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={t("loading.title")}
    >
      <div className="relative animate-pulse">
        <Image
          src="/LOGO.svg"
          alt="GEM Logo"
          width={80}
          height={80}
          className="opacity-70 transition-transform duration-2000 ease-in-out"
          style={{
            animation: "bounceSlow 2s ease-in-out infinite",
          }}
          priority
        />
      </div>

      <LoopingText
        texts={[
          t("loading.title"),
          t("loading.preparing"),
          t("loading.almost"),
        ]}
        interval={2500}
        className="text-lg font-semibold"
      />
    </div>
  );
}