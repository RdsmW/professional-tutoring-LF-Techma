"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ConfirmationState = {
  message: string;
  schedulingPath?: "family_selected" | "pt_chooses";
  paymentStatus?: string;
  invitePaths?: Array<{ label: string; path: string }>;
  portalInvitation?: {
    emailSent: boolean;
    emailAlreadySent: boolean;
    pending: boolean;
    failed: boolean;
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
            {state.portalInvitation?.emailSent ? (
              <p>A family portal invitation email has been sent. You can also use the invite link below.</p>
            ) : state.portalInvitation?.emailAlreadySent ? (
              <p>A family portal invitation email was already sent. You can also use the invite link below.</p>
            ) : state.portalInvitation?.pending ? (
              <p>Your family portal invitation is still being prepared. You can use the invite link below.</p>
            ) : (
              <p>Your invitation has been prepared. Open your invite link and finish joining before opening the portal.</p>
            )}
            {state.invitePaths?.length ? <ul className="public-ay-invites">
              {state.invitePaths.map((invite) => (
                <li key={invite.path}>
                  <span>{invite.label}</span>
                  <Link href={invite.path}>{invite.path}</Link>
                </li>
              ))}
            </ul> : <p>Professional Tutoring will provide the portal invitation details.</p>}
          </>
        ) : (
          <p>This confirmation is only shown right after you submit. If you need your invite link, contact Professional Tutoring.</p>
        )}
      </div>
    </main>
  );
}
