import { Suspense } from "react";
import { StaffSettingsClient } from "@/components/staff-settings-client";
import { isStripeConfigured } from "@/lib/stripe/client";

export default function StaffSettingsPage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--muted)", fontSize: 14 }}>Loading settings…</p>}>
      <StaffSettingsClient stripeConfigured={isStripeConfigured()} />
    </Suspense>
  );
}
