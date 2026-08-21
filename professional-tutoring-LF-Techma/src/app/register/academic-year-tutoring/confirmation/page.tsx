"use client";

import { useEffect, useState } from "react";

type ConfirmationState = {
  message: string;
  schedulingPath?: "family_selected" | "pt_chooses";
  paymentStatus?: string;
  portalInvitation?: {
    emailSent: boolean;
    emailAlreadySent: boolean;
    pending: boolean;
    failed: boolean;
    sentCount?: number;
    alreadySentCount?: number;
  };
};

export default function AcademicYearTutoringConfirmationPage() {
  const [state, setState] = useState<ConfirmationState | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ayTutoringConfirmation");
      if (raw) setState(JSON.parse(raw) as ConfirmationState);
    } catch {
      setState(null);
    }
  }, []);

  return (
    <main className="public-ay">
      <div className="public-ay-card">
        <p className="public-ay-kicker">Academic Year Tutoring</p>
        <h1>We received your registration</h1>
        {state ? (
          <>
            <p>{state.message}</p>
            {state.paymentStatus ? <p>Payment status: <strong>{state.paymentStatus}</strong>.</p> : null}
            {state.schedulingPath ? (
              <p>
                {state.schedulingPath === "family_selected"
                  ? "We saved your preferred tutor and time. This is not a confirmed seat yet."
                  : "Professional Tutoring will choose a tutor and time for you."}
              </p>
            ) : null}
            <h2>Join the family portal</h2>
            {(state.portalInvitation?.sentCount ?? 0) + (state.portalInvitation?.alreadySentCount ?? 0) >= 2 ? (
              <p>Family portal invitations have been sent to both parent email addresses.</p>
            ) : state.portalInvitation?.emailSent || state.portalInvitation?.emailAlreadySent ? (
              <p>Family portal invitations are being sent to both parent email addresses.</p>
            ) : state.portalInvitation?.pending ? (
              <p>Your family portal invitations are still being prepared.</p>
            ) : (
              <p>Family portal invitations will be sent after secure card setup is complete.</p>
            )}
          </>
        ) : (
          <p>This confirmation is only shown right after you submit. If you need your invite link, contact Professional Tutoring.</p>
        )}
      </div>
    </main>
  );
}
