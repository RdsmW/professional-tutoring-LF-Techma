import type { ReactNode } from "react";
import { Panel } from "@/components/ui";

export type StaffRecordIntegrationsInput = {
  /** Zoho CRM contact/account ID, or student deal ID. */
  zohoId?: string | null;
  /** Zoho CRM record URL (read-only; filled by integration later). */
  zohoUrl?: string | null;
  /** Stripe customer ID when the record owns one (families). */
  stripeCustomerId?: string | null;
  /** Stripe default payment method ID when present (families). */
  stripePaymentMethodId?: string | null;
  /** Acuity calendar/client ID when present on the record. */
  acuityId?: string | null;
  acuityUrl?: string | null;
  /** QuickBooks customer/vendor ID when present on the record. */
  quickbooksId?: string | null;
  quickbooksUrl?: string | null;
  /**
   * Which extra integrations this entity type stores.
   * Stripe / Acuity / QuickBooks render only when filled.
   */
  supports?: {
    stripe?: boolean;
    acuity?: boolean;
    quickbooks?: boolean;
  };
};

type IntegrationField = {
  id: string;
  label: string;
  value: string;
  href?: string | null;
};

function trimmed(value: string | null | undefined) {
  const next = (value ?? "").trim();
  return next || null;
}

function externalHref(value: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return null;
}

function buildIntegrationFields({
  zohoId = null,
  zohoUrl = null,
  stripeCustomerId = null,
  stripePaymentMethodId = null,
  acuityId = null,
  acuityUrl = null,
  quickbooksId = null,
  quickbooksUrl = null,
}: StaffRecordIntegrationsInput): IntegrationField[] {
  const zohoUrlValue = trimmed(zohoUrl);
  const acuityUrlValue = trimmed(acuityUrl);
  const quickbooksUrlValue = trimmed(quickbooksUrl);
  const fields: IntegrationField[] = [];

  const zohoIdValue = trimmed(zohoId);
  fields.push({ id: "zoho-id", label: "Zoho CRM ID", value: zohoIdValue ?? "" });
  fields.push({
    id: "zoho-url",
    label: "Zoho CRM URL",
    value: zohoUrlValue ?? "",
    href: zohoUrlValue ? externalHref(zohoUrlValue) : null,
  });

  const stripeUser = trimmed(stripeCustomerId);
  const stripePm = trimmed(stripePaymentMethodId);
  if (stripeUser) fields.push({ id: "stripe-user", label: "Stripe User ID", value: stripeUser });
  if (stripePm) {
    fields.push({ id: "stripe-payment-method", label: "Stripe payment method ID", value: stripePm });
  }

  const acuityIdValue = trimmed(acuityId);
  if (acuityIdValue) fields.push({ id: "acuity-id", label: "Acuity ID", value: acuityIdValue });
  if (acuityUrlValue) {
    fields.push({
      id: "acuity-url",
      label: "Acuity URL",
      value: acuityUrlValue,
      href: externalHref(acuityUrlValue),
    });
  }

  const quickbooksIdValue = trimmed(quickbooksId);
  if (quickbooksIdValue) {
    fields.push({ id: "quickbooks-id", label: "QuickBooks ID", value: quickbooksIdValue });
  }
  if (quickbooksUrlValue) {
    fields.push({
      id: "quickbooks-url",
      label: "QuickBooks URL",
      value: quickbooksUrlValue,
      href: externalHref(quickbooksUrlValue),
    });
  }

  return fields;
}

export const STAFF_RECORD_INFO_CARD_CLASS = "family-equal-panel staff-record-info-card";

/** Side-by-side Profile / Household / Integrations row (equal height). */
export function StaffRecordPrimaryRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["staff-record-primary-row", "staff-equal-cards", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

/**
 * Field-value Integrations card for Family / Guardian / Student / Tutor detail.
 * Zoho CRM ID and URL always show (empty allowed). Other integrations only when filled.
 * Read-only — staff do not edit these values.
 */
export function StaffRecordIntegrationsCard(props: StaffRecordIntegrationsInput) {
  const fields = buildIntegrationFields(props);

  return (
    <Panel className={`${STAFF_RECORD_INFO_CARD_CLASS} staff-record-integrations-card`}>
      <div className="family-panel-heading">
        <h2>Integrations</h2>
      </div>
      <div className="family-household-summary">
        <div className="family-household-dense">
          <div className="family-household-upper staff-record-integrations-fields">
            {fields.map((field) => (
              <span key={field.id}>
                <small>{field.label}</small>
                {field.href ? (
                  <a
                    href={field.href}
                    target="_blank"
                    rel="noreferrer"
                    className="family-zoho-url-link"
                    title={field.href}
                  >
                    {field.value}
                  </a>
                ) : (
                  <strong>{field.value}</strong>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
