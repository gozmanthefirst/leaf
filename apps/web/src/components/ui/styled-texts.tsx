import { Link, type LinkProps } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { cn } from "@/utils/cn";

const BrandLink = ({
  className,
  ...props
}: LinkProps & ComponentProps<"a">) => {
  return (
    <Link
      className={cn(
        "font-medium text-lime-600 underline-offset-1 lg:hover:underline dark:text-lime-400",
        className,
      )}
      {...props}
    />
  );
};

export { BrandLink };
