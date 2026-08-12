"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { AppIcon } from "@/components/app-icon";
import { BootstrapSession } from "@/components/bootstrap-session";
import { APP_NAME, STAFF_NAV } from "@/lib/constants";
import { staffUserButtonAppearance } from "@/lib/ui/clerk-appearance";
import { isPlaceholderDisplayName, useNavCollapsed } from "@/lib/ui/nav-collapse";

export function StaffShell({
  children,
  personName,
}: {
  children: React.ReactNode;
  personName: string;
}) {
  const pathname = usePathname();
  const [label, setLabel] = useState(personName);
  const [openSupportCount, setOpenSupportCount] = useState(0);
  const { collapsed, toggleCollapsed } = useNavCollapsed("pt-staff-nav-collapsed");
  const fullName = isPlaceholderDisplayName(label) ? null : label;

  useEffect(() => {
    let cancelled = false;
    async function loadCount() {
      try {
        const response = await fetch("/api/staff/support/count");
        const data = await response.json();
        if (!cancelled && response.ok && data.ok) {
          setOpenSupportCount(Number(data.openCount ?? 0));
        }
      } catch {
        // keep badge at 0 on soft-fail
      }
    }
    void loadCount();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div className={`app-shell${collapsed ? " is-nav-collapsed" : ""}`}>
      <BootstrapSession
        onComplete={(result) => {
          if (result.displayName) setLabel(result.displayName);
        }}
      />
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">PT</span>
          <span className="brand-copy">
            <strong>{APP_NAME}</strong>
          </span>
          <button
            type="button"
            className="nav-collapse-toggle"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            title={collapsed ? "Expand navigation" : "Collapse navigation"}
            aria-expanded={!collapsed}
            onClick={toggleCollapsed}
          >
            <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
          </button>
        </div>
        <nav aria-label="Staff navigation">
          {STAFF_NAV.map((item) => {
            const active =
              item.href === "/staff"
                ? pathname === "/staff"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const showBadge = item.href === "/staff/support" && openSupportCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "active" : undefined}
                title={item.label}
                aria-label={item.label}
              >
                <span className="nav-icon">
                  <AppIcon name={item.icon} />
                </span>
                <span className="nav-text">{item.label}</span>
                {showBadge ? (
                  <b aria-label={`${openSupportCount} open support case${openSupportCount === 1 ? "" : "s"}`}>
                    {openSupportCount}
                  </b>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-chrome-actions">
            <button type="button" aria-label="Search" title="Search">
              <AppIcon name="search" size={15} />
              <span className="chrome-label">Search</span>
            </button>
            <button type="button" aria-label="Notifications" title="Notifications">
              <AppIcon name="bell" size={15} />
              <span className="chrome-label">Alerts</span>
            </button>
          </div>
          <div className="demo-person">
            <UserButton appearance={staffUserButtonAppearance()} />
            <span className="person-copy">
              <strong title={fullName ?? undefined}>{fullName ?? "Signed in"}</strong>
              <small>Staff</small>
            </span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
