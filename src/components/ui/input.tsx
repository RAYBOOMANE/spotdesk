import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-line2 bg-void px-3 py-2.5 font-mono text-[0.9rem] text-ink placeholder:text-faint focus:border-live focus:outline-none",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
