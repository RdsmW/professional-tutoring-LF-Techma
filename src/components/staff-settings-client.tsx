"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import { IntegrationStatusPanel } from "@/components/staff-integrations-client";
import { APP_TIMEZONE } from "@/lib/constants";
import {
  DEFAULT_CANCELLATION_POLICY_CODE,
  DEFAULT_CANCELLATION_RULES,
  type CancellationPolicyRules,
} from "@/lib/policy/rules";

type PolicyVersion = {
  id: string;
  code: string;
  effectiveFrom: string;
  status: string;
  rules: CancellationPolicyRules;
  reason: string | null;
  createdAt: string;
};

type ActivePolicy = {
  id: string | null;
  code: string;
  effectiveFrom: string;
  status: string;
  rules: CancellationPolicyRules;
  reason: string | null;
};

type PriceLine = {
  id: string;
  program: string;
  rateTier: string | null;
  packageCode: string | null;
  amountCents: number;
  registrationFeeCents: number;
};

type PriceBook = {
  id: string | null;
  code: string;
  name: string;
  status: string;
  effectiveFrom: string;
  reason: string | null;
  lines: PriceLine[];
};

const TABS = [
  { id: "policy", label: "Policy" },
  { id: "prices", label: "Prices" },
  { id: "history", label: "History" },
  { id: "integrations", label: "Integrations" },
  { id: "recycle", label: "Recycle bin" },
] as const;

type SettingsTab = (typeof TABS)[number]["id"];

type RecycledStaffNote = {
  id: string;
  kind: "guardian_note" | "household_note";
  body: string;
  authorDisplayName: string;
  createdAt: string;
  entityId: string;
  entityLabel: string;
  entityHref: string;
  deletedAt: string;
  purgeAt: string;
};

function isSettingsTab(value: string | null): value is SettingsTab {
  return TABS.some((tab) => tab.id === value);
}

