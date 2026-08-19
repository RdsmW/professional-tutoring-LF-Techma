"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [invite, setInvite] = useState<{
    guardianName: string;
    email: string;
    householdName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

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

  async function accept() {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(`/invite/${token}`)}`);
      return;
    }
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
  }

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
            Sign in with the matching email, then accept. Credentials are never shared between guardians.
          </p>
          <button type="button" onClick={() => void accept()} disabled={saving}>
            {saving ? "Accepting…" : isSignedIn ? "Accept invite" : "Sign in to accept"}
          </button>
        </>
      ) : (
        <p>{error || "Loading invite…"}</p>
      )}
      {error && invite ? <p style={{ color: "#9d3e34" }}>{error}</p> : null}
    </main>
  );
}
