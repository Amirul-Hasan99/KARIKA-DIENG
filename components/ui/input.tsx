import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn("flex h-11 w-full rounded-xl border border-[#e7e5df] bg-white px-3.5 py-2 text-sm outline-none placeholder:text-[#99978f] focus-visible:ring-2 focus-visible:ring-[#DDB900] disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />;
});
