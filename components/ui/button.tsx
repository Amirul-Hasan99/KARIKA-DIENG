import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "default", ...props }, ref
) {
  return <button ref={ref} className={cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDB900] disabled:pointer-events-none disabled:opacity-50",
    { default: "bg-[#292929] text-white hover:bg-black", secondary: "bg-[#F4CE00] text-[#292929] hover:bg-[#DDB900]", outline: "border border-[#e7e5df] bg-white hover:bg-[#f8f7f0]", ghost: "hover:bg-black/5", destructive: "bg-red-600 text-white hover:bg-red-700" }[variant],
    { default: "h-11 px-5", sm: "h-9 rounded-lg px-3", lg: "h-12 px-7 text-base", icon: "h-10 w-10" }[size], className
  )} {...props} />;
});
