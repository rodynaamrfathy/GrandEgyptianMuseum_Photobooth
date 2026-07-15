"use client";

import { useState, useEffect, useCallback } from "react";
import { isValidImageId } from "../utils/imageId";

const API_BASE_URL = process.env.NEXT_PUBLIC_AWS_API_BASE_URL || "";

export function getImageFromUrl(): string | null {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("image");
  }
  return null;
}

export async function fetchImageAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image fetch failed: ${response.status}`);
  }
  return response.blob();
}

export async function fetchImageFromAWSAPI(imageId: string): Promise<Blob> {
  const apiUrl = `${API_BASE_URL}/${imageId}`;
  return fetchImageAsBlob(apiUrl);
}

export interface UseRemoteImageResult {
  imageId: string;
  imageBlob: Blob | null;
  loading: boolean;
  error: string | null;
}

export function useRemoteImage(): UseRemoteImageResult {
  const [imageId, setImageId] = useState<string>("");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImage = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    try {
      const blob = await fetchImageFromAWSAPI(id);
      setImageBlob(blob);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch image";
      setError(message);
      setImageBlob(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const queryImageId = getImageFromUrl();
    if (queryImageId && isValidImageId(queryImageId)) {
      setImageId(queryImageId);
      void fetchImage(queryImageId);
    }
  }, [fetchImage]);

  return { imageId, imageBlob, loading, error };
}