"use client";
import { Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ShareButtonProps {
  imageUrl: string;
  cardBlob: Blob;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ cardBlob, imageUrl, className }) => {
  const { t } = useTranslation();

  const handleShare = async () => {
    try {
      const cardFile = new File([cardBlob], "memory_card.png", { type: "image/png" });

      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const imageFile = new File([imageBlob], "image.jpg", { type: imageBlob.type });

      const shareData: ShareData = {
        title: t("share.title", "Check out these images!"),
        text: t("share.text", "I wanted to share these with you"),
        files: [imageFile, cardFile],
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback → open image + card
        const cardUrl = URL.createObjectURL(cardBlob);
        const imgUrl = URL.createObjectURL(imageBlob);

        window.open(cardUrl, "_blank");
        window.open(imgUrl, "_blank");

        setTimeout(() => {
          URL.revokeObjectURL(cardUrl);
          URL.revokeObjectURL(imgUrl);
        }, 2000);
      }
    } catch (error) {
      console.error("❌ Error sharing:", error);
      alert(t("share.error", "Failed to share the images."));
    }
  };

  return (
    <button
      onClick={handleShare}
      aria-label={t("share.button", "Share via Social Media")}
      className={`w-full rounded-2xl py-4 px-6 shadow-lg hover:shadow-xl 
                  transition-all duration-300 flex items-center justify-center 
                  space-x-3 backdrop-blur bg-white/10 border border-white/20 font-sans ${className || ""}`}
    >
      <Share2 className="w-5 h-5 text-white" />
      <span className="text-white font-medium font-sans">
        {t("share.button")}
      </span>
    </button>
  );
};

export default ShareButton;
