"use client";

import "../../lib/i18n";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export default function Header(): JSX.Element {
  return (
    <header className="flex justify-between items-center p-4 top-0 z-40">
      <Image src="LOGO.svg" alt="GEM Logo" width={80} height={80} priority />
      <ChangeLanguageButton />
    </header>
  );
}

function ChangeLanguageButton(): JSX.Element {
  const { i18n, t } = useTranslation();

  const toggleLanguage = (): void => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    void i18n.changeLanguage(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  const isArabic = i18n.language === "ar";

  return (
    <button
      onClick={toggleLanguage}
      aria-label={t("header.toggleLanguage")}
      className="text-xl font-bold bg-orange-500 text-white rounded-[8px] w-8 h-8 flex items-center justify-center hover:bg-orange-600 transition focus:outline-none focus:ring-2 focus:ring-orange-300"
    >
      {isArabic ? "EN" : "ع"}
    </button>
  );
}