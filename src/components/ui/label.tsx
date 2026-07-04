import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("mb-1.5 block text-[0.58rem] font-medium uppercase tracking-[0.1em] text-dim", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
