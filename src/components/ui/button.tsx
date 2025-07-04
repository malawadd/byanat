import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-neon-green/50 command-text uppercase tracking-wider relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-neon-green/20 text-neon-green border border-neon-green hover:bg-neon-green/30 hover:shadow-lg hover:shadow-neon-green/20 neon-border",
        destructive:
          "bg-red-500/20 text-red-400 border border-red-500 hover:bg-red-500/30 hover:shadow-lg hover:shadow-red-500/20",
        outline:
          "border border-neon-cyan/50 bg-transparent text-neon-cyan hover:bg-neon-cyan/10 hover:text-neon-cyan hover:border-neon-cyan wireframe",
        secondary:
          "bg-neon-magenta/20 text-neon-magenta border border-neon-magenta hover:bg-neon-magenta/30 hover:shadow-lg hover:shadow-neon-magenta/20",
        ghost:
          "hover:bg-neon-green/10 hover:text-neon-green text-neon-cyan/70",
        link: "text-neon-cyan underline-offset-4 hover:underline hover:text-neon-green",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded px-3 text-xs",
        lg: "h-12 rounded px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }