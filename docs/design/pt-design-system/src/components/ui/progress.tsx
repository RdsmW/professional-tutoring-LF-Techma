"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "../../lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      // PT: 8px pill track on Canvas fill (capacity bars).
      "relative h-2 w-full overflow-hidden rounded-full bg-background",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      // Mint fill per the capacity-row source; override with className/style for other tones.
      className="h-full w-full flex-1 rounded-full bg-[#5a9d88] transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
