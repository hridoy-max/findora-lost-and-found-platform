import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind CSS classes and merges conflicting ones.
 * Based on the standard shadcn/ui utility.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
