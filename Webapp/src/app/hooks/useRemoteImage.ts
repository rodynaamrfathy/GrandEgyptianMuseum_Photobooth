'use client';
import { useState, useEffect } from "react";

// Extract image URL from query parameters
export const getImageFromUrl = (): string | null => {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("image");
  }
  return null;
};

// Fetch Image as Blob
export const fetchImageAsBlob = async (url: string): Promise<Blob> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Image fetch failed: ${response.status}`);
    }
    return await response.blob();
  } catch (error: unknown) {
    console.error("Failed to fetch image:", error);
    throw error;
  }
};

// React Hook Implementation
export const useRemoteImage = () => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const queryImageUrl = getImageFromUrl();
    if (queryImageUrl) {
      setImageUrl(queryImageUrl);
      setLoading(true);
      fetchImageAsBlob(queryImageUrl)
        .then(blob => {
          setImageBlob(blob);
          setError(null);
        })
        .catch(err => {
          setError(err.message);
          setImageBlob(null);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  return { imageUrl, imageBlob, loading, error };
};
