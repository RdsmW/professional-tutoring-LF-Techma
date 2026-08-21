import * as React from "react"

import { cn } from "../../lib/utils"

/**
 * Page Header Band — Paper band that opens every page.
 *
 * Eyebrow (Bright Gold, uppercase Arial 12px) over a Georgia title, optional
 * supporting copy, and an actions slot (usually the page's single primary CTA)
 * aligned right.
 */

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Small gold kicker above the title, e.g. "Staff · Overview". */
  eyebrow?: string
  /** Georgia page title. */
  title: string
  /** Optional supporting copy under the title (Arial, Slate). */
  description?: string
  /** Right-aligned actions, typically one primary Button. */
  actions?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ eyebrow, title, description, actions, className, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card px-[18px] py-3.5 text-card-foreground",
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#d8a840]">
            {eyebrow}
          </div>
        )}
        <h1 className="mt-0.5 font-serif text-[22px] font-bold leading-tight tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-[720px] text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  ),
)
PageHeader.displayName = "PageHeader"

export { PageHeader }
