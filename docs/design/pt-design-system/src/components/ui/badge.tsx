import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  // @replit
  // Whitespace-nowrap: Badges should never wrap.
  // PT Status Pill: 9999px radius, 5px 8px padding, Arial 12px extrabold.
  // Soft semantic fill + matching ink — one pill language everywhere.
  "whitespace-nowrap inline-flex items-center rounded-full border border-transparent px-2 py-[5px] text-xs font-extrabold leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " hover-elevate ",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground",
        destructive:
          "bg-destructive text-destructive-foreground",
        outline: "text-foreground border [border-color:var(--badge-outline)]",
        /** Success, confirmed, paid, active */
        mint: "bg-[#eaf7f2] text-[#2f6f5e]",
        /** Pending, preview, caution */
        gold: "bg-[#fff6e5] text-[#8e661f]",
        /** Informational, prospect */
        harbor: "bg-[#edf4fb] text-[#38658f]",
        /** Attention, change-requests, overdue */
        rose: "bg-[#fcedf1] text-[#91455a]",
        /** Neutral count chips */
        navy: "bg-[#e8e9f2] text-[#010345] dark:bg-[#1c2044] dark:text-[#dfe2f5]",
        /** Subjects / tags — tertiary category */
        violet: "bg-[#f2effb] text-[#7566a8] uppercase text-[11px] font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
