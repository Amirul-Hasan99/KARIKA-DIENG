import React from "react";
import { cn } from "@/lib/utils";

export type FlaticonVariant = "rr" | "br" | "sr" | "brands";

export interface FlaticonProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  variant?: FlaticonVariant;
  className?: string;
}

export const Flaticon = React.forwardRef<HTMLElement, FlaticonProps>(
  ({ name, variant = "rr", className, ...props }, ref) => {
    const prefix = variant === "brands" ? "fi-brands" : `fi-${variant}`;
    return (
      <i
        ref={ref}
        className={cn(
          "fi inline-flex items-center justify-center leading-none select-none text-[1.15em]",
          `${prefix}-${name}`,
          className
        )}
        aria-hidden="true"
        {...props}
      />
    );
  }
);
Flaticon.displayName = "Flaticon";

export default Flaticon;

