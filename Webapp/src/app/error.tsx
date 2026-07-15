"use client";

import { useTranslation } from "react-i18next";
import "../lib/i18n";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center justify-center gap-6 py-12"
      role="alert"
    >
      <Image
        src="/LOGO.svg"
        alt="GEM Logo"
        width={80}
        height={80}
        className="opacity-40"
      />
      <p className="text-white text-lg text-center px-4">
        {t("loading.error")}
      </p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-[#E87518] text-white rounded-[16px] hover:bg-[#c5610f] transition font-greta-sans focus:outline-none focus:ring-2 focus:ring-orange-300"
      >
        {t("loading.retry")}
      </button>
    </div>
  );
}

import Image from "next/image";