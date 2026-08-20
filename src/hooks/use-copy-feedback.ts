"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCopyFeedback(duration = 2_000) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const copy = useCallback(
    async (value: string) => {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), duration);
    },
    [duration],
  );

  return { copied, copy };
}
