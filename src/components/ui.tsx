export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="view-intro" style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 18 }}>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1 style={{ margin: "4px 0 8px", font: "700 28px/1.15 Georgia, serif" }}>{title}</h1>
        <p style={{ margin: 0, color: "var(--muted)", maxWidth: 720 }}>{description}</p>
      </div>
      {action}
    </section>
  );
}

export function ComingStageNote({ feature }: { feature: string }) {
  return (
    <div className="family-boundary" style={{ marginTop: 16 }}>
      <span>Stage 2</span>
      {feature} will match the clickable mockup end-to-end. This Stage 1 screen keeps the same layout and navigation.
    </div>
  );
}

export function MetricGrid({
  items,
}: {
  items: { label: string; value: string; detail: string }[];
}) {
  return (
    <section className="metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
      {items.map((item) => (
        <article key={item.label} className="panel" style={{ background: "var(--paper)", border: "1px solid var(--line)", padding: 17 }}>
          <small style={{ display: "block", fontSize: 8, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {item.label}
          </small>
          <strong style={{ display: "block", font: "700 24px Georgia, serif", margin: "8px 0" }}>{item.value}</strong>
          <span style={{ display: "block", fontSize: 9, color: "var(--muted)" }}>{item.detail}</span>
        </article>
      ))}
    </section>
  );
}

export function Panel({
  title,
  children,
  eyebrow,
}: {
  title: string;
  children: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <section className="panel" style={{ background: "var(--paper)", border: "1px solid var(--line)", padding: 18, marginBottom: 14 }}>
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2 style={{ margin: "4px 0 12px", font: "700 18px Georgia, serif" }}>{title}</h2>
      {children}
    </section>
  );
}
