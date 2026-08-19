"use client";

import { useEffect, useRef } from "react";

export type BootstrapResult = {
  ok: boolean;
  role: "staff" | "family" | null;
  displayName: string | null;
  householdStatus: string | null;
  householdName: string | null;
};

export function BootstrapSession({
  onComplete,
}: {
  onComplete?: (result: BootstrapResult) => void;
}) {
  const ran = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      try {
        const response = await fetch("/api/bootstrap", { method: "POST" });
        const data = (await response.json()) as BootstrapResult;
        onCompleteRef.current?.(data);
      } catch {
        onCompleteRef.current?.({
          ok: false,
          role: null,
          displayName: null,
          householdStatus: null,
          householdName: null,
        });
      }
    })();
  }, []);

  return null;
}
