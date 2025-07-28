/**
 * Timezone utility functions for Bahrain time conversion
 */

import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';

export const BAHRAIN_TIMEZONE = 'Asia/Bahrain';
export const BAHRAIN_UTC_OFFSET = '+03:00';

/**
 * Convert Bahrain time to UTC using proper timezone handling
 * @param date - Date string in YYYY-MM-DD format
 * @param time - Time string in HH:MM format (24-hour)
 * @returns ISO string in UTC
 */
export function convertBahrainToUTC(date: string, time: string): string {
  if (!date || !time) return '';

  // Create a date string in Bahrain timezone
  const bahrainDateTimeString = `${date}T${time}:00`;

  // Convert Bahrain time to UTC using date-fns-tz
  const utcDate = fromZonedTime(bahrainDateTimeString, BAHRAIN_TIMEZONE);

  return utcDate.toISOString();
}

/**
 * Convert UTC to Bahrain time
 * @param utcDateTime - ISO string in UTC
 * @returns Object with date and time in Bahrain timezone
 */
export function convertUTCToBahrain(utcDateTime: string): {
  date: string;
  time: string;
} {
  if (!utcDateTime) return { date: '', time: '' };

  const utcDate = new Date(utcDateTime);

  const date = formatInTimeZone(utcDate, BAHRAIN_TIMEZONE, 'yyyy-MM-dd');
  const time = formatInTimeZone(utcDate, BAHRAIN_TIMEZONE, 'HH:mm');

  return { date, time };
}

/**
 * Get current Bahrain time
 * @returns Formatted current Bahrain time string
 */
export function getCurrentBahrainTime(): string {
  return formatInTimeZone(new Date(), BAHRAIN_TIMEZONE, 'yyyy-MM-dd HH:mm');
}

/**
 * Get current Bahrain date
 * @returns Current Bahrain date in YYYY-MM-DD format
 */
export function getCurrentBahrainDate(): string {
  try {
    return formatInTimeZone(new Date(), BAHRAIN_TIMEZONE, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error getting current Bahrain date:', error);
    // Fallback to local date if timezone conversion fails
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Format UTC datetime for display in Bahrain time
 * @param utcDateTime - ISO string in UTC
 * @param options - Formatting options
 * @returns Formatted string in Bahrain time
 */
export function formatUTCForDisplay(
  utcDateTime: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!utcDateTime) return '';

  return formatInTimeZone(
    new Date(utcDateTime),
    BAHRAIN_TIMEZONE,
    'MMM dd, yyyy HH:mm'
  );
}

/**
 * Format UTC datetime for display in Bahrain time (date only)
 * @param utcDateTime - ISO string in UTC
 * @param options - Formatting options
 * @returns Formatted date string in Bahrain time
 */
export function formatUTCForDateDisplay(
  utcDateTime: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!utcDateTime) return '';

  return formatInTimeZone(
    new Date(utcDateTime),
    BAHRAIN_TIMEZONE,
    'MMMM dd, yyyy'
  );
}

/**
 * Format UTC datetime for display in Bahrain time (time only)
 * @param utcDateTime - ISO string in UTC
 * @param options - Formatting options
 * @returns Formatted time string in Bahrain time
 */
export function formatUTCForTimeDisplay(
  utcDateTime: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!utcDateTime) return '';

  return formatInTimeZone(new Date(utcDateTime), BAHRAIN_TIMEZONE, 'hh:mm a');
}

/**
 * Convert UTC datetime string to Bahrain time for display
 * @param utcDateTime - ISO string in UTC
 * @returns Formatted string in Bahrain time
 */
export function convertUTCToBahrainDisplay(utcDateTime: string): string {
  if (!utcDateTime) return '';

  return formatInTimeZone(
    new Date(utcDateTime),
    BAHRAIN_TIMEZONE,
    'MMM dd, yyyy HH:mm'
  );
}

/**
 * Convert UTC datetime to Bahrain datetime-local input format
 * @param utcDateTime - ISO string in UTC
 * @returns Formatted string for datetime-local input (YYYY-MM-DDTHH:MM)
 */
export function convertUTCToBahrainDateTimeLocal(utcDateTime: string): string {
  if (!utcDateTime) return '';

  const date = formatInTimeZone(
    new Date(utcDateTime),
    BAHRAIN_TIMEZONE,
    'yyyy-MM-dd'
  );
  const time = formatInTimeZone(
    new Date(utcDateTime),
    BAHRAIN_TIMEZONE,
    'HH:mm'
  );

  return `${date}T${time}`;
}

/**
 * Format time slot range for display in Bahrain time
 * @param startTime - UTC start time
 * @param endTime - UTC end time
 * @returns Formatted time slot string in Bahrain time
 */
