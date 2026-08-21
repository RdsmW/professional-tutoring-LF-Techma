import {
  ACADEMIC_PAYMENT_PLANS,
  ACADEMIC_RATE_PACKAGES,
  ACADEMIC_SCHEDULE_WINDOWS,
  EXPRESS_PAYMENT_PLANS,
  FIRST_CLASS_PAYMENT_PLANS,
  FIRST_CLASS_TIME_SLOTS,
  MASTER_CLASS_SESSIONS,
  SUMMER_PAYMENT_PLANS,
  SUMMER_SCHEDULE_WINDOWS,
} from "@/lib/forms/options";

const LABEL_BY_ID = new Map<string, string>();

for (const list of [
  ACADEMIC_SCHEDULE_WINDOWS,
  SUMMER_SCHEDULE_WINDOWS,
  FIRST_CLASS_TIME_SLOTS,
  MASTER_CLASS_SESSIONS,
  ACADEMIC_RATE_PACKAGES,
  ACADEMIC_PAYMENT_PLANS,
  SUMMER_PAYMENT_PLANS,
  FIRST_CLASS_PAYMENT_PLANS,
  EXPRESS_PAYMENT_PLANS,
]) {
  for (const option of list.options) {
    LABEL_BY_ID.set(option.id, option.label);
  }
}

function labelForId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return LABEL_BY_ID.get(trimmed) ?? null;
}

function humanizeToken(raw: string): string {
  const mapped = labelForId(raw);
  if (mapped) return mapped;
  // Prefer spaced readable text over bare IDs like mon_0622
  if (/^[a-z0-9]+(?:_[a-z0-9]+)+$/i.test(raw)) {
    return raw
      .split("_")
      .map((part) => {
        if (/^\d{4}$/.test(part)) return part;
        if (/^\d+$/.test(part)) return part;
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ");
  }
  return raw;
}

function humanizeSlotPreference(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // JSON array of slot ids
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        const labels = parsed
          .map((item) => (typeof item === "string" ? humanizeToken(item) : null))
          .filter(Boolean) as string[];
        return labels.length > 0 ? labels.join(", ") : null;
      }
      if (parsed && typeof parsed === "object") {
        const record = parsed as Record<string, unknown>;
        const candidates = [record.slotId, record.id, record.preference, record.label]
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          .map((value) => humanizeToken(value.trim()));
        if (candidates.length > 0) return candidates.join(", ");
      }
    } catch {
      // fall through
    }
  }

  // Comma / semicolon separated ids
  if (/[,;]/.test(trimmed)) {
    return trimmed
      .split(/[,;]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map(humanizeToken)
      .join(", ");
  }

  return humanizeToken(trimmed);
}

export type HumanEnrollmentFields = {
  scheduleLabel: string | null;
  slotPreference: string | null;
  notes: string | null;
};

/**
 * Turn enrollment schedule / slot / notes into staff-readable text.
 * Parses JSON notes blobs and maps known option IDs when possible.
 */
export function humanizeEnrollmentFields(input: {
  notes?: string | null;
  requestedSlotPreference?: string | null;
  scheduleSummary?: string | null;
}): HumanEnrollmentFields {
  let scheduleLabel = input.scheduleSummary?.trim() || null;
  let slotPreference = humanizeSlotPreference(input.requestedSlotPreference);
  let notes: string | null = input.notes?.trim() || null;

  if (input.notes) {
    try {
      const parsed = JSON.parse(input.notes) as Record<string, unknown>;
      if (typeof parsed.scheduleLabel === "string" && parsed.scheduleLabel.trim()) {
        scheduleLabel = parsed.scheduleLabel.trim();
      } else if (typeof parsed.schedule === "string" && parsed.schedule.trim()) {
        scheduleLabel = humanizeToken(parsed.schedule.trim());
      } else if (typeof parsed.plan === "string" && parsed.plan.trim()) {
        scheduleLabel = humanizeToken(parsed.plan.trim());
      }

      const payment =
        (typeof parsed.payment === "string" && parsed.payment.trim()) ||
        (typeof parsed.paymentPlan === "string" && parsed.paymentPlan.trim()) ||
        null;
      const scheduleFromBlob =
        (typeof parsed.scheduleLabel === "string" && parsed.scheduleLabel.trim()) ||
        (typeof parsed.schedule === "string" && parsed.schedule.trim()) ||
        null;

      if (!slotPreference) {
        const slotRaw =
          (typeof parsed.slotPreference === "string" && parsed.slotPreference) ||
          (typeof parsed.slot === "string" && parsed.slot) ||
          (typeof parsed.requestedSlotPreference === "string" && parsed.requestedSlotPreference) ||
          null;
        slotPreference = humanizeSlotPreference(slotRaw);
      }

      if (typeof parsed.notes === "string") {
        notes = parsed.notes.trim() || null;
      } else {
        const parts: string[] = [];
        if (scheduleFromBlob) parts.push(`Schedule: ${humanizeToken(scheduleFromBlob)}`);
        if (payment) parts.push(`Payment: ${humanizeToken(payment)}`);
        notes = parts.length > 0 ? parts.join(" · ") : null;
      }
    } catch {
      // keep raw notes
    }
  }

  if (!scheduleLabel && slotPreference) {
    scheduleLabel = slotPreference;
  }

  return {
    scheduleLabel,
    slotPreference,
    notes,
  };
}
