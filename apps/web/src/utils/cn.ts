import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines and merges multiple class name values into a single string using Tailwind's merge functionality.
 * Utilizes both `clsx` for conditional class names and `twMerge` for Tailwind-specific class merging.
 */
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs));
};
