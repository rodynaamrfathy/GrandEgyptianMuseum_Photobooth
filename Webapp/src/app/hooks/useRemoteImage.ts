"use client";

import { useState, useEffect, useCallback } from "react";
import { isValidImageId } from "../utils/imageId";

const API_BASE_URL = process.env.NEXT_PUBLIC_AWS_API_BASE_URL || "";
const DECRYPT_TOKEN_URL = process.env.NEXT_PUBLIC_DECRYPT_TOKEN_URL || "";

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

/**
 * Exchange a kiosk-issued QR token for the image URL via the
 * server-side DecryptToken Lambda. The key never leaves the server.
 * Returns null on any failure so callers collapse invalid tokens to
 * the same error UI as missing images.
 */
export async function resolveTokenFromKiosk(token: string): Promise<string | null> {
  if (!DECRYPT_TOKEN_URL) return null;
  const url = `${DECRYPT_TOKEN_URL}?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as { image_url?: unknown };
  if (!data || typeof data.image_url !== "string") return null;
  return data.image_url;
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

  const fetchImageFromUrl = useCallback(async (imageUrl: string): Promise<void> => {
    setLoading(true);
    try {
      const blob = await fetchImageAsBlob(imageUrl);
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
    const param = getImageFromUrl();
    if (!param) return;

    // Direct imageId (?image=<kiosk>_<filter>_<timestamp>)
    if (isValidImageId(param)) {
      setImageId(param);
      void fetchImage(param);
      return;
    }

    // Treat anything else as a kiosk QR token.
    void (async () => {
      setLoading(true);
      try {
        const resolvedUrl = await resolveTokenFromKiosk(param);
        if (!resolvedUrl) {
          setError("Invalid photo link");
          setImageBlob(null);
          return;
        }
        await fetchImageFromUrl(resolvedUrl);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchImage, fetchImageFromUrl]);

  return { imageId, imageBlob, loading, error };
}
