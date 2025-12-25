import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  })
}

export function formatDateRange(start: string, end?: string | null): string {
  const startDate = formatDate(start)
  if (!end) return `A partir du ${startDate}`
  const endDate = formatDate(end)
  return `Du ${startDate} au ${endDate}`
}
