import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInWeeks, parseISO, startOfDay } from 'date-fns';

/**
 * Utility function for merging Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate the current week number based on cohort start date
 * @param cohortStartDate - The start date of the 12-week cohort
 * @param currentDate - The current date (defaults to today)
 * @returns Week number (1-12) or 0 if before cohort starts
 */
export function calculateWeekNumber(
  cohortStartDate: string,
  currentDate: Date = new Date()
): number {
  const start = startOfDay(parseISO(cohortStartDate));
  const current = startOfDay(currentDate);

  const weeksDiff = differenceInWeeks(current, start);

  if (weeksDiff < 0) return 0; // Before cohort starts
  if (weeksDiff >= 12) return 12; // After cohort ends, cap at week 12

  return weeksDiff + 1; // Weeks are 1-indexed
}

/**
 * Calculate goal completion percentage based on tactic completions
 * @param completedCount - Number of completed tactics
 * @param totalExpected - Total expected tactics for the week
 * @returns Percentage (0-100)
 */
export function calculateGoalScore(
  completedCount: number,
  totalExpected: number
): number {
  if (totalExpected === 0) return 0;
  const percentage = (completedCount / totalExpected) * 100;
  return Math.min(100, Math.round(percentage * 100) / 100); // Round to 2 decimal places
}

/**
 * Calculate overall weekly score from all goal scores
 * @param goalScores - Array of goal completion percentages
 * @returns Average percentage (0-100)
 */
export function calculateOverallScore(goalScores: number[]): number {
  if (goalScores.length === 0) return 0;
  const sum = goalScores.reduce((acc, score) => acc + score, 0);
  const average = sum / goalScores.length;
  return Math.round(average * 100) / 100; // Round to 2 decimal places
}

/**
 * Get color class based on completion percentage
 * @param percentage - Completion percentage (0-100)
 * @returns Tailwind color class name
 */
export function getScoreColor(percentage: number): string {
  if (percentage >= 85) return 'text-success-600 bg-success-50';
  if (percentage >= 70) return 'text-warning-600 bg-warning-50';
  return 'text-danger-600 bg-danger-50';
}

/**
 * Format date for display
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get week date range
 * @param cohortStartDate - The start date of the cohort
 * @param weekNumber - Week number (1-12)
 * @returns Object with start and end dates for the week
 */
export function getWeekDateRange(
  cohortStartDate: string,
  weekNumber: number
): { start: Date; end: Date } {
  const cohortStart = parseISO(cohortStartDate);
  const weekStart = new Date(cohortStart);
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return { start: weekStart, end: weekEnd };
}
