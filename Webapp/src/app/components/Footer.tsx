"use client";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="text-[#FFFFFF] dark:text-[#FFFFFF] text-center p-4 text-[10px] bg-[#141414] dark:bg-[#141414] font-sans">
      {t("footer.text")}{" "}
      <span className="text-[#EE7103]">{t("footer.team")}</span>
    </footer>
  );
}
