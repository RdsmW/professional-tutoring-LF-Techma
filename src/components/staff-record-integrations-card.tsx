import { Panel } from "@/components/ui";

export type StaffRecordIntegrationsInput = {
  /** Zoho CRM contact/account ID, or student deal ID. */
  zohoId?: string | null;
  /** Zoho CRM record URL from the edit form. */
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
   * Zoho CRM ID / URL always show (empty = em dash).
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
  value: string | null;
  href?: string | null;
};

const EMPTY = "—";

function trimmed(value: string | null | undefined) {
  const next = (value ?? "").trim();
  return next || null;
}

function externalHref(value: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return null;
}

function display(value: string | null) {
  return value || EMPTY;
}

/**
 * Field-value Integrations card for Family / Guardian / Student / Tutor detail.
 * No live API calls — uses IDs/URLs already stored on the record.
 */
export function StaffRecordIntegrationsCard({
  zohoId = null,
  zohoUrl = null,
  stripeCustomerId = null,
  stripePaymentMethodId = null,
  acuityId = null,
  acuityUrl = null,
  quickbooksId = null,
  quickbooksUrl = null,
  supports: supportsProp,
}: StaffRecordIntegrationsInput) {
  const supports = {
    stripe: false,
    acuity: false,
    quickbooks: false,
    ...supportsProp,
  };

  const zohoUrlValue = trimmed(zohoUrl);
  const acuityUrlValue = trimmed(acuityUrl);
  const quickbooksUrlValue = trimmed(quickbooksUrl);

  const fields: IntegrationField[] = [
    { id: "zoho-id", label: "Zoho CRM ID", value: trimmed(zohoId) },
    {
      id: "zoho-url",
      label: "Zoho CRM URL",
      value: zohoUrlValue,
      href: externalHref(zohoUrlValue),
    },
  ];

  if (supports.stripe) {
    fields.push({ id: "stripe-customer", label: "Stripe customer ID", value: trimmed(stripeCustomerId) });
    fields.push({
      id: "stripe-payment-method",
      label: "Stripe payment method ID",
      value: trimmed(stripePaymentMethodId),
    });
  }
  if (supports.acuity) {
    fields.push({ id: "acuity-id", label: "Acuity ID", value: trimmed(acuityId) });
    fields.push({
      id: "acuity-url",
      label: "Acuity URL",
      value: acuityUrlValue,
      href: externalHref(acuityUrlValue),
    });
  }
  if (supports.quickbooks) {
    fields.push({ id: "quickbooks-id", label: "QuickBooks ID", value: trimmed(quickbooksId) });
    fields.push({
      id: "quickbooks-url",
      label: "QuickBooks URL",
      value: quickbooksUrlValue,
      href: externalHref(quickbooksUrlValue),
    });
  }

  return (
    <Panel className="family-equal-panel staff-record-integrations-card">
      <div className="family-panel-heading">
        <h2>Integrations</h2>
      </div>
      <div className="staff-record-integrations-grid" role="list">
        {fields.map((field) => (
          <article key={field.id} className="staff-record-integrations-field" role="listitem">
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
              <strong>{display(field.value)}</strong>
            )}
          </article>
        ))}
      </div>
    </Panel>
  );
}
