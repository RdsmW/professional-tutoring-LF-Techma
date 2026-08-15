"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AppToastTone = "success" | "error" | "info";

export type AppToast = {
  id: string;
  message: string;
  tone: AppToastTone;
};

const DEFAULT_DURATION_MS = 4200;

export function useAppToast(durationMs = DEFAULT_DURATION_MS) {
  const [toasts, setToasts] = useState<AppToast[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: AppToastTone = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, tone }]);
      const timer = window.setTimeout(() => dismiss(id), durationMs);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss, durationMs],
  );

  const success = useCallback((message: string) => push(message, "success"), [push]);
  const error = useCallback((message: string) => push(message, "error"), [push]);
  const info = useCallback((message: string) => push(message, "info"), [push]);

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    };
  }, []);

  return {
    toasts,
    dismiss,
    push,
    success,
    error,
    info,
  };
}

export function AppToastHost({
  toasts,
  onDismiss,
}: {
  toasts: AppToast[];
  onDismiss: (id: string) => void;
}) {
  if (!toasts.length) return null;

  return (
    <div className="app-toast-stack" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`app-toast app-toast--${toast.tone}`}
          role={toast.tone === "error" ? "alert" : "status"}
        >
          <p className="app-toast-message">{toast.message}</p>
          <button
            type="button"
            className="app-toast-dismiss"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
