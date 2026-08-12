"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { AppIcon } from "@/components/app-icon";
import { BootstrapSession } from "@/components/bootstrap-session";
import { FamilyPortalProvider } from "@/components/family-portal-context";
import { APP_NAME, FAMILY_NAV } from "@/lib/constants";

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
      <div className="app-shell family-mode">
        <BootstrapSession
          onComplete={(result) => {
            if (result.displayName) setLabel(result.displayName);
            else if (result.householdName) setLabel(result.householdName);
            if (result.householdStatus) setHouseholdStatus(result.householdStatus);
            if (result.householdName) setHouseholdName(result.householdName);
          }}
        />
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-mark">PT</span>
            <span>
              <strong>{APP_NAME}</strong>
              <small>Family</small>
            </span>
          </div>
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
                  style={{
                    minHeight: 38,
                    border: 0,
                    background: active ? "#355247" : "transparent",
                    color: active ? "#fff" : "#b8c4d1",
                    borderRadius: 4,
                    display: "grid",
                    gridTemplateColumns: "23px 1fr auto",
                    alignItems: "center",
                    textAlign: "left",
                    padding: "0 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                    boxShadow: active ? "inset 3px 0 0 var(--coral)" : undefined,
                  }}
                >
                  <span style={{ color: active ? "var(--coral)" : "#8ea3b9", display: "grid", placeItems: "center" }}>
                    <AppIcon name={item.icon} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
            {householdStatus === "pending" ? (
              <Link
                href="/family/onboarding"
                style={{
                  marginTop: 8,
                  padding: "8px 10px",
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#ffb4a9",
                  textDecoration: "none",
                }}
              >
                Complete onboarding →
              </Link>
            ) : null}
          </nav>
          <div className="sidebar-footer">
            <div className="sidebar-chrome-actions">
              <button type="button" aria-label="Search" title="Search">
                <AppIcon name="search" size={15} />
                <span>Search</span>
              </button>
              <button type="button" aria-label="Notifications" title="Notifications">
                <AppIcon name="bell" size={15} />
                <span>Alerts</span>
              </button>
            </div>
            <div className="demo-person">
              <UserButton />
              <span>
                <strong>{label}</strong>
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
