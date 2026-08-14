"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { AppIcon } from "@/components/app-icon";
import { BootstrapSession } from "@/components/bootstrap-session";
import { STAFF_NAV } from "@/lib/constants";
import { SidebarBrand } from "@/components/sidebar-brand";
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
  const { collapsed, toggleCollapsed } = useNavCollapsed("pt-staff-nav-collapsed");
  const fullName = isPlaceholderDisplayName(label) ? null : label;

  return (
    <div className={`app-shell${collapsed ? " is-nav-collapsed" : ""}`}>
      <BootstrapSession
        onComplete={(result) => {
          if (result.displayName) setLabel(result.displayName);
        }}
      />
      <aside className="sidebar">
        <SidebarBrand collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        <nav aria-label="Staff navigation">
          {STAFF_NAV.map((item) => {
            const active =
              item.href === "/staff"
                ? pathname === "/staff"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-chrome-actions">
            <button type="button" aria-label="Search" title="Search">
              <AppIcon name="search" size={16} />
              <span className="chrome-label">Search</span>
            </button>
            <button type="button" aria-label="Notifications" title="Notifications">
              <AppIcon name="bell" size={16} />
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
