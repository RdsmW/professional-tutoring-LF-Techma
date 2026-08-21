import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "../../lib/utils"

/**
 * Navigation Sidebar — the Midnight Navy brand wall.
 *
 * Full-height navy column with a Georgia wordmark, uppercase section labels in
 * Chrome Label, and nav items whose icons carry Signal Gold (Bright Gold when
 * active). The active item sits in a Navy Lift well — NO gold inset bar, per
 * the approved dashboard.
 *
 * Two widths per the source: 248px expanded, 72px collapsed. In collapsed
 * mode text is hidden but every item keeps an accessible name.
 *
 * Composition-first: SidebarNav is the shell; SidebarNavSection and
 * SidebarNavItem build the content. Footer slot for the user chip.
 */

const SidebarCollapsedContext = React.createContext(false)

export interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  /** Wordmark / brand area at the top. */
  brand?: React.ReactNode
  /** Pinned to the bottom (e.g. signed-in user chip). */
  footer?: React.ReactNode
  /** Collapsed 72px icon-rail mode. Items keep accessible names. */
  collapsed?: boolean
}

const SidebarNav = React.forwardRef<HTMLElement, SidebarNavProps>(
  ({ brand, footer, collapsed = false, className, children, ...props }, ref) => (
    <SidebarCollapsedContext.Provider value={collapsed}>
      <nav
        ref={ref}
        data-collapsed={collapsed || undefined}
        className={cn(
          "flex h-full shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width]",
          collapsed ? "w-[72px]" : "w-[248px]",
          className,
        )}
        {...props}
      >
        {brand && (
          <div
            className={cn(
              "border-b border-sidebar-border py-4 font-serif text-xs font-bold uppercase tracking-[0.18em] text-sidebar-primary-foreground",
              collapsed ? "overflow-hidden whitespace-nowrap px-3 text-center" : "px-5",
            )}
          >
            {collapsed && typeof brand === "string"
              ? brand
                  .split(/\s+/)
                  .map((word) => word[0])
                  .join("")
              : brand}
          </div>
        )}
        <div className={cn("flex-1 overflow-y-auto py-4", collapsed ? "px-2" : "px-3")}>
          {children}
        </div>
        {footer && (
          <div className={cn("border-t border-sidebar-border py-3", collapsed ? "px-2" : "px-3")}>
            {footer}
          </div>
        )}
      </nav>
    </SidebarCollapsedContext.Provider>
  ),
)
SidebarNav.displayName = "SidebarNav"

function SidebarNavSection({
  label,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { label?: string }) {
  const collapsed = React.useContext(SidebarCollapsedContext)
  return (
    <div className={cn("mb-4", className)} {...props}>
      {label &&
        (collapsed ? (
          <div className="mx-2 mb-2 border-t border-sidebar-border" role="presentation" />
        ) : (
          <div className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.15em] text-sidebar-foreground/70">
            {label}
          </div>
        ))}
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

export interface SidebarNavItemProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: LucideIcon
  active?: boolean
  /** Trailing slot, e.g. a count pill. Hidden in collapsed mode. */
  trailing?: React.ReactNode
}

const SidebarNavItem = React.forwardRef<HTMLAnchorElement, SidebarNavItemProps>(
  ({ icon: Icon, active = false, trailing, className, children, ...props }, ref) => {
    const collapsed = React.useContext(SidebarCollapsedContext)
    const accessibleName =
      collapsed && typeof children === "string" ? children : undefined
    return (
      <a
        ref={ref}
        aria-current={active ? "page" : undefined}
        aria-label={accessibleName}
        title={accessibleName}
        className={cn(
          "flex items-center rounded-lg text-[15px] font-semibold transition-colors",
          collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          className,
        )}
        {...props}
      >
        {Icon && (
          <Icon
            size={18}
            className={active ? "text-[#d8a840]" : "text-[#c4922e]"}
            aria-hidden
          />
        )}
        {!collapsed && <span className="min-w-0 flex-1 truncate">{children}</span>}
        {!collapsed && trailing}
      </a>
    )
  },
)
SidebarNavItem.displayName = "SidebarNavItem"

export { SidebarNav, SidebarNavSection, SidebarNavItem }
