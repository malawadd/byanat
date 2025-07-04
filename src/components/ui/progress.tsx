"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-black/50 border border-neon-green/30",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-gradient-to-r from-neon-green to-neon-cyan transition-all duration-500 ease-out shadow-lg"
        style={{ 
          transform: `translateX(-${100 - (value || 0)}%)`,
          boxShadow: `0 0 10px var(--neon-green), 0 0 20px var(--neon-green)`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
    </ProgressPrimitive.Root>
  )
}

export { Progress }