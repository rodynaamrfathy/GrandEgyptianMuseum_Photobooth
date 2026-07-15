"use client";

import { useRef, useCallback } from "react";

export function useRateLimit(cooldownMs: number): () => boolean {
  const lastCallRef = useRef<number>(0);

  return useCallback((): boolean => {
    const now = Date.now();
    if (now - lastCallRef.current < cooldownMs) {
      return false;
    }
    lastCallRef.current = now;
    return true;
  }, [cooldownMs]);
}