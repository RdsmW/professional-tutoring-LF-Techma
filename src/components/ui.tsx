export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="view-intro page-header-band">
      <div className="page-header-copy">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
    </section>
  );
}

export function ComingStageNote({ feature }: { feature: string }) {
  return (
    <div className="family-boundary" style={{ marginTop: 16 }}>
      <span>Later</span>
      {feature}
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
          <small style={{ display: "block", fontSize: 14, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {item.label}
          </small>
          <strong style={{ display: "block", font: "700 24px Georgia, serif", margin: "8px 0" }}>{item.value}</strong>
          <span style={{ display: "block", fontSize: 14, color: "var(--muted)" }}>{item.detail}</span>
        </article>
      ))}
    </section>
  );
}

export function Panel({
  title,
  children,
  eyebrow,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <section
      className={className ? `panel ${className}` : "panel"}
      style={{ background: "var(--paper)", border: "1px solid var(--line)", padding: 18, marginBottom: 14 }}
    >
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      {title ? <h2 style={{ margin: "4px 0 12px", font: "700 18px Georgia, serif" }}>{title}</h2> : null}
      {children}
    </section>
  );
}
