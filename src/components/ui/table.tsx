import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-collapse text-[0.68rem]", className)} {...props} />;
}
export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={className} {...props} />;
}
export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}
export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b border-line2 bg-gradient-to-b from-[rgba(52,211,153,0.06)] to-transparent px-3.5 py-2.5 text-left font-mono text-[0.56rem] font-medium uppercase tracking-[0.12em] text-dim",
        className
      )}
      {...props}
    />
  );
}
export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("border-b border-line/50 px-3.5 py-2.5 font-mono text-ink", className)} {...props} />
  );
}
