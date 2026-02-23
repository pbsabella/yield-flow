import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "border-border bg-card text-foreground focus-visible:ring-primary hover:border-foreground/20 active:border-primary/50 flex h-12 w-full rounded-md border px-4 py-3 text-sm transition-colors duration-150 ease-out focus-visible:ring-2",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
