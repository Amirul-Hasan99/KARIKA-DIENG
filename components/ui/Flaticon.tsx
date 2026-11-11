import React from "react";
import { cn } from "@/lib/utils";

export type FlaticonVariant = "rr" | "br" | "sr" | "brands";

export interface FlaticonProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  variant?: FlaticonVariant;
  className?: string;
}

export function Flaticon({
  name,
  variant = "rr",
  className,
  ...props
}: FlaticonProps) {
  const prefix = variant === "brands" ? "fi-brands" : `fi-${variant}`;
  return (
    <i
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

export default Flaticon;