export function formatTimeSlotRange(
  startTime: string | Date,
  endTime: string | Date
): string {
  if (!startTime || !endTime) return '';

  const start = new Date(startTime);
  const end = new Date(endTime);

  const startTimeStr = formatInTimeZone(start, BAHRAIN_TIMEZONE, 'HH:mm');
  const endTimeStr = formatInTimeZone(end, BAHRAIN_TIMEZONE, 'HH:mm');

  return `${startTimeStr} - ${endTimeStr}`;
}

/**
 * Validate if a Bahrain datetime is in the future
 * @param date - Date string in YYYY-MM-DD format
 * @param time - Time string in HH:MM format
 * @returns True if the datetime is in the future
 */
export function isBahrainDateTimeInFuture(date: string, time: string): boolean {
  if (!date || !time) return false;

  const utcDateTime = convertBahrainToUTC(date, time);
  const selectedDate = new Date(utcDateTime);
  const now = new Date();

  return selectedDate > now;
}

/**
 * Get minimum datetime for driver assignments (current time + 30 minutes)
 * @returns ISO string in UTC
 */
export function getMinimumAssignmentTime(): string {
  const now = new Date();
  const minimumTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
  return minimumTime.toISOString();
}

/**
 * Convert Bahrain datetime string to UTC for API calls
 * @param bahrainDateTime - Datetime string in Bahrain time (YYYY-MM-DDTHH:MM format)
 * @returns ISO string in UTC
 */
export function convertBahrainDateTimeToUTC(bahrainDateTime: string): string {
  if (!bahrainDateTime) return '';

  // Parse the datetime string
  const [datePart, timePart] = bahrainDateTime.split('T');
  if (!datePart || !timePart) return '';

  return convertBahrainToUTC(datePart, timePart);
}

/**
 * Get current Bahrain time as a Date object
 * @returns Date object representing current Bahrain time
 */
export function getCurrentBahrainDateObject(): Date {
  const now = new Date();
  const bahrainTimeString = now.toLocaleString('en-US', {
    timeZone: BAHRAIN_TIMEZONE,
  });
  return new Date(bahrainTimeString);
}

/**
 * Get timezone offset in milliseconds for a specific date and timezone
 * @param date - Date to get offset for
 * @param timezone - IANA timezone identifier
 * @returns Offset in milliseconds
 */
function getTimezoneOffsetForDate(date: Date, timezone: string): number {
  // Create a date in the target timezone
  const targetDate = new Date(
    date.toLocaleString('en-US', { timeZone: timezone })
  );

  // Create a date in UTC
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));

  // Calculate the difference in milliseconds
  return targetDate.getTime() - utcDate.getTime();
}

/**
 * Robust timezone conversion using proper IANA timezone handling
 * This function handles daylight saving time transitions properly
 * @param localDateTime - Local datetime string (YYYY-MM-DDTHH:MM)
 * @param fromTimezone - Source timezone (IANA identifier)
 * @param toTimezone - Target timezone (IANA identifier)
 * @returns ISO string in target timezone
 */
export function convertBetweenTimezones(
  localDateTime: string,
  fromTimezone: string,
  toTimezone: string
): string {
  if (!localDateTime) return '';

  // Parse the datetime
  const [datePart, timePart] = localDateTime.split('T');
  if (!datePart || !timePart) return '';

  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  // Create a date object in the source timezone
  const sourceDate = new Date(year, month - 1, day, hour, minute, 0, 0);

  // Get the offset for the source timezone
  const sourceOffsetMs = getTimezoneOffsetForDate(sourceDate, fromTimezone);

  // Convert to UTC
  const utcDate = new Date(sourceDate.getTime() - sourceOffsetMs);

  // Convert to target timezone
  const targetDate = new Date(
    utcDate.toLocaleString('en-US', { timeZone: toTimezone })
  );

  return targetDate.toISOString();
}

/**
 * Validate timezone identifier
 * @param timezone - IANA timezone identifier to validate
 * @returns True if the timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    // Try to create a date with the timezone
    const testDate = new Date();
    testDate.toLocaleString('en-US', { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get timezone offset string (e.g., "+03:00", "-05:00")
 * @param timezone - IANA timezone identifier
 * @param date - Date to get offset for (defaults to current date)
 * @returns Offset string
 */
export function getTimezoneOffsetString(
  timezone: string,
  date: Date = new Date()
): string {
  try {
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const targetTime = new Date(utc);
    const targetOffset = targetTime.toLocaleString('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });

    // Extract offset from timezone string
    const offsetMatch = targetOffset.match(/GMT([+-]\d{2}):?(\d{2})?/);
    if (offsetMatch) {
      const hours = offsetMatch[1];
      const minutes = offsetMatch[2] || '00';
      return `${hours}:${minutes}`;
    }

    return '+00:00';
  } catch (error) {
    return '+00:00';
  }
}
