import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  color,
  children,
}: {
  className?: string;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn("inline-block rounded-full px-2.5 py-0.5 font-mono text-[0.58rem] font-bold", className)}
      style={color ? { background: color + "22", color } : undefined}
    >
      {children}
    </span>
  );
}