export function StaffSettingsClient({ stripeConfigured }: { stripeConfigured: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: SettingsTab = isSettingsTab(tabParam) ? tabParam : "policy";

  const [active, setActive] = useState<ActivePolicy | null>(null);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [code, setCode] = useState(DEFAULT_CANCELLATION_POLICY_CODE);
  const [noticeHours, setNoticeHours] = useState("24");
  const [defaultOutcome, setDefaultOutcome] = useState<CancellationPolicyRules["defaultEligibleOutcome"]>(
    "banked_credit",
  );
  const [expiry, setExpiry] = useState("90");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [priceBook, setPriceBook] = useState<PriceBook | null>(null);
  const [priceCode, setPriceCode] = useState("PT-PRICE-2026.2");
  const [priceReason, setPriceReason] = useState("");
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceSaved, setPriceSaved] = useState(false);
  const [priceNote, setPriceNote] = useState<string | null>(null);
  const [recycleNotes, setRecycleNotes] = useState<RecycledStaffNote[]>([]);
  const [recycleLoading, setRecycleLoading] = useState(false);
  const [recycleError, setRecycleError] = useState<string | null>(null);
  const [recycleBusyId, setRecycleBusyId] = useState<string | null>(null);
  const [retentionDays, setRetentionDays] = useState(30);

  const applyActive = useCallback((next: ActivePolicy) => {
    setActive(next);
    setCode(next.code);
    setNoticeHours(String(next.rules.noticeHours ?? 24));
    setDefaultOutcome(next.rules.defaultEligibleOutcome ?? "banked_credit");
    setExpiry(next.rules.bankedExpiryMode === "end_of_term" ? "end_of_term" : String(next.rules.bankedExpiryDays ?? 90));
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/staff/settings/policy");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load policy versions.");
        applyActive({
          id: null,
          code: DEFAULT_CANCELLATION_POLICY_CODE,
          effectiveFrom: new Date().toISOString(),
          status: "active",
          rules: DEFAULT_CANCELLATION_RULES,
          reason: null,
        });
        return;
      }
      applyActive(data.active);
      setVersions(data.versions ?? []);
      const prices = await fetch("/api/staff/settings/prices");
      const priceData = await prices.json();
      if (prices.ok && priceData.ok) {
        setPriceBook(priceData.book);
        setPriceNote(priceData.locked?.note ?? null);
        if (priceData.book?.code) setPriceCode(`${priceData.book.code}-next`);
      }
    } catch {
      setError("Unable to load policy versions.");
    } finally {
      setLoading(false);
    }
  }, [applyActive]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const reloadRecycleBin = useCallback(async () => {
    setRecycleLoading(true);
    setRecycleError(null);
    try {
      const response = await fetch("/api/staff/settings/recycle-bin");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setRecycleError(data.error || "Unable to load recycle bin.");
        setRecycleNotes([]);
        return;
      }
      setRetentionDays(typeof data.retentionDays === "number" ? data.retentionDays : 30);
      setRecycleNotes(data.notes ?? []);
    } catch {
      setRecycleError("Unable to load recycle bin.");
      setRecycleNotes([]);
    } finally {
      setRecycleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== "recycle") return;
    void reloadRecycleBin();
  }, [tab, reloadRecycleBin]);

  function setTab(next: SettingsTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "policy") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  async function restoreRecycledNote(note: RecycledStaffNote) {
    if (recycleBusyId) return;
    setRecycleBusyId(note.id);
    setRecycleError(null);
    try {
      const response = await fetch("/api/staff/settings/recycle-bin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: note.kind, noteId: note.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setRecycleError(data.error || "Unable to restore note.");
        return;
      }
      setRecycleNotes((prev) => prev.filter((row) => row.id !== note.id));
    } catch {
      setRecycleError("Unable to restore note.");
    } finally {
      setRecycleBusyId(null);
    }
  }

  async function saveVersion() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch("/api/staff/settings/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          noticeHours: Number(noticeHours),
          defaultEligibleOutcome: defaultOutcome,
          bankedExpiryMode: expiry === "end_of_term" ? "end_of_term" : "days",
          bankedExpiryDays: expiry === "end_of_term" ? null : Number(expiry),
          reason,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to save policy version.");
        return;
      }
      applyActive(data.active);
      setVersions(data.versions ?? []);
      setReason("");
      setSaved(true);
    } catch {
      setError("Unable to save policy version.");
    } finally {
      setSaving(false);
    }
  }

  async function savePriceBook() {
    if (!priceBook) return;
    setPriceSaving(true);
    setError(null);
    setPriceSaved(false);
    try {
      const response = await fetch("/api/staff/settings/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: priceCode,
          name: priceBook.name,
          reason: priceReason,
          lines: priceBook.lines,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to save price book.");
        return;
      }
      setPriceReason("");
      setPriceSaved(true);
      await reload();
    } catch {
      setError("Unable to save price book.");
    } finally {
      setPriceSaving(false);
    }
  }

  const rules = active?.rules ?? DEFAULT_CANCELLATION_RULES;
  let headerAction = <span className="pill blue">{versions.length} versions</span>;
  if (tab === "policy") {
    headerAction = <span className="pill blue">{active?.code ?? DEFAULT_CANCELLATION_POLICY_CODE}</span>;
  } else if (tab === "prices") {
    headerAction = <span className="pill blue">{priceBook?.code ?? "Catalog"}</span>;
  } else if (tab === "integrations") {
    headerAction = (
      <span className={`pill ${stripeConfigured ? "green" : "amber"}`}>
        {stripeConfigured ? "Stripe ready" : "Stripe pending"}
      </span>
    );
  }

  return (
    <>
      <PageIntro title="Settings" action={headerAction} />

      <nav className="settings-tabs" aria-label="Settings sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "active" : undefined}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {error ? <p className="form-error">{error}</p> : null}

      {tab === "policy" ? (
        <>
          <section className="policy-version-strip">
            <div>
              <small>Code</small>
              <strong>{active?.code ?? DEFAULT_CANCELLATION_POLICY_CODE}</strong>
            </div>
            <div>
              <small>Effective date</small>
              <strong>
                {active?.effectiveFrom
                  ? new Date(active.effectiveFrom).toLocaleDateString("en-US", { timeZone: APP_TIMEZONE })
                  : "—"}
              </strong>
            </div>
            <div>
              <small>Status</small>
              <strong>{active?.status === "active" ? "Active" : active?.status ?? "—"}</strong>
            </div>
          </section>

          <Panel title="Policy rules">
            <div className="input-grid">
              <label>
                Policy version
                <input value={code} onChange={(event) => setCode(event.target.value)} />
              </label>
              <label>
                Minimum notice
                <select value={noticeHours} onChange={(event) => setNoticeHours(event.target.value)}>
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                </select>
              </label>
              <label>
                Default eligible outcome
                <select
                  value={defaultOutcome}
                  onChange={(event) =>
                    setDefaultOutcome(event.target.value as CancellationPolicyRules["defaultEligibleOutcome"])
                  }
                >
                  <option value="banked_credit">Banked credit when eligible</option>
                  <option value="refund_review">Refund review when eligible</option>
                  <option value="reschedule_only">Reschedule only</option>
                </select>
              </label>
              <label>
                Banked-credit expiry
                <select value={expiry} onChange={(event) => setExpiry(event.target.value)}>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="end_of_term">End of service term</option>
                </select>
              </label>
            </div>

            <details className="settings-details">
              <summary>How recommendations work</summary>
              <div className="input-grid" style={{ marginBottom: 12 }}>
                <label>
                  Partial-credit rule
                  <input value={rules.partialCreditRule} readOnly />
                </label>
                <label>
                  No-show treatment
                  <input value={rules.noShowTreatment} readOnly />
                </label>
                <label>
                  Tutor cancellation
                  <input value={rules.tutorCancelTreatment} readOnly />
                </label>
                <label>
                  Eligible reasons
                  <input value={rules.eligibleReasons.join(" · ")} readOnly />
                </label>
              </div>
            </details>

            <label className="full-input" style={{ display: "block", marginTop: 16 }}>
              Required audit note / reason
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Why this version is replacing the active policy"
              />
            </label>
            <div className="settings-save-row">
              <button
                type="button"
                className="family-primary"
                disabled={saving || loading || !reason.trim()}
                onClick={() => void saveVersion()}
              >
                {saving ? "Saving…" : "Save new version"}
              </button>
              <p className="settings-save-note">
                Recommendations never create a credit or move money. Staff must still approve banked credit, refund
                review, exception, or denial.
              </p>
            </div>
            {saved ? (
              <div className="validation-line">
                <span>✓</span>
                {code} saved as a new version with effective date and history
              </div>
            ) : null}
          </Panel>
        </>
      ) : null}

      {tab === "prices" ? (
        <Panel title="Active price book">
          <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0 }}>
            New family bookings and enrollments snapshot these amounts. Existing ledger rows are not backfilled. Card
            surcharge, late fees, and intake stay locked at $0.
          </p>
          {priceNote ? <p style={{ fontSize: 14 }}>{priceNote}</p> : null}
          <div className="input-grid">
            <label>
              New version code
              <input value={priceCode} onChange={(event) => setPriceCode(event.target.value)} />
            </label>
            <label>
              Active book
              <input value={priceBook ? `${priceBook.code} · ${priceBook.status}` : "Catalog fallback"} readOnly />
            </label>
          </div>
          <div className="report-definition-list" style={{ marginTop: 14 }}>
            <div className="report-definition-head">
              <span>Program</span>
              <span>Package</span>
              <span>Amount</span>
              <span>Tier</span>
            </div>
            {(priceBook?.lines ?? []).map((line) => (
              <div
                key={line.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.3fr 1.6fr .5fr .7fr",
                  gap: 12,
                  alignItems: "center",
                  borderTop: "1px solid var(--line)",
                  padding: "13px 15px",
                }}
              >
                <strong>{line.program}</strong>
                <span>{line.packageCode || "—"}</span>
                <span>${(line.amountCents / 100).toFixed(2)}</span>
                <b>{line.rateTier || "—"}</b>
              </div>
            ))}
          </div>
          <label className="full-input" style={{ display: "block", marginTop: 16 }}>
            Required audit note / reason
            <textarea
              value={priceReason}
              onChange={(event) => setPriceReason(event.target.value)}
              placeholder="Why this price book version is replacing the active one"
            />
          </label>
          <div className="settings-save-row">
            <button
              type="button"
              className="family-primary"
              disabled={priceSaving || !priceReason.trim() || !priceBook}
              onClick={() => void savePriceBook()}
            >
              {priceSaving ? "Saving…" : "Save new price book version"}
            </button>
          </div>
          {priceSaved ? (
            <div className="validation-line">
              <span>✓</span>
              {priceCode} saved as a new price book. Old bookings keep their snapshots.
            </div>
          ) : null}
        </Panel>
      ) : null}

      {tab === "history" ? (
        <Panel title="Policy history">
          {versions.length === 0 ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>
              {loading ? "Loading…" : "No versions in the database yet. Apply drizzle/0006_policy_versions.sql."}
            </p>
          ) : (
            versions.map((version) => (
              <button
                key={version.id}
                type="button"
                onClick={() => {
                  applyActive({
                    id: version.id,
                    code: version.code,
                    effectiveFrom: version.effectiveFrom,
                    status: version.status,
                    rules: version.rules,
                    reason: version.reason,
                  });
                  setTab("policy");
                }}
                style={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "140px 1fr auto",
                  gap: 12,
                  alignItems: "center",
                  border: 0,
                  borderTop: "1px solid var(--line)",
                  background: "#fff",
                  padding: "12px 0",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span>{version.code}</span>
                <strong>
                  {version.rules.noticeHours}-hour window · {version.status} ·{" "}
                  {new Date(version.effectiveFrom).toLocaleDateString("en-US", { timeZone: APP_TIMEZONE })}
                </strong>
                <b>{version.status === "active" ? "Current →" : "Open in Policy →"}</b>
              </button>
            ))
          )}
        </Panel>
      ) : null}

      {tab === "integrations" ? (
        <Panel title="Connection status">
          <IntegrationStatusPanel stripeConfigured={stripeConfigured} />
        </Panel>
      ) : null}

      {tab === "recycle" ? (
        <Panel title="Recycle bin">
          <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0 }}>
            Soft-deleted notes stay here for {retentionDays} days, then are permanently removed. Restore returns a
            note to its family or guardian record.
          </p>
          {recycleError ? <p className="form-error">{recycleError}</p> : null}
          {recycleLoading ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>Loading…</p>
          ) : recycleNotes.length === 0 ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>No deleted notes in the retention window.</p>
          ) : (
            <div className="settings-recycle-list">
              {recycleNotes.map((note) => (
                <div key={`${note.kind}:${note.id}`} className="settings-recycle-row">
                  <div className="settings-recycle-copy">
                    <strong>
                      <a href={note.entityHref}>{note.entityLabel}</a>
                      <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                        {" "}
                        · {note.kind === "household_note" ? "Family note" : "Guardian note"}
                      </span>
                    </strong>
                    <span className="settings-recycle-body">{note.body}</span>
                    <small>
                      Deleted{" "}
                      {new Date(note.deletedAt).toLocaleString("en-US", { timeZone: APP_TIMEZONE })} · Purges{" "}
                      {new Date(note.purgeAt).toLocaleDateString("en-US", { timeZone: APP_TIMEZONE })}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={recycleBusyId === note.id}
                    onClick={() => void restoreRecycledNote(note)}
                  >
                    {recycleBusyId === note.id ? "Restoring…" : "Restore"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      ) : null}
    </>
  );
}
