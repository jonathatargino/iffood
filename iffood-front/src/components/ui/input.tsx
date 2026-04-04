import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "rounded-2xl px-4 text-sm transition-colors outline-none focus:border-[#FF7622]",
        "rounded-lg border-gray-100",
        "dark:bg-input/30",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        "aria-invalid:border-destructive dark:aria-invalid:border-destructive/50",
        "h-12 w-full min-w-0 placeholder:text-gray-400",
        "border border-gray-200 bg-white",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-[3px] md:text-sm",
        className,
      )}
      {...props}
    />
  );
}
