import * as React from "react"
import { ArrowDown, ArrowUp, MoreHorizontal } from "lucide-react"

import { cn } from "../../lib/utils"
import { Card } from "./card"

/**
 * KPI / Metric Card — the approved nested-panel style.
 *
 * Outer Card with a compact label header (label + overflow menu), and an
 * inset white panel holding the Georgia metric number plus a split trend
 * line: colored bold value ("2", "15%") followed by a muted suffix
 * ("more than last week"). No divider under the header; no colored edge bars.
 */

export type KpiTrendTone = "mint" | "amber" | "rose" | "harbor" | "violet"

const TREND_COLORS: Record<KpiTrendTone, string> = {
  mint: "#5a9d88",
  amber: "#d97706",
  rose: "#b85a72",
  harbor: "#4c78a8",
  violet: "#7566a8",
}

export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Metric label, top-left of the card (Arial 14px ink). */
  label: string
  /** The headline number (Georgia 700 28px). */
  number: string
  /** Colored bold portion of the trend line, e.g. "2" or "15%". */
  trendValue?: string
  /** Muted suffix of the trend line, e.g. "more than last week". */
  trendSuffix?: string
  /** Arrow direction. */
  trendDir?: "up" | "down"
  /** Semantic trend tone (preferred) — mint good, amber caution, rose bad. */
  trendTone?: KpiTrendTone
  /** Escape hatch: explicit trend color; overrides trendTone. */
  trendColor?: string
  /** Called when the ··· overflow button is pressed; hides the button when omitted. */
  onMenuClick?: React.MouseEventHandler<HTMLButtonElement>
}

const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
  (
    { label, number, trendValue, trendSuffix, trendDir = "up", trendTone = "mint", trendColor, onMenuClick, className, ...props },
    ref,
  ) => {
    const TrendIcon = trendDir === "up" ? ArrowUp : ArrowDown
    const color = trendColor ?? TREND_COLORS[trendTone]
    return (
      <Card ref={ref} className={cn("flex min-h-[132px] flex-col gap-0 p-[10px]", className)} {...props}>
        <div className="flex items-center justify-between px-2 pb-[10px] pt-[6px]">
          <div className="text-sm leading-tight text-card-foreground">{label}</div>
          {onMenuClick !== undefined && (
            <button
              type="button"
              aria-label={`${label} options`}
              onClick={onMenuClick}
              className="flex cursor-pointer border-0 bg-transparent pl-2 text-muted-foreground"
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>
        <div className="flex-1 rounded-xl border border-border bg-card p-3.5">
          <div className="font-serif text-[28px] font-bold leading-none tracking-tight text-card-foreground">
            {number}
          </div>
          {(trendValue || trendSuffix) && (
            <div className="mt-3 flex items-center gap-[5px]">
              <TrendIcon size={14} strokeWidth={2.5} style={{ color }} />
              {trendValue && (
                <span className="text-[13px] font-bold" style={{ color }}>
                  {trendValue}
                </span>
              )}
              {trendSuffix && <span className="text-[13px] text-muted-foreground">{trendSuffix}</span>}
            </div>
          )}
        </div>
      </Card>
    )
  },
)
KpiCard.displayName = "KpiCard"

export { KpiCard }
