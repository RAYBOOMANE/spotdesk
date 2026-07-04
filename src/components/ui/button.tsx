import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-live disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-live text-[#04110c] hover:brightness-110",
        payout: "bg-payout text-[#14081f] hover:brightness-110",
        set: "bg-cool text-[#04101a] hover:brightness-110",
        ghost: "bg-panel2 text-dim border border-line2 hover:text-ink hover:border-live",
        danger: "bg-panel text-dim border border-line2 hover:text-loss hover:border-loss",
        outline: "bg-panel text-dim border border-line2 hover:text-ink hover:border-live font-mono text-xs",
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
