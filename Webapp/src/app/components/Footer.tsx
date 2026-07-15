"use client";

import { useTranslation } from "react-i18next";

export default function Footer(): JSX.Element {
  const { t } = useTranslation();

  return (
    <footer className="text-[#FFFFFF] dark:text-[#FFFFFF] text-center p-4 text-[10px] font-greta-sans">
      {t("footer.text")}{" "}
      <span className="text-[#EE7103]">{t("footer.team")}</span>
    </footer>
  );
}