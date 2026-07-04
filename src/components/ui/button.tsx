import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.97]",
  {
    variants: {
      variant: {
        // primary, filled — for the main action in a group (Blew, New Day)
        default: "bg-ink text-void hover:bg-dim",
        // primary, outlined — for the equally-weighted alternate action (Payout)
        payout: "border border-ink text-ink hover:bg-panel2",
        // secondary, outlined — for a lower-emphasis action (Set Day)
        set: "border border-line2 text-dim hover:text-ink hover:border-ink/40",
        // tertiary — minimal emphasis
        ghost: "border border-line bg-panel text-dim hover:text-ink hover:border-line2",
        // destructive — the one place red appears outside a P&L figure
        danger: "border border-line bg-panel text-dim hover:text-loss hover:border-loss/50",
        outline:
          "border border-line bg-panel text-dim hover:text-ink hover:border-line2 font-mono text-xs tracking-[0.02em]",
      },
      size: {
        default: "px-4 py-2.5 text-[0.76rem]",
        sm: "px-3 py-2 text-[0.68rem]",
        xs: "px-2.5 py-1.5 text-[0.62rem]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
