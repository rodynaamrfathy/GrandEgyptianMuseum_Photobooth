"use client";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ShareButton from "./components/ShareButton";
import EditButton from "./components/EditButton";
import LoadingState from "./components/LoadingState";
import FlippableCard from "./components/FlippableCardProps";
import DownloadButton from "./components/DownloadButton";
import { useRemoteImage } from "./hooks/useRemoteImage";
import { useCustomCard } from "./hooks/useCustomCard";
import { useBlobUrl } from "./hooks/useBlobUrl";
import { useState, useEffect } from "react";

import "../lib/i18n";
import { useTranslation } from "react-i18next";

export default function Home(): JSX.Element {
  const { t, i18n } = useTranslation();

  const { imageBlob, loading: imageLoading, error: imageError } = useRemoteImage();

  const [editText, setEditText] = useState<string>("");

  // Set default edit text when language changes — `t` excluded from deps to avoid infinite re-render
  useEffect(() => {
    setEditText(t("edit.defaultText"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const { customCardBlob, loading: cardLoading } = useCustomCard(editText);

  const blobUrl = useBlobUrl(imageBlob);
  const customCardUrl = useBlobUrl(customCardBlob);
  const shareImageUrl = useBlobUrl(imageBlob);

  const isLoading = imageLoading || cardLoading || (!imageBlob || !customCardBlob);

  return (
    <div className="flex flex-col min-h-screen font-greta-sans relative bg-[url('/dark_mode_background.svg')] bg-cover bg-center">
      <Header />
      <main
        dir={i18n.dir()}
        className="flex flex-col flex-1 items-center justify-start pb-8"
      >
        <div className="max-w-md flex flex-col gap-6 mt-8 mx-auto items-center justify-center w-full px-4">
          {isLoading && !imageError ? (
            <LoadingState />
          ) : imageError ? (
            <div
              className="flex flex-col items-center justify-center gap-4 py-12"
              role="alert"
            >
              <p className="text-white text-lg text-center">
                {t("loading.error")}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-[#E87518] text-white rounded-[16px] hover:bg-[#c5610f] transition font-greta-sans focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                {t("loading.retry")}
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center w-full">
                <FlippableCard
                  frontImageUrl={blobUrl}
                  backImageUrl={customCardUrl}
                  aspectRatioClass="aspect-[0.5968]"
                />
              </div>

              <div className="flex flex-col w-full max-w-xs gap-4 mt-4 relative">
                {imageBlob && customCardBlob && (
                  <div className="w-full flex gap-4">
                    <DownloadButton
                      blob={imageBlob}
                      fileName="GEM_Photo.jpg"
                      labelKey="buttons.downloadImage"
                      className="flex-1"
                    />
                    <DownloadButton
                      blob={customCardBlob}
                      fileName="GEM_Custom_Card.png"
                      labelKey="buttons.downloadCard"
                      className="flex-1"
                    />
                  </div>
                )}
                {imageBlob && customCardBlob && shareImageUrl && (
                  <ShareButton
                    imageUrl={shareImageUrl}
                    cardBlob={customCardBlob}
                  />
                )}
                <EditButton
                  textToEdit={editText}
                  onSave={(newText) => setEditText(newText)}
                />
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}