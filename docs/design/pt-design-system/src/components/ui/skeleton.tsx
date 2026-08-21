import { cn } from "../../lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // PT: Navy Soft pulse blocks at the card radius; skeletons mirror real layout.
      // 1.2s ease pulse per the reference loading state.
      className={cn(
        "animate-pulse rounded-lg bg-secondary [animation-duration:1.2s] [animation-timing-function:ease-in-out]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
