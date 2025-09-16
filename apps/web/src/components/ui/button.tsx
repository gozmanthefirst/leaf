import { mergeProps } from "@base-ui-components/react/merge-props";
import { useRender } from "@base-ui-components/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold text-sm outline-2 outline-transparent outline-offset-2 transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-[18px] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-lime-500 text-neutral-950 shadow focus-visible:outline-lime-500 lg:hover:bg-lime-500/90",
        secondary:
          "bg-neutral-300 text-neutral-900 shadow-xs focus-visible:outline-neutral-400 lg:hover:bg-neutral-300/80 dark:bg-neutral-700 dark:text-neutral-50 dark:focus-visible:outline-neutral-600 lg:dark:hover:bg-neutral-700/80",
      },
      size: {
        default: "h-9 px-8 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-6 text-xs has-[>svg]:px-5",
        xs: "h-7 gap-1.5 px-6 text-xs has-[>svg]:px-5",
        lg: "h-10 px-8 has-[>svg]:px-6",
        icon: "size-8",
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
  render,
  ...props
}: useRender.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>) => {
  const element = useRender({
    defaultTagName: "button",
    render,
    props: mergeProps<"button">(
      { className: cn(buttonVariants({ variant, size, className })) },
      props,
    ),
  });

  return element;
};

export { Button, buttonVariants };
