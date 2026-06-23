import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes intelligently (later classes win conflicts).
 * Standard shadcn/ui utility used by every component.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
