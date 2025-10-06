"use client";
import Image from "next/image";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ShareButton from "./components/ShareButton";
import EditButton from "./components/EditButton";
import { useRemoteImage } from "./hooks/useRemoteImage";
import { useCustomCard } from "./hooks/useCustomCard";
import { useState, useEffect } from "react";
import EmailPopup from "./components/EmailPopup";
import GetImageByEmail from "./components/GetImageByEmail";
import LoopingText from "./components/LoopingText";
import FlippableCard from "./components/FlippableCardProps";

import "../lib/i18n";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t, i18n } = useTranslation();

  // Image
  const { imageBlob } = useRemoteImage();

  // Custom Card
  const [editText, setEditText] = useState("");
  const { customCardBlob } = useCustomCard(editText);

  useEffect(() => {
    setEditText(t("edit.defaultText"));
  }, [i18n.language, t]);

  // Email Popup
  const [isEmailEntered, setIsEmailEntered] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isEmailEntered ? "auto" : "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isEmailEntered]);

  // Blob URLs
  const blobUrl = imageBlob ? URL.createObjectURL(imageBlob) : null;
  const customCardUrl = customCardBlob ? URL.createObjectURL(customCardBlob) : null;

  return (
    <div className="flex flex-col min-h-screen font-cairo relative">
      <Header />
      <main
        dir={i18n.dir()}
        className="flex flex-col flex-1 items-center justify-start bg-[url('/dark_mode_background.svg')] bg-cover bg-center pb-8"
      >
        <div className="max-w-md flex flex-col gap-6 mt-8 mx-auto items-center justify-center">
          <LoopingText
            texts={[
              t("keepMemories"),
              t("edit.defaultText"),
              t("buttons.share"),
              t("alertPhotoBooth"),
            ]}
            interval={3000}
            className="text-2xl font-semibold"
          />

          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center w-full">
              <FlippableCard
                frontImageUrl={blobUrl}
                backImageUrl={customCardUrl}
                aspectRatioClass="aspect-[0.5968]"
              />
            </div>

            {/* Share Button & Edit Button */}
            <div className="flex flex-col w-full max-w-md gap-4 mt-4 relative">
              {imageBlob && customCardBlob && (
                <GetImageByEmail
                  imageUrl={URL.createObjectURL(imageBlob)}
                  cardBlob={customCardBlob}
                  className="w-full"
                />
              )}
              {imageBlob && customCardBlob && (
                <ShareButton
                  imageUrl={URL.createObjectURL(imageBlob)}
                  cardBlob={customCardBlob}
                />
              )}
              <EditButton
                textToEdit={editText}
                onSave={(newText) => setEditText(newText)}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Email Popup */}
      {!isEmailEntered && (
        <EmailPopup
          onSubmit={() => setIsEmailEntered(true)}
          imageName="booth_image.png"
          cardName="custom_card.png"
          kioskName="Ramses"
          filterName="default"
        />
      )}
    </div>
  );
}
