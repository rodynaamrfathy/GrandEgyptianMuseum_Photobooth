"use client";

import "../../lib/i18n"; 
import Image from "next/image";
import { useTranslation } from "react-i18next";

export default function Header() {
  return (
  <header className="flex justify-between items-center p-4 bg-[#141414] top-0 z-40">
    <Image src="LOGO.svg" alt="GEM Logo" width={80} height={80} />
      <ChangeLanguageButton />
    </header>
  );
}

function ChangeLanguageButton() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  return (
    <button
      onClick={toggleLanguage}
      className="text-xl font-bold bg-orange-500 text-white rounded-[8px] w-8 h-8 flex items-center justify-center hover:bg-orange-600 transition"
    >
      {i18n.language === "ar" ? "EN" : "ع"}
    </button>
  );
}
