"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import "../lib/i18n";

export default function NotFound(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen font-greta-sans relative app-bg-dark" role="alert">
      <div className="flex flex-col flex-1 items-center justify-center px-4 text-center gap-6">
        <p
          className="text-6xl sm:text-7xl md:text-8xl font-bold text-white tracking-tight"
          aria-label={t("notFound.title")}
        >
          {t("notFound.title")}
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
          {t("notFound.heading")}
        </h1>
        <p className="text-white/80 max-w-md text-base sm:text-lg">{t("notFound.message")}</p>
        <Link
          href="/"
          className="mt-2 px-8 py-3 bg-[#E87518] text-white rounded-[16px] hover:bg-[#c5610f] transition font-greta-sans font-medium focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          {t("notFound.back")}
        </Link>
      </div>
    </div>
  );
}
