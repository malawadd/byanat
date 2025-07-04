import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded border border-neon-green/30 bg-black/50 px-3 py-2 text-sm text-neon-green placeholder:text-neon-cyan/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green/50 focus-visible:border-neon-green disabled:cursor-not-allowed disabled:opacity-50 command-text backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }