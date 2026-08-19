"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ConfirmationState = {
  message: string;
  schedulingPath: "family_selected" | "pt_chooses";
  invitePaths: Array<{ label: string; path: string }>;
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
            <p>
              {state.schedulingPath === "family_selected"
                ? "We saved your preferred tutor and time. This is not a confirmed seat yet."
                : "Professional Tutoring will choose a tutor and time for you."}
            </p>
            <h2>Join the family portal</h2>
            <p>
              Open your invite link and finish joining <strong>before</strong> opening the family
              portal.
            </p>
            <ul className="public-ay-invites">
              {state.invitePaths.map((invite) => (
                <li key={invite.path}>
                  <span>{invite.label}</span>
                  <Link href={invite.path}>{invite.path}</Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>This confirmation is only shown right after you submit. If you need your invite link, contact Professional Tutoring.</p>
        )}
      </div>
    </main>
  );
}
