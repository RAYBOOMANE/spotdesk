import * as React from "react";
import { cn } from "@/lib/utils";

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Force the hover treatment even when onClick isn't on this element itself. */
  interactive?: boolean;
}

// Secondary surface tier — nested inside a Card (e.g. a row within a card,
// a badge background, a stat sub-box). Same border/surface tokens as Card,
// one size down, with its own single hover recipe.
const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, interactive, onClick, ...props }, ref) => (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        "rounded-lg border border-line bg-panel",
        (interactive || onClick) && "cursor-pointer transition-colors hover:border-line2 hover:bg-panel2",
        className
      )}
      {...props}
    />
  )
);
Panel.displayName = "Panel";

export { Panel };
