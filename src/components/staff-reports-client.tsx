"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

type SummaryResponse = {
  ok: boolean;
  error?: string;
  filters?: { status: string; lifecycle: string | null };
  reports?: {
    activeFamilies: {
      name: string;
      count: number;
      households: Array<{
        id: string;
        displayName: string;
        status: string;
        updatedAt: string;
      }>;
    };
    studentsByLifecycle: {
      name: string;
      total: number;
      counts: Array<{ lifecycle: string; count: number }>;
    };
    tutorCapacity: {
      name: string;
      activeTutorCount: number;
      tutors: Array<{
        id: string;
        displayName: string;
        active: boolean;
        maxSeatsPerSlot: number;
        bookingWorkloadCount: number;
      }>;
    };
    unpaidBilling: {
      name: string;
      count: number;
      amountCentsSum: number;
      statuses: string[];
    };
    courseFill: {
      name: string;
      courses: Array<{
        id: string;
        name: string;
        enrolledCount: number;
        capacity: number;
        active: boolean;
        termLabel: string | null;
      }>;
    };
  };
};

type Reports = NonNullable<SummaryResponse["reports"]>;
type ReportSection = keyof Reports;

const HOUSEHOLD_STATUS_OPTIONS = ["active", "pending", "inactive", "archived"];
const LIFECYCLE_OPTIONS = ["", "prospect", "active", "paused", "completed", "archived"];
const DEFERRED_REPORTS = ["Sessions / attendance", "Waitlist", "School rollup"];

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function csvEscape(value: string | number | boolean | null | undefined) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function toCsv(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>) {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function activeFamiliesCsv(households: Reports["activeFamilies"]["households"]) {
  return toCsv(
    ["displayName", "status", "updatedAt", "id"],
    households.map((row) => [row.displayName, row.status, row.updatedAt, row.id]),
  );
}

function studentsByLifecycleCsv(counts: Reports["studentsByLifecycle"]["counts"]) {
  return toCsv(
    ["lifecycle", "count"],
    counts.map((row) => [row.lifecycle, row.count]),
  );
}

function tutorCapacityCsv(tutors: Reports["tutorCapacity"]["tutors"]) {
  return toCsv(
    ["displayName", "active", "maxSeatsPerSlot", "bookingWorkloadCount", "id"],
    tutors.map((row) => [row.displayName, row.active, row.maxSeatsPerSlot, row.bookingWorkloadCount, row.id]),
  );
}

function unpaidBillingCsv(billing: Reports["unpaidBilling"]) {
  return toCsv(
    ["count", "amountCentsSum", "amountUsd", "statuses"],
    [[billing.count, billing.amountCentsSum, formatMoney(billing.amountCentsSum), billing.statuses.join("|")]],
  );
}

function courseFillCsv(courses: Reports["courseFill"]["courses"]) {
  return toCsv(
    ["name", "termLabel", "enrolledCount", "capacity", "fillPercent", "active", "id"],
    courses.map((course) => {
      const fill =
        course.capacity > 0 ? Math.round((course.enrolledCount / course.capacity) * 100) : "";
      return [
        course.name,
        course.termLabel,
        course.enrolledCount,
        course.capacity,
        fill,
        course.active,
        course.id,
      ];
    }),
  );
}

function sectionCsv(section: ReportSection, data: Reports) {
  switch (section) {
    case "activeFamilies":
      return activeFamiliesCsv(data.activeFamilies.households);
    case "studentsByLifecycle":
      return studentsByLifecycleCsv(data.studentsByLifecycle.counts);
    case "tutorCapacity":
      return tutorCapacityCsv(data.tutorCapacity.tutors);
    case "unpaidBilling":
      return unpaidBillingCsv(data.unpaidBilling);
    case "courseFill":
      return courseFillCsv(data.courseFill.courses);
  }
}

function sectionFilename(section: ReportSection) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `report-${section}-${stamp}.csv`;
}

