"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { AppIcon } from "@/components/app-icon";
import { BootstrapSession } from "@/components/bootstrap-session";
import { FamilyPortalProvider } from "@/components/family-portal-context";
import { SidebarBrand } from "@/components/sidebar-brand";
import { FAMILY_NAV } from "@/lib/constants";
import { familyUserButtonAppearance } from "@/lib/ui/clerk-appearance";
import { isPlaceholderDisplayName, useNavCollapsed } from "@/lib/ui/nav-collapse";

export function FamilyShell({
  children,
  personName,
}: {
  children: React.ReactNode;
  personName: string;
}) {
  const pathname = usePathname();
  const [label, setLabel] = useState(personName);
  const [householdStatus, setHouseholdStatus] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState<string | null>(null);
  const { collapsed, toggleCollapsed } = useNavCollapsed("pt-family-nav-collapsed");
  const fullName = isPlaceholderDisplayName(label) ? null : label;

  return (
    <FamilyPortalProvider
      value={{
        displayName: label,
        householdName,
        householdStatus,
        setDisplayName: setLabel,
        setHouseholdName,
        setHouseholdStatus,
      }}
    >
      <div className={`app-shell family-mode${collapsed ? " is-nav-collapsed" : ""}`}>
        <BootstrapSession
          onComplete={(result) => {
            if (result.displayName) setLabel(result.displayName);
            else if (result.householdName) setLabel(result.householdName);
            if (result.householdStatus) setHouseholdStatus(result.householdStatus);
            if (result.householdName) setHouseholdName(result.householdName);
          }}
        />
        <aside className="sidebar">
          <SidebarBrand
            collapsed={collapsed}
            onToggleCollapsed={toggleCollapsed}
            portalLabel="Family"
          />
          <nav aria-label="Family navigation">
            {FAMILY_NAV.map((item) => {
              const active =
                item.href === "/family"
                  ? pathname === "/family"
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
            {householdStatus === "pending" ? (
              <Link
                href="/family/onboarding"
                className="nav-onboarding-cue"
                title="Complete onboarding"
                aria-label="Complete onboarding"
              >
                <span className="nav-text">Complete onboarding →</span>
              </Link>
            ) : null}
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
              <UserButton appearance={familyUserButtonAppearance()} />
              <span className="person-copy">
                <strong title={fullName ?? undefined}>{fullName ?? "Signed in"}</strong>
                <small>Account</small>
              </span>
            </div>
          </div>
        </aside>
        <div className="workspace">
          <main className="content">{children}</main>
        </div>
      </div>
    </FamilyPortalProvider>
  );
}
