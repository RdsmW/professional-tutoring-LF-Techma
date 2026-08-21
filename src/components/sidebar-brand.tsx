import Image from "next/image";

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
      <button
        type="button"
        className="brand-lockup brand-lockup-toggle"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        title={collapsed ? "Expand navigation" : "Collapse navigation"}
        aria-expanded={!collapsed}
      >
        <Image
          src="/brand/professional-tutoring-logo.png"
          alt="Professional Tutoring, LLC"
          width={114}
          height={153}
          className="brand-logo"
          style={{ width: "auto", height: 40 }}
          priority
        />
        <span className="brand-copy">
          <strong className="brand-wordmark">
            rofessional
            <br />
            Tutoring, LLC
          </strong>
          {portalLabel ? <small>{portalLabel}</small> : null}
        </span>
      </button>
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
