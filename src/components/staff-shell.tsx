"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { AppIcon } from "@/components/app-icon";
import { APP_NAME, STAFF_NAV } from "@/lib/constants";

export function StaffShell({
  children,
  personName,
}: {
  children: React.ReactNode;
  personName: string;
}) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">PT</span>
          <span>
            <strong>{APP_NAME}</strong>
            <small>Staff Operations</small>
          </span>
        </div>
        <nav aria-label="Staff navigation">
          <div className="nav-label">Workspace</div>
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
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="demo-person">
            <UserButton />
            <span>
              <strong>{personName}</strong>
              <small>Staff account</small>
            </span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <strong style={{ font: "700 14px Georgia, serif" }}>Staff Operations</strong>
            <small style={{ display: "block", color: "var(--muted)", fontSize: 10 }}>
              Live app · Stage 1 foundation
            </small>
          </div>
          <div className="top-actions">
            <button type="button" aria-label="Search">
              <AppIcon name="search" />
            </button>
            <button type="button" aria-label="Notifications">
              <AppIcon name="bell" />
            </button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