function sectionHasRows(section: ReportSection, data: Reports) {
  switch (section) {
    case "activeFamilies":
      return data.activeFamilies.households.length > 0;
    case "studentsByLifecycle":
      return data.studentsByLifecycle.counts.length > 0;
    case "tutorCapacity":
      return data.tutorCapacity.tutors.length > 0;
    case "unpaidBilling":
      return true;
    case "courseFill":
      return data.courseFill.courses.length > 0;
  }
}

function allSectionsCsv(data: Reports) {
  const parts: string[] = [];
  (Object.keys(data) as ReportSection[]).forEach((section) => {
    parts.push(`# ${section}`);
    parts.push(sectionCsv(section, data));
    parts.push("");
  });
  return parts.join("\n");
}

export function StaffReportsClient() {
  const [data, setData] = useState<SummaryResponse["reports"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("active");
  const [lifecycle, setLifecycle] = useState("");
  const [applied, setApplied] = useState({ status: "active", lifecycle: "" });
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (applied.status) params.set("status", applied.status);
      if (applied.lifecycle) params.set("lifecycle", applied.lifecycle);
      const query = params.toString();
      const response = await fetch(`/api/staff/reports/summary${query ? `?${query}` : ""}`);
      const payload = (await response.json()) as SummaryResponse;
      if (!response.ok || !payload.ok || !payload.reports) {
        setError(payload.error || "Unable to load report summary.");
        setData(null);
        return;
      }
      setData(payload.reports);
    } catch {
      setError("Unable to load report summary.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    setApplied({ status, lifecycle });
  }

  function clearFilters() {
    setStatus("active");
    setLifecycle("");
    setApplied({ status: "active", lifecycle: "" });
  }

  function flashDownloaded(key: string) {
    setDownloaded(key);
    window.setTimeout(() => setDownloaded(null), 1800);
  }

  function onCopyCsv() {
    if (!data?.activeFamilies.households.length) return;
    void navigator.clipboard.writeText(activeFamiliesCsv(data.activeFamilies.households));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function onDownloadSection(section: ReportSection) {
    if (!data || !sectionHasRows(section, data)) return;
    downloadCsv(sectionFilename(section), sectionCsv(section, data));
    flashDownloaded(section);
  }

  function onDownloadAll() {
    if (!data) return;
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`report-summary-${stamp}.csv`, allSectionsCsv(data));
    flashDownloaded("all");
  }

  const unpaidAmount = data ? formatMoney(data.unpaidBilling.amountCentsSum) : "$0.00";

  return (
    <>
      <PageIntro
        eyebrow="Staff Operations · Reports"
        title="Reports"
        description="Live summary panels from the database. School suggestions and student merge stay deferred."
      />

      {error ? <p className="form-error">{error}</p> : null}

      <section className="report-metrics">
        <article>
          <small>{data?.activeFamilies.name ?? "Active families"}</small>
          <strong>{loading ? "…" : (data?.activeFamilies.count ?? 0)}</strong>
          <span>Households · status={applied.status}</span>
        </article>
        <article>
          <small>{data?.studentsByLifecycle.name ?? "Students by lifecycle"}</small>
          <strong>{loading ? "…" : (data?.studentsByLifecycle.total ?? 0)}</strong>
          <span>{applied.lifecycle ? `Lifecycle=${applied.lifecycle}` : "All lifecycles"}</span>
        </article>
        <article>
          <small>{data?.tutorCapacity.name ?? "Tutor utilization"}</small>
          <strong>{loading ? "…" : (data?.tutorCapacity.activeTutorCount ?? 0)}</strong>
          <span>Active tutors</span>
        </article>
        <article>
          <small>{data?.unpaidBilling.name ?? "Revenue / billing"}</small>
          <strong>{loading ? "…" : unpaidAmount}</strong>
          <span>{data?.unpaidBilling.count ?? 0} unpaid/pending</span>
        </article>
      </section>

      <Panel title="Report filters" eyebrow="Live queries">
        <form className="student-filter-panel" onSubmit={applyFilters} style={{ gridTemplateColumns: "1fr 1fr auto auto auto" }}>
          <label>
            Household status
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {HOUSEHOLD_STATUS_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Student lifecycle
            <select value={lifecycle} onChange={(event) => setLifecycle(event.target.value)}>
              {LIFECYCLE_OPTIONS.map((value) => (
                <option key={value || "all"} value={value}>
                  {value || "All"}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="primary-button" style={{ height: 36, alignSelf: "end" }}>
            Apply
          </button>
          <button type="button" className="secondary-button" style={{ height: 36, alignSelf: "end" }} onClick={clearFilters}>
            Reset
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ height: 36, alignSelf: "end" }}
            onClick={onDownloadAll}
            disabled={!data || loading}
          >
            {downloaded === "all" ? "Downloaded" : "Download all CSV"}
          </button>
        </form>
        {loading ? <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading report summary…</p> : null}
      </Panel>

      {data ? (
        <>
          <Panel title={data.activeFamilies.name} eyebrow="active-families">
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 13 }}>{data.activeFamilies.count} households</strong>
              <button type="button" className="secondary-button" onClick={onCopyCsv} disabled={!data.activeFamilies.households.length}>
                {copied ? "Copied CSV" : "Copy CSV"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onDownloadSection("activeFamilies")}
                disabled={!data.activeFamilies.households.length}
              >
                {downloaded === "activeFamilies" ? "Downloaded" : "Download CSV"}
              </button>
            </div>
            {data.activeFamilies.households.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No households with this status.</p>
            ) : (
              <div className="report-definition-list">
                <div className="report-definition-head">
                  <span>Household</span>
                  <span>Status</span>
                  <span>Updated</span>
                  <span />
                </div>
                {data.activeFamilies.households.map((row) => (
                  <Link
                    key={row.id}
                    href={`/staff/families/${row.id}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.3fr 1.6fr .5fr .7fr",
                      gap: 12,
                      alignItems: "center",
                      borderTop: "1px solid var(--line)",
                      padding: "13px 15px",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <strong>{row.displayName}</strong>
                    <span>{row.status}</span>
                    <span>{new Date(row.updatedAt).toLocaleDateString()}</span>
                    <b>Open →</b>
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel title={data.studentsByLifecycle.name} eyebrow="students-by-lifecycle">
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 13 }}>{data.studentsByLifecycle.total} students</strong>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onDownloadSection("studentsByLifecycle")}
                disabled={!data.studentsByLifecycle.counts.length}
              >
                {downloaded === "studentsByLifecycle" ? "Downloaded" : "Download CSV"}
              </button>
            </div>
            {data.studentsByLifecycle.counts.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No students match this lifecycle filter.</p>
            ) : (
              <div className="family-summary-grid" style={{ marginBottom: 0 }}>
                {data.studentsByLifecycle.counts.map((row) => (
                  <article key={row.lifecycle} className="panel" style={{ padding: 14 }}>
                    <small>{row.lifecycle}</small>
                    <strong>{row.count}</strong>
                    <span>Students</span>
                  </article>
                ))}
              </div>
            )}
          </Panel>

          <Panel title={data.tutorCapacity.name} eyebrow="tutor-capacity">
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 13 }}>{data.tutorCapacity.activeTutorCount} active tutors</strong>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onDownloadSection("tutorCapacity")}
                disabled={!data.tutorCapacity.tutors.length}
              >
                {downloaded === "tutorCapacity" ? "Downloaded" : "Download CSV"}
              </button>
            </div>
            {data.tutorCapacity.tutors.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No active tutors.</p>
            ) : (
              <div className="report-definition-list">
                <div className="report-definition-head">
                  <span>Tutor</span>
                  <span>Max seats / slot</span>
                  <span>Open bookings</span>
                  <span />
                </div>
                {data.tutorCapacity.tutors.map((tutor) => (
                  <Link
                    key={tutor.id}
                    href={`/staff/tutors/${tutor.id}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.3fr 1.6fr .5fr .7fr",
                      gap: 12,
                      alignItems: "center",
                      borderTop: "1px solid var(--line)",
                      padding: "13px 15px",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <strong>{tutor.displayName}</strong>
                    <span>{tutor.maxSeatsPerSlot}</span>
                    <span>{tutor.bookingWorkloadCount}</span>
                    <b>Open →</b>
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel title={data.unpaidBilling.name} eyebrow="unpaid-billing">
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 13 }}>{data.unpaidBilling.count} unpaid/pending</strong>
              <button type="button" className="secondary-button" onClick={() => onDownloadSection("unpaidBilling")}>
                {downloaded === "unpaidBilling" ? "Downloaded" : "Download CSV"}
              </button>
            </div>
            <div className="family-summary-grid three" style={{ marginBottom: 0 }}>
              <article className="panel" style={{ padding: 14 }}>
                <small>Unpaid / pending count</small>
                <strong>{data.unpaidBilling.count}</strong>
                <span>{data.unpaidBilling.statuses.join(" · ")}</span>
              </article>
              <article className="panel" style={{ padding: 14 }}>
                <small>Amount sum</small>
                <strong>{unpaidAmount}</strong>
                <span>payment_records.amount_cents</span>
              </article>
              <article className="panel" style={{ padding: 14 }}>
                <small>Course fill rows</small>
                <strong>{data.courseFill.courses.length}</strong>
                <span>Active offerings</span>
              </article>
            </div>
          </Panel>

          <Panel title={data.courseFill.name} eyebrow="course-fill">
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 13 }}>{data.courseFill.courses.length} courses</strong>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onDownloadSection("courseFill")}
                disabled={!data.courseFill.courses.length}
              >
                {downloaded === "courseFill" ? "Downloaded" : "Download CSV"}
              </button>
            </div>
            {data.courseFill.courses.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No active course offerings.</p>
            ) : (
              <div className="report-definition-list">
                <div className="report-definition-head">
                  <span>Course</span>
                  <span>Enrolled</span>
                  <span>Capacity</span>
                  <span>Fill</span>
                </div>
                {data.courseFill.courses.map((course) => {
                  const fill =
                    course.capacity > 0
                      ? `${Math.round((course.enrolledCount / course.capacity) * 100)}%`
                      : "—";
                  return (
                    <div
                      key={course.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.3fr 1.6fr .5fr .7fr",
                        gap: 12,
                        alignItems: "center",
                        borderTop: "1px solid var(--line)",
                        padding: "13px 15px",
                      }}
                    >
                      <strong>
                        {course.name}
                        {course.termLabel ? (
                          <small style={{ display: "block", color: "var(--muted)", fontWeight: 400 }}>
                            {course.termLabel}
                          </small>
                        ) : null}
                      </strong>
                      <span>{course.enrolledCount}</span>
                      <span>{course.capacity}</span>
                      <b>{fill}</b>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </>
      ) : null}

      <Panel title="Saved report definitions" eyebrow="Mockup inventory">
        <div className="report-definition-list">
          <div className="report-definition-head">
            <span>Report</span>
            <span>Purpose</span>
            <span>Scope</span>
            <span />
          </div>
          {(
            [
              ["Active families / students", "Live households by status", "Live"],
              ["Tutor utilization", "Active tutors + seat/workload", "Live"],
              ["Course capacity", "Offering enrolled vs capacity", "Live"],
              ["Revenue / billing", "Unpaid/pending payment totals", "Live"],
              ...DEFERRED_REPORTS.map((name) => [name, "Not in this slice", "Later"] as const),
            ] as const
          ).map(([name, purpose, scope]) => (
            <button key={name} type="button" disabled={scope !== "Live"}>
              <strong>{name}</strong>
              <span>{purpose}</span>
              <span>{scope}</span>
              <b>{scope === "Live" ? "Above ↑" : "Soon →"}</b>
            </button>
          ))}
        </div>
        <ComingStageNote feature="Sessions/attendance, waitlist, school suggestion admin, and controlled student merge" />
      </Panel>
    </>
  );
}
