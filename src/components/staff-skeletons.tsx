import type { CSSProperties } from "react";

/** Navy Soft pulse block — shared primitive for all staff loading skeletons. */
export function SkeletonBar({ style }: { style?: CSSProperties }) {
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

function SkeletonLiveRegion({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-skeleton" aria-busy="true" aria-live="polite">
      <span style={visuallyHidden}>Loading…</span>
      {children}
    </div>
  );
}

/** Mirrors PageIntro: title + description on the left, primary action on the right. */
export function PageIntroSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <section className="view-intro page-header-band" aria-hidden>
      <div className="page-header-copy">
        <SkeletonBar style={{ width: 220, height: 26 }} />
        <SkeletonBar style={{ width: 340, height: 12, marginTop: 12 }} />
      </div>
      {withAction ? (
        <div className="page-header-action">
          <SkeletonBar style={{ width: 130, height: 42 }} />
        </div>
      ) : null}
    </section>
  );
}

/** Directory pages (students, families, tutors, …): intro + filter chrome + table. */
export function StaffDirectorySkeleton({
  filterCount = 4,
  rows = 6,
}: {
  filterCount?: number;
  rows?: number;
}) {
  return (
    <SkeletonLiveRegion>
      <PageIntroSkeleton />
      <section className="panel" aria-hidden>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${filterCount}, minmax(0, 1fr))`, gap: 12 }}>
          {Array.from({ length: filterCount }, (_, i) => (
            <SkeletonBar key={i} style={{ height: 38 }} />
          ))}
        </div>
      </section>
      <section className="panel" aria-hidden>
        <SkeletonBar style={{ height: 38 }} />
        {Array.from({ length: rows }, (_, i) => (
          <SkeletonBar key={i} style={{ height: 48, marginTop: 8 }} />
        ))}
      </section>
    </SkeletonLiveRegion>
  );
}

/** Stacked-panels pages (reports, settings, integrations): intro + content panels. */
export function StaffPanelsSkeleton() {
  return (
    <SkeletonLiveRegion>
      <PageIntroSkeleton />
      {[0, 1].map((panel) => (
        <section key={panel} className="panel" aria-hidden style={panel > 0 ? { marginTop: 16 } : undefined}>
          <SkeletonBar style={{ width: 180 }} />
          <SkeletonBar style={{ height: 38, marginTop: 16 }} />
          {[1, 2, 3].map((i) => (
            <SkeletonBar key={i} style={{ height: 48, marginTop: 8 }} />
          ))}
        </section>
      ))}
    </SkeletonLiveRegion>
  );
}
