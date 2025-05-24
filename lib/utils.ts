import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date according to the specified format
 * @param date Date to format
 * @param format Format string (simplified options)
 * @returns Formatted date string
 */
export function formatDate(date: Date, format: string): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const shortMonths = months.map((m) => m.substring(0, 3));
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Simple format replacements
  return format
    .replace("yyyy", year.toString())
    .replace("MMMM", months[month])
    .replace("MMM", shortMonths[month])
    .replace("MM", (month + 1).toString().padStart(2, "0"))
    .replace("M", (month + 1).toString())
    .replace("dd", day.toString().padStart(2, "0"))
    .replace("d", day.toString())
    .replace("HH", hours.toString().padStart(2, "0"))
    .replace("H", hours.toString())
    .replace("h", ((hours % 12) || 12).toString())
    .replace("mm", minutes.toString().padStart(2, "0"))
    .replace("m", minutes.toString())
    .replace("a", hours >= 12 ? "pm" : "am")
    .replace("A", hours >= 12 ? "PM" : "AM");
}
