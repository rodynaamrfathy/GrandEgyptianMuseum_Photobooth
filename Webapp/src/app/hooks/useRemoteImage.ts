'use client';
import { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_AWS_API_BASE_URL || "";

// Extract image ID from query parameters
export const getImageFromUrl = (): string | null => {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("image");
  }
  return null;
};

// Fetch Image as Blob from any URL
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

// Fetch Image as Blob from AWS API by Image ID
export const fetchImageFromAWSAPI = async (imageId: string): Promise<Blob> => {
  try {
    const apiUrl = `${API_BASE_URL}/${imageId}`;
    return await fetchImageAsBlob(apiUrl);
  } catch (error: unknown) {
    console.error("Failed to fetch image from AWS:", error);
    throw error;
  }
};

// React Hook Implementation
export const useRemoteImage = () => {
  const [imageId, setImageId] = useState<string>("");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const queryImageId = getImageFromUrl();
    if (queryImageId) {
      setImageId(queryImageId);
      setLoading(true);
      fetchImageFromAWSAPI(queryImageId)
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

  return { imageId, imageBlob, loading, error };
};
