import { Link, type LinkProps } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const BrandLink = ({
  className,
  ...props
}: LinkProps & ComponentProps<"a">) => {
  return (
    <Link
      className={cn(
        "font-medium text-lime-600 underline-offset-1 focus-visible:outline focus-visible:outline-lime-600 focus-visible:outline-offset-0 lg:hover:underline dark:text-lime-400 dark:focus-visible:outline-lime-400",
        className,
      )}
      {...props}
    />
  );
};

export { BrandLink };
