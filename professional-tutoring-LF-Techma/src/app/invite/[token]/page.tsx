"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { isSignedIn } = useAuth();
  const [invite, setInvite] = useState<{
    guardianName: string;
    email: string;
    householdName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const authenticationReturnPath = `/invite/${token}`;
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(authenticationReturnPath)}`;
  const signUpHref = `/sign-up?redirect_url=${encodeURIComponent(authenticationReturnPath)}`;

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`/api/invite/${token}`);
        const data = await response.json();
        if (!response.ok || !data.ok) {
          setError(data.error || "Invite not found.");
          return;
        }
        setInvite(data.invite);
      } catch {
        setError("Unable to load invite.");
      }
    })();
  }, [token]);

  const accept = useCallback(async () => {
    if (!isSignedIn) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/invite/${token}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to accept invite.");
        return;
      }
      setDone(true);
    } catch {
      setError("Unable to accept invite.");
    } finally {
      setSaving(false);
    }
  }, [isSignedIn, token]);

  useEffect(() => {
    if (invite && isSignedIn && !saving && !done) {
      void accept();
    }
  }, [accept, done, invite, isSignedIn, saving]);

  if (done) {
    return (
      <main style={{ maxWidth: 520, margin: "60px auto", padding: 24 }}>
        <h1>Invite accepted</h1>
        <p>Your guardian account is linked to the household.</p>
        <Link href="/family">Go to Family Portal →</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 520, margin: "60px auto", padding: 24 }}>
      <h1>Family invite</h1>
      {invite ? (
        <>
          <p>
            Join <strong>{invite.householdName}</strong> as <strong>{invite.guardianName}</strong> (
            {invite.email}).
          </p>
          <p style={{ fontSize: 12, color: "#666" }}>
            Sign in with the matching email. Credentials are never shared between guardians.
          </p>
          {isSignedIn ? (
            <p>{saving ? "Linking your guardian account…" : "Preparing your family portal…"}</p>
          ) : (
            <p>
              <Link href={signInHref}>Sign in to accept</Link>
              {" or "}
              <Link href={signUpHref}>create an account</Link>
              {"."}
            </p>
          )}
        </>
      ) : (
        <p>{error || "Loading invite…"}</p>
      )}
      {error && invite ? <p style={{ color: "#9d3e34" }}>{error}</p> : null}
    </main>
  );
}
