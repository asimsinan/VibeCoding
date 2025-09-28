/**
 * Date utility functions for timezone-aware date handling
 */

/**
 * Get today's date in YYYY-MM-DD format using local timezone
 * This ensures the date matches what the user sees in their timezone
 */
export function getTodayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get a date in YYYY-MM-DD format using local timezone
 * @param date - Date object or date string
 */
export function formatDateLocal(date: Date | string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get a date range for the last N days using local timezone
 * @param days - Number of days to go back
 */
export function getDateRangeLocal(days: number): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  
  return {
    startDate: formatDateLocal(startDate),
    endDate: formatDateLocal(endDate)
  };
}

/**
 * Check if a date is today using local timezone
 * @param dateString - Date string in YYYY-MM-DD format
 */
export function isTodayLocal(dateString: string): boolean {
  return dateString === getTodayLocal();
}
