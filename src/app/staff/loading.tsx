import type { CSSProperties } from "react";

/** Navy Soft pulse block — mirrors the real layout per the approved loading state. */
function S({ style }: { style?: CSSProperties }) {
  return <div className="staff-skeleton" style={{ height: 14, ...style }} />;
}

const visuallyHidden: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

export default function StaffLoading() {
  return (
    <div className="dashboard-skeleton" aria-busy="true" aria-live="polite">
      <span style={visuallyHidden}>Loading…</span>
      <section className="hero-panel" aria-hidden>
        <div>
          <S style={{ width: 160, height: 10 }} />
          <S style={{ width: 260, height: 24, marginTop: 12 }} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <S style={{ width: 108, height: 42 }} />
          <S style={{ width: 104, height: 42 }} />
        </div>
      </section>
      <div className="kpi-grid" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-card-head">
              <S style={{ width: "70%" }} />
            </div>
            <div className="kpi-card-panel">
              <S style={{ width: 35, height: 28 }} />
              <S style={{ width: "90%", marginTop: 12 }} />
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-main-row" aria-hidden>
        <section className="panel">
          <S style={{ width: 180 }} />
          {[1, 2, 3].map((i) => (
            <S key={i} style={{ height: 48, marginTop: 13 }} />
          ))}
        </section>
        <section className="panel">
          <S style={{ width: 130 }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <S key={i} style={{ height: 25, marginTop: 10 }} />
          ))}
        </section>
      </div>
      <section className="panel" aria-hidden>
        <S style={{ width: 150, height: 17 }} />
        <S style={{ height: 38, marginTop: 16 }} />
        {[1, 2, 3, 4].map((i) => (
          <S key={i} style={{ height: 48, marginTop: 8 }} />
        ))}
      </section>
    </div>
  );
}
