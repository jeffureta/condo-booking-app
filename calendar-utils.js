/**
 * Utility functions for Google Calendar embedding, linking, and booking validation.
 * Compatible with modern browser ES modules, Node.js, and Google Apps Script environments.
 */

/**
 * Builds an accessible Google Calendar iframe embed URL
 * @param {string} calendarId - Google Calendar ID
 * @param {string} timeZone - TimeZone string (e.g., 'Asia/Manila' or 'Europe/London')
 * @returns {string} Fully qualified embed URL
 */
export function buildGoogleCalendarEmbedUrl(calendarId, timeZone = 'Asia/Manila') {
  const base = 'https://calendar.google.com/calendar/embed';
  const params = new URLSearchParams({
    src: calendarId,
    ctz: timeZone,
    showTitle: '0',
    showNav: '1',
    showDate: '1',
    showPrint: '0',
    showTabs: '0',
    showCalendars: '0',
    showTz: '1',
    mode: 'MONTH'
  });
  return `${base}?${params.toString()}`;
}

/**
 * Builds a direct web link for guests to view the Google Calendar in browser or app
 * @param {string} calendarId - Google Calendar ID
 * @returns {string} Direct URL
 */
export function buildGoogleCalendarDirectLink(calendarId) {
  return `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarId)}`;
}

/**
 * Checks whether a requested [startDate, endDate] range overlaps any existing booked ranges.
 * Two date ranges [A, B] and [C, D] overlap if A < D and B > C.
 * @param {string} start - ISO date string YYYY-MM-DD
 * @param {string} end - ISO date string YYYY-MM-DD
 * @param {Array<{from: string, to: string}>} bookedRanges
 * @returns {boolean}
 */
export function hasBookingConflict(start, end, bookedRanges = []) {
  if (!bookedRanges || !bookedRanges.length) return false;
  return bookedRanges.some(r => {
    // Overlap condition: start < r.to && end > r.from
    return start < r.to && end > r.from;
  });
}

/**
 * Validates check-in and check-out dates
 * @param {string} checkIn - ISO YYYY-MM-DD
 * @param {string} checkOut - ISO YYYY-MM-DD
 * @param {string} todayIso - Current date ISO YYYY-MM-DD
 * @returns {{isValid: boolean, error: string|null}}
 */
export function validateBookingDates(checkIn, checkOut, todayIso) {
  if (!checkIn || !checkOut) {
    return { isValid: false, error: 'Both check-in and check-out dates are required.' };
  }
  if (checkIn < todayIso) {
    return { isValid: false, error: 'Check-in date cannot be in the past.' };
  }
  if (checkOut <= checkIn) {
    return { isValid: false, error: 'Check-out date must be after check-in date.' };
  }
  return { isValid: true, error: null };
}
