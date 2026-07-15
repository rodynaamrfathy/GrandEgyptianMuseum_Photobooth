"use client";

import { useMemo, useEffect } from "react";

export function useBlobUrl(blob: Blob | null): string | null {
  const url = useMemo(() => {
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }, [blob]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
}