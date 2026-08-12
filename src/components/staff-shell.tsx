"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { AppIcon } from "@/components/app-icon";
import { BootstrapSession } from "@/components/bootstrap-session";
import { APP_NAME, STAFF_NAV } from "@/lib/constants";

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
    <div className="app-shell">
      <BootstrapSession
        onComplete={(result) => {
          if (result.displayName) setLabel(result.displayName);
        }}
      />
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">PT</span>
          <span>
            <strong>{APP_NAME}</strong>
          </span>
        </div>
        <nav aria-label="Staff navigation">
          <div className="nav-label">Workspace</div>
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
                style={{
                  minHeight: 38,
                  border: 0,
                  background: active ? "#2c4561" : "transparent",
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
          <div className="demo-person">
            <UserButton />
            <span>
              <strong>{label}</strong>
              <small>Staff</small>
            </span>
          </div>
          <div className="sidebar-chrome-actions">
            <button type="button" aria-label="Search" title="Search">
              <AppIcon name="search" />
            </button>
            <button type="button" aria-label="Notifications" title="Notifications">
              <AppIcon name="bell" />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
