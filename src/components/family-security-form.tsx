"use client";

import { useMemo, useState } from "react";
import { useReverification, useUser } from "@clerk/nextjs";
import type { EmailAddressResource } from "@clerk/shared/types";

type SecurityDraft = {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function clerkErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "errors" in error) {
    const errors = (error as { errors?: { longMessage?: string; message?: string }[] }).errors;
    const first = errors?.[0];
    if (first?.longMessage || first?.message) return first.longMessage || first.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function FamilySecurityForm({
  initialEmail,
  onBack,
  onSaved,
}: {
  initialEmail: string;
  onBack: () => void;
  onSaved: (message: string) => void;
}) {
  const { user, isLoaded } = useUser();
  const [draft, setDraft] = useState<SecurityDraft>({
    email: initialEmail,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<EmailAddressResource | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const updatePassword = useReverification(
    (params: { currentPassword: string; newPassword: string }) =>
      user?.updatePassword({
        currentPassword: params.currentPassword,
        newPassword: params.newPassword,
        signOutOfOtherSessions: true,
      }),
  );

  const createEmailAddress = useReverification((email: string) =>
    user?.createEmailAddress({ email }),
  );

  const currentEmail = (
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    initialEmail
  ).trim();

  const emailChanged = draft.email.trim().toLowerCase() !== currentEmail.toLowerCase();
  const passwordAttempted = Boolean(draft.newPassword || draft.confirmPassword || draft.currentPassword);
  const passwordValid =
    !draft.newPassword ||
    Boolean(
      draft.currentPassword &&
        draft.newPassword.length >= 10 &&
        draft.newPassword === draft.confirmPassword,
    );
  const canSave = useMemo(() => {
    if (pendingEmail) return false;
    if (!passwordValid) return false;
    if (emailChanged) return Boolean(draft.email.trim());
    return Boolean(draft.newPassword);
  }, [pendingEmail, passwordValid, emailChanged, draft.email, draft.newPassword]);

  async function saveSecurity(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !canSave || saving) return;
    setSaving(true);
    setError(null);
    setResetMessage(null);
    try {
      if (emailChanged) {
        const created = await createEmailAddress(draft.email.trim());
        if (!created) {
          setError("Unable to start email verification.");
          return;
        }
        await created.prepareVerification({ strategy: "email_code" });
        await user.reload();
        setPendingEmail(created);
        setError(null);
        return;
      }

      if (draft.newPassword) {
        await updatePassword({
          currentPassword: draft.currentPassword,
          newPassword: draft.newPassword,
        });
        setDraft({
          email: currentEmail,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        onSaved("Password updated. Other sessions were signed out.");
      }
    } catch (err) {
      setError(clerkErrorMessage(err, "Unable to save security change."));
    } finally {
      setSaving(false);
    }
  }

  async function verifyEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!pendingEmail || !verifyCode.trim() || verifying || !user) return;
    setVerifying(true);
    setError(null);
    try {
      const attempt = await pendingEmail.attemptVerification({ code: verifyCode.trim() });
      if (attempt?.verification.status !== "verified") {
        setError("Verification incomplete. Check the code and try again.");
        return;
      }
      await user.update({ primaryEmailAddressId: attempt.id });
      await user.reload();
      setPendingEmail(null);
      setVerifyCode("");
      setDraft({
        email: attempt.emailAddress,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onSaved("Sign-in email verified and updated.");
    } catch (err) {
      setError(clerkErrorMessage(err, "Unable to verify email."));
    } finally {
      setVerifying(false);
    }
  }

  async function startPasswordReset() {
    setError(null);
    setResetMessage(null);
    setDraft((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
    setResetMessage(
      "For a secure email reset, sign out and use Forgot password on the sign-in page. Or enter your current password above to change it here.",
    );
  }

  if (!isLoaded) {
    return <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading account security…</p>;
  }

  if (pendingEmail) {
    return (
      <section className="wizard-shell panel">
        <button type="button" className="page-back" onClick={onBack}>
          ← Family profile
        </button>
        <span className="eyebrow">Account & security</span>
        <h2>Verify sign-in email</h2>
        <p style={{ maxWidth: 640, fontSize: 11, color: "var(--muted)" }}>
          Enter the code sent to <strong>{pendingEmail.emailAddress}</strong> before the new sign-in
          email takes effect.
        </p>
        <form className="wizard-stage" onSubmit={verifyEmail}>
          <div className="input-grid">
            <label>
              Verification code
              <input
                value={verifyCode}
                onChange={(event) => setVerifyCode(event.target.value)}
                autoComplete="one-time-code"
                required
              />
            </label>
          </div>
          {error ? <div className="validation-hint">{error}</div> : null}
          <div className="wizard-footer">
            <button
              type="button"
              className="wizard-back"
              onClick={() => {
                setPendingEmail(null);
                setVerifyCode("");
                setError(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="family-primary" disabled={!verifyCode.trim() || verifying}>
              {verifying ? "Verifying…" : "Verify email"}
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="wizard-shell panel">
      <button type="button" className="page-back" onClick={onBack}>
        ← Family profile
      </button>
      <span className="eyebrow">Account & security</span>
      <h2>Sign-in and password</h2>
      <p style={{ maxWidth: 720, fontSize: 11, color: "var(--muted)" }}>
        Update your individual adult credentials here. Password values are never displayed after
        submission or exported from this screen.
      </p>
      <form className="wizard-stage" onSubmit={saveSecurity}>
        <div className="input-grid">
          <label>
            Sign-in email
            <input
              type="email"
              value={draft.email}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Current password
            <input
              type="password"
              autoComplete="current-password"
              value={draft.currentPassword}
              onChange={(event) => setDraft({ ...draft, currentPassword: event.target.value })}
            />
          </label>
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              value={draft.newPassword}
              onChange={(event) => setDraft({ ...draft, newPassword: event.target.value })}
              placeholder="10+ characters"
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              value={draft.confirmPassword}
              onChange={(event) => setDraft({ ...draft, confirmPassword: event.target.value })}
            />
          </label>
        </div>

        {emailChanged ? (
          <div className="validation-hint">
            A sign-in email change requires authenticated re-verification before it takes effect.
          </div>
        ) : null}
        {passwordAttempted && !passwordValid ? (
          <div className="validation-hint">
            Enter the current password and matching new passwords of at least 10 characters.
          </div>
        ) : null}
        {error ? <div className="validation-hint">{error}</div> : null}
        {resetMessage ? (
          <p style={{ color: "var(--mint, #2f6b4f)", fontSize: 11, marginTop: 10 }}>{resetMessage}</p>
        ) : null}

        <button type="button" className="text-button" onClick={() => void startPasswordReset()}>
          Use secure password reset instead
        </button>

        <div className="wizard-footer">
          <button type="button" className="wizard-back" onClick={onBack}>
            Cancel
          </button>
          <button type="submit" className="family-primary" disabled={!canSave || saving}>
            {saving ? "Saving…" : "Save security change"}
          </button>
        </div>
      </form>
    </section>
  );
}
