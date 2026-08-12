import { StaffIntegrationsClient } from "@/components/staff-integrations-client";
import { isStripeConfigured } from "@/lib/stripe/client";

export default function StaffIntegrationsPage() {
  return <StaffIntegrationsClient stripeConfigured={isStripeConfigured()} />;
}
