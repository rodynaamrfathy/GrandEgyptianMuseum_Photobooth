"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchImageAsBlob } from "./useRemoteImage";
import { createCardWithText } from "../utils/createCardWithText";
import { formatDate } from "../utils/blob";

// The card template ships in Webapp/public/card.svg so it deploys with the
// static bundle (served by CloudFront). To override at runtime, set
// NEXT_PUBLIC_CARD_TEMPLATE_URL to an absolute image URL.
//
// Resolved per-render (not cached at module load) so tests can flip the
// env var and get a fresh value.
const DEFAULT_CARD_TEMPLATE = "/card.svg";
function getCardTemplateUrl(): string {
  return process.env.NEXT_PUBLIC_CARD_TEMPLATE_URL || DEFAULT_CARD_TEMPLATE;
}

export interface UseCustomCardResult {
  customCardBlob: Blob | null;
  loading: boolean;
  error: string | null;
}

export function useCustomCard(editText: string): UseCustomCardResult {
  const [templateBlob, setTemplateBlob] = useState<Blob | null>(null);
  const [customCardBlob, setCustomCardBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const currentDate = useMemo(() => formatDate(), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchImageAsBlob(getCardTemplateUrl())
      .then((blob) => {
        if (!cancelled) setTemplateBlob(blob);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to fetch template";
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!templateBlob) return;

    let cancelled = false;
    const templateBlobUrl = URL.createObjectURL(templateBlob);

    createCardWithText(templateBlobUrl, editText, currentDate)
      .then((blob) => {
        if (!cancelled) setCustomCardBlob(blob);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to create card";
          setError(message);
        }
      })
      .finally(() => {
        URL.revokeObjectURL(templateBlobUrl);
      });

    return () => {
      cancelled = true;
      URL.revokeObjectURL(templateBlobUrl);
    };
  }, [templateBlob, editText, currentDate]);

  return { customCardBlob, loading, error };
}
