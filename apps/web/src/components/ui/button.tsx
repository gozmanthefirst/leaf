import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold text-sm outline-2 outline-transparent outline-offset-2 transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-lime-500 text-neutral-950 shadow focus-visible:outline-lime-500 lg:hover:bg-lime-500/90",
        secondary:
          "bg-secondary text-secondary-foreground shadow focus-visible:outline-secondary lg:hover:bg-secondary/80",
        muted:
          "bg-muted text-secondary-foreground shadow focus-visible:outline-muted",
        destructive:
          "bg-destructive text-white focus-visible:outline-destructive dark:focus-visible:outline-destructive",
        outline:
          "border bg-background shadow-xs hover:bg-accent/40 hover:text-accent-foreground focus-visible:outline-border dark:bg-input/30 dark:lg:hover:bg-input/40",
        ghost:
          "lg:hover:bg-accent lg:hover:text-accent-foreground dark:lg:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-6 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-md px-4 has-[>svg]:px-2.5",
        xs: "h-7 gap-1.5 rounded-md px-4 text-xs has-[>svg]:px-2.5",
        lg: "h-10 px-8 has-[>svg]:px-4",
        icon: "size-9",
        iconSm: "size-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = ({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      data-slot="button"
      {...props}
    />
  );
};

export { Button, buttonVariants };
