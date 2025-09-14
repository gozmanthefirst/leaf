import { Input as BaseInput } from "@base-ui-components/react/input";
import type { ComponentProps } from "react";

import { cn } from "@/utils/cn";

export const Input = ({
  className,
  ...props
}: ComponentProps<typeof BaseInput>) => {
  return (
    <BaseInput
      className={cn(
        "flex h-8 w-full min-w-0 rounded-lg border border-neutral-300 bg-neutral-100 px-2.5 py-1 text-sm shadow-xs outline-none transition-all duration-200 selection:bg-neutral-900 selection:text-neutral-50 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-neutral-950 file:text-sm placeholder:text-neutral-400 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700/60 dark:bg-neutral-900 dark:placeholder:text-neutral-600 dark:file:text-neutral-50 dark:selection:bg-neutral-50 dark:selection:text-neutral-900",
        "focus-visible:border-lime-500 focus-visible:ring-[3px] focus-visible:ring-lime-500/30 dark:focus-visible:border-lime-500 dark:focus-visible:ring-[3px] dark:focus-visible:ring-lime-500/30",
        "aria-invalid:border-red-400 aria-invalid:bg-red-400/15 focus-visible:aria-invalid:border-red-600 focus-visible:aria-invalid:ring-red-600/30 dark:aria-invalid:border-red-900 dark:aria-invalid:bg-red-900/15 dark:focus-visible:aria-invalid:border-red-700 dark:focus-visible:aria-invalid:ring-red-500/30",
        className,
      )}
      data-slot="input"
      {...props}
    />
  );
};

export const InputAddon = ({
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
      className="absolute inset-y-0 end-0 flex h-full w-8 items-center justify-center rounded-e-lg text-neutral-600 outline-none transition-[color,box-shadow] focus:z-10 focus-visible:border focus-visible:border-lime-500 focus-visible:ring-[3px] focus-visible:ring-lime-500/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 lg:hover:text-neutral-700 dark:text-neutral-400 dark:focus-visible:border-lime-500 dark:focus-visible:ring-lime-500/30 dark:lg:hover:text-neutral-200"
      type="button"
      {...props}
    />
  );
};

export const InputError = ({
  className,
  error,
  ...props
}: Omit<ComponentProps<"p">, "children"> & {
  error: string;
}) => {
  return (
    <p
      className={cn("mt-1.5 text-red-600 text-xs dark:text-red-500", className)}
      data-slot="form-error"
      {...props}
    >
      {error}
    </p>
  );
};
