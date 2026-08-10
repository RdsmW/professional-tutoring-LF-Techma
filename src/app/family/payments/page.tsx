"use client";

import { useEffect, useState } from "react";
import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

type SavedCard = {
  brand: string | null;
  last4: string | null;
} | null;

export default function FamilyPaymentsPage() {
  const [savedCard, setSavedCard] = useState<SavedCard>(null);

  useEffect(() => {
    void fetch("/api/family/book-tutoring/options")
      .then((response) => response.json())
      .then((data) => {
        if (data?.ok && data.savedCard?.last4) {
          setSavedCard({ brand: data.savedCard.brand, last4: data.savedCard.last4 });
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Payments & Receipts"
        title="Payments & Receipts"
        description="Card details stay with Stripe. This portal shows tokenized status and receipts only."
      />
      <div className="hosted-payment">
        <span className="shield">◇</span>
        <div>
          <span className="eyebrow">Payment method</span>
          <h3>Hosted payment profile</h3>
          <p>
            {savedCard?.last4
              ? `Saved for future bookings: ${(savedCard.brand || "Card").toUpperCase()} ···· ${savedCard.last4}`
              : "No card on file yet. Save one during Book Tutoring after giving permission."}
          </p>
        </div>
        <span className="pill">{savedCard?.last4 ? "On file" : "Pending setup"}</span>
      </div>
      <Panel title="Transactions" eyebrow="Stage 2">
        <ComingStageNote feature="Payment detail rows and receipt download" />
      </Panel>
    </>
  );
}
