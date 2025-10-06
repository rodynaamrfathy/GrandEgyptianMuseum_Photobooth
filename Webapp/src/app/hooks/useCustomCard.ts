import { useEffect, useState } from "react";
import { fetchImageAsBlob } from "./useRemoteImage";
import { createCardWithText } from "../utils/createCardWithText";

const cardTemplateUrl =
  "https://res.cloudinary.com/dynfn6e5m/image/upload/v1746278397/uploads/1746278397692.png";

export function useCustomCard(editText: string) {
  const [templateBlob, setTemplateBlob] = useState<Blob | null>(null);
  const [customCardBlob, setCustomCardBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrentDate = () => {
    const date = new Date();
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
  };
  const currentDate = getCurrentDate();

  // Fetch template
  useEffect(() => {
    setLoading(true);
    fetchImageAsBlob(cardTemplateUrl)
      .then(setTemplateBlob)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Generate custom card
  useEffect(() => {
    if (templateBlob) {
      const templateBlobUrl = URL.createObjectURL(templateBlob);
      createCardWithText(templateBlobUrl, editText, currentDate)
        .then(setCustomCardBlob)
        .catch((err) => setError(err.message));
    }
  }, [templateBlob, editText, currentDate]);

  return {
    customCardBlob,
    loading,
    error,
  };
}
