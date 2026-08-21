import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  // PT design system: 14px radius, Arial weights per role, no drop shadows.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
" hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        // Primary CTA — the single filled brand action per viewport.
        default:
           "bg-primary text-primary-foreground font-extrabold tracking-[0.02em]",
        // Destructive — Alert Red; must be preceded by a native confirm().
        destructive:
          "bg-destructive text-destructive-foreground font-extrabold",
        // Ghost button (spec) — 1.5px primary border, ink text, transparent fill.
        outline:
          "border-[1.5px] border-primary text-foreground font-bold bg-transparent",
        // Soft tile action — Navy Soft fill.
        secondary:
          "bg-secondary text-secondary-foreground font-bold",
        // Text button — Harbor ink, extrabold 12px, inline tertiary action.
        ghost: "border border-transparent text-chart-4 font-extrabold text-xs",
        link: "text-chart-4 font-extrabold underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-9 px-5 py-2",
        sm: "min-h-8 rounded-lg px-3 text-xs",
        lg: "min-h-11 rounded-lg px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
