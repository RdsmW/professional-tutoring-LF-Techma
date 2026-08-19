"use client";

import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

/**
 * Clerk client redirects after sign-in can land on a blank App Router page
 * until a full refresh. Wait for the session, then hard-navigate to the portal.
 */
export default function PostLoginPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !userLoaded) return;

    if (!isSignedIn) {
      window.location.replace("/sign-in");
      return;
    }

    const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
    window.location.replace(role === "staff" ? "/staff" : "/family");
  }, [isLoaded, isSignedIn, user, userLoaded]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--canvas)",
        padding: 24,
        color: "var(--ink)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <strong style={{ font: "700 18px Georgia, serif" }}>Opening your portal…</strong>
        <p style={{ marginTop: 8, color: "var(--muted)", fontSize: 12 }}>
          Finishing sign-in and loading Family or Staff.
        </p>
      </div>
    </main>
  );
}
