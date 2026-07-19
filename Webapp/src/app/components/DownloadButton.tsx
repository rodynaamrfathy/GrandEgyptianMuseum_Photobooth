"use client";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DownloadButtonProps {
  blob: Blob;
  fileName: string;
  labelKey: string;
  className?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ blob, fileName, labelKey, className }) => {
  const { t } = useTranslation();

  const handleDownload = () => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <button
      onClick={handleDownload}
      aria-label={t(labelKey)}
      className={`w-full rounded-2xl py-4 px-6 shadow-lg hover:shadow-xl
                  transition-all duration-300 flex items-center justify-center
                  space-x-3 backdrop-blur bg-white/10 border border-white/20 font-greta-sans ${className || ""}`}
    >
      <Download className="w-7 h-7 text-white" />
      <span className="text-white font-medium font-greta-sans">{t(labelKey)}</span>
    </button>
  );
};

export default DownloadButton;
