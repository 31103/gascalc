/**
 * Utilities for the gas calculator application
 */

/**
 * Parse date time string in DDHHMM format
 * @param input - Date time string
 * @param lastDate - Reference date for inheriting day when not specified
 * @returns Date object or null if invalid
 */
export function parseDateTime(input: string, lastDate: Date): Date | null {
  let day: number, hour: number, minute: number;

  // Pad left with zeros if needed
  input = input.padStart(6, '0');

  day = parseInt(input.slice(0, 2));
  hour = parseInt(input.slice(2, 4));
  minute = parseInt(input.slice(4, 6));

  if (day === 0) day = lastDate.getDate();

  if (day > 31 || hour >= 24 || minute >= 60) return null;

  const date = new Date(2024, 0, day, hour, minute);

  return date;
}

/**
 * Format date for display
 * @param date - Date object
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return `${date.getDate()}日${date.getHours().toString().padStart(2, '0')}時${date.getMinutes().toString().padStart(2, '0')}分`;
}

/**
 * Format date for input field
 * @param date - Date object
 * @returns Date string in DDHHMM format
 */
export function formatDateForInput(date: Date): string {
  return `${date.getDate()}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
}