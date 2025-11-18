import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merge Tailwind classes and conditional fragments into a single string.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
