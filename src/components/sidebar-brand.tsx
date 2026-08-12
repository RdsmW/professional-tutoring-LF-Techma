import Image from "next/image";

const WORDMARK = "rofessional Tutoring, LLC";

export function SidebarBrand({
  collapsed,
  onToggleCollapsed,
  portalLabel,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  portalLabel?: string;
}) {
  return (
    <div className="brand">
      <div className="brand-lockup" title="Professional Tutoring, LLC">
        <Image
          src="/brand/professional-tutoring-logo.png"
          alt="Professional Tutoring, LLC"
          width={48}
          height={48}
          className="brand-logo"
          priority
        />
        <span className="brand-copy">
          <strong className="brand-wordmark">{WORDMARK}</strong>
          {portalLabel ? <small>{portalLabel}</small> : null}
        </span>
      </div>
      <button
        type="button"
        className="nav-collapse-toggle"
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        title={collapsed ? "Expand navigation" : "Collapse navigation"}
        aria-expanded={!collapsed}
        onClick={onToggleCollapsed}
      >
        <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
      </button>
    </div>
  );
}
