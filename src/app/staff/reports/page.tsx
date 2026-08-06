import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

const REPORTS = [
  "Active families / students",
  "Tutor utilization",
  "Sessions / attendance",
  "Course capacity",
  "Waitlist",
  "Revenue / billing",
  "School rollup",
];

export default function StaffReportsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Staff Operations · Reports"
        title="Reports"
        description="Seven saved report definitions from the mockup. School suggestions are administered here later — still no Schools top-nav module."
      />
      <Panel title="Saved report definitions" eyebrow="Stage 1 shell">
        <div className="report-definition-list">
          <div className="report-definition-head">
            <span>Report</span>
            <span>Purpose</span>
            <span>Scope</span>
            <span></span>
          </div>
          {REPORTS.map((name) => (
            <button key={name} type="button">
              <strong>{name}</strong>
              <span>Matches mockup inventory</span>
              <span>All</span>
              <b>Open →</b>
            </button>
          ))}
        </div>
        <ComingStageNote feature="Filters, grouped results, simulate export, and controlled student merge" />
      </Panel>
    </>
  );
}
