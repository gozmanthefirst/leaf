/** biome-ignore-all lint/a11y/noLabelWithoutControl: needed */
import type { ComponentProps } from "react";

import { cn } from "@/utils/cn";

function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "flex select-none items-center gap-2 font-medium text-neutral-700 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 dark:text-neutral-300",
        className,
      )}
      data-slot="label"
      {...props}
    />
  );
}

export { Label };
