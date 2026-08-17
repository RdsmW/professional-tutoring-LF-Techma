import { Panel } from "@/components/ui";

export type IntegrationConnectionStatus = "Connected" | "Not connected" | "—";

export type StaffRecordIntegrationsInput = {
  /** Zoho CRM contact/account ID, or student deal ID. */
  zohoId?: string | null;
  /** Stripe customer ID when the record owns one (families). */
  stripeCustomerId?: string | null;
  /** Acuity calendar/client ID when present on the record. */
  acuityId?: string | null;
  /** QuickBooks customer/vendor ID when present on the record. */
  quickbooksId?: string | null;
  /**
   * Which integrations this entity type supports.
   * Unsupported rows show "—"; supported empty IDs show "Not connected".
   */
  supports?: {
    zoho?: boolean;
    stripe?: boolean;
    acuity?: boolean;
    quickbooks?: boolean;
  };
};

function statusFromId(
  id: string | null | undefined,
  supported: boolean,
): IntegrationConnectionStatus {
  if (!supported) return "—";
  return (id ?? "").trim() ? "Connected" : "Not connected";
}

function toneFor(status: IntegrationConnectionStatus): "green" | "amber" | "navy" {
  if (status === "Connected") return "green";
  if (status === "Not connected") return "amber";
  return "navy";
}

const DEFAULT_SUPPORTS = {
  zoho: true,
  stripe: false,
  acuity: false,
  quickbooks: false,
} as const;

/**
 * Status-shell Integrations card for Family / Guardian / Student / Tutor detail pages.
 * No live API calls — uses IDs already stored on the record when present.
 */
export function StaffRecordIntegrationsCard({
  zohoId = null,
  stripeCustomerId = null,
  acuityId = null,
  quickbooksId = null,
  supports: supportsProp,
}: StaffRecordIntegrationsInput) {
  const supports = { ...DEFAULT_SUPPORTS, ...supportsProp };
  const rows: Array<{ name: string; status: IntegrationConnectionStatus }> = [
    { name: "Zoho CRM", status: statusFromId(zohoId, supports.zoho) },
    { name: "QuickBooks", status: statusFromId(quickbooksId, supports.quickbooks) },
    { name: "Acuity", status: statusFromId(acuityId, supports.acuity) },
    { name: "Stripe", status: statusFromId(stripeCustomerId, supports.stripe) },
  ];

  return (
    <Panel className="family-equal-panel staff-record-integrations-card">
      <div className="family-panel-heading">
        <h2>Integrations</h2>
      </div>
      <div className="staff-record-integrations-grid" role="list">
        {rows.map((row) => (
          <article key={row.name} className="staff-record-integrations-row" role="listitem">
            <strong>{row.name}</strong>
            <span className={`pill ${toneFor(row.status)}`}>{row.status}</span>
          </article>
        ))}
      </div>
    </Panel>
  );
}
