"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import "../lib/i18n";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen font-greta-sans relative app-bg-dark" role="alert">
      <div className="flex flex-col flex-1 items-center justify-center px-4 text-center gap-6">
        <Image src="/LOGO.svg" alt="GEM Logo" width={80} height={80} className="opacity-40" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t("error.title")}</h1>
        <p className="text-white/80 max-w-md text-base sm:text-lg">{t("error.message")}</p>
        <button
          type="button"
          onClick={reset}
          className="px-8 py-3 bg-[#E87518] text-white rounded-[16px] hover:bg-[#c5610f] transition font-greta-sans font-medium focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          {t("error.retry")}
        </button>
        {error.digest && (
          <p className="text-white/40 text-xs font-mono mt-4">ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
