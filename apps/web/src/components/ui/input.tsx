import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const Input = ({ className, ...props }: ComponentProps<"input">) => {
  return (
    <input
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30",
        "aria-invalid:border-destructive/50 aria-invalid:bg-destructive/10 aria-invalid:ring-destructive/30 aria-invalid:focus-visible:border-destructive dark:aria-invalid:bg-destructive/10",
        className,
      )}
      data-slot="input"
      {...props}
    />
  );
};

const InputAddon = ({
  className,
  isVisible,
  ...props
}: ComponentProps<"button"> & {
  isVisible: boolean;
}) => {
  return (
    <button
      aria-controls="password"
      aria-label={isVisible ? "Hide password" : "Show password"}
      aria-pressed={isVisible}
      className={cn(
        "absolute inset-y-0 end-0 flex h-full w-8 items-center justify-center rounded-e-lg text-neutral-600 outline-none transition-[color,box-shadow] focus:z-10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 lg:hover:text-neutral-700 dark:text-neutral-400 dark:lg:hover:text-neutral-200",
        "focus-visible:border focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30",
        "aria-invalid:border-destructive/50 aria-invalid:ring-destructive/30 aria-invalid:focus-visible:border-destructive",
      )}
      type="button"
      {...props}
    />
  );
};

const InputError = ({
  className,
  error,
  ...props
}: Omit<ComponentProps<"p">, "children"> & {
  error: string;
}) => {
  return (
    <p
      className={cn("mt-1 text-red-600 text-xs dark:text-red-500", className)}
      data-slot="form-error"
      {...props}
    >
      {error}
    </p>
  );
};

export { Input, InputAddon, InputError };
