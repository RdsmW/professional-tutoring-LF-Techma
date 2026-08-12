"use client";

import { useCallback, useEffect, useState } from "react";
import { PageIntro, Panel } from "@/components/ui";
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

export function StaffSettingsClient() {
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
    } catch {
      setError("Unable to load policy versions.");
    } finally {
      setLoading(false);
    }
  }, [applyActive]);

  useEffect(() => {
    void reload();
  }, [reload]);

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

  const rules = active?.rules ?? DEFAULT_CANCELLATION_RULES;

  return (
    <>
      <PageIntro
        eyebrow="Staff administration · Policy"
        title="Cancellation, banked-session & refund policy"
        description="Configure the policy engine that recommends eligibility. A recommendation never creates a credit or moves money without authorized staff approval."
        action={<span className="pill blue">{active?.code ?? DEFAULT_CANCELLATION_POLICY_CODE}</span>}
      />

      {error ? <p className="form-error">{error}</p> : null}

      <section className="policy-version-strip">
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
          <strong>{active?.status === "active" ? "Active version" : active?.status ?? "—"}</strong>
        </div>
        <div>
          <small>Timezone</small>
          <strong>{APP_TIMEZONE}</strong>
        </div>
        <div>
          <small>Audit</small>
          <strong>Staff, timestamp, reason required</strong>
        </div>
      </section>

      <Panel title="Eligibility and recommendation inputs" eyebrow="Policy rules">
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
        <div className="privacy-callout" style={{ marginTop: 16 }}>
          <span>i</span>
          <div>
            <strong>Two-stage control</strong>
            <p>
              The policy engine returns a recommendation and explanation. Authorized staff separately approves banked
              credit, refund workflow, alternate exception, or denial. Processor initiation remains a controlled future
              integration.
            </p>
          </div>
        </div>
        <label className="full-input" style={{ display: "block", marginTop: 16 }}>
          Required audit note / reason
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why this version is replacing the active policy"
          />
        </label>
        <div className="wizard-footer" style={{ marginTop: 16 }}>
          <button type="button" className="family-primary" disabled={saving || loading || !reason.trim()} onClick={() => void saveVersion()}>
            {saving ? "Saving…" : "Save new version"}
          </button>
        </div>
        {saved ? (
          <div className="validation-line">
            <span>✓</span>
            {code} saved as a new version with effective date and audit history
          </div>
        ) : null}
      </Panel>

      <Panel title="Policy audit trail" eyebrow="Version history">
        {versions.length === 0 ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>
            {loading ? "Loading…" : "No versions in the database yet. Apply drizzle/0006_policy_versions.sql."}
          </p>
        ) : (
          versions.map((version) => (
            <button
              key={version.id}
              type="button"
              onClick={() =>
                applyActive({
                  id: version.id,
                  code: version.code,
                  effectiveFrom: version.effectiveFrom,
                  status: version.status,
                  rules: version.rules,
                  reason: version.reason,
                })
              }
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
              <b>{version.status === "active" ? "Current →" : "View →"}</b>
            </button>
          ))
        )}
      </Panel>
    </>
  );
}
