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

/**
 * Formats calendar event fields (summary, timestamps, description) for Google Calendar creation.
 * Check-in defaults to 15:00 and check-out defaults to 11:00.
 *
 * @param {Object} bookingData
 * @param {string} bookingData.startDate - YYYY-MM-DD
 * @param {string} bookingData.endDate - YYYY-MM-DD
 * @param {string} bookingData.guestName
 * @param {string|number} bookingData.guestCount
 * @param {string} [bookingData.guestEmail]
 * @param {string} [bookingData.guestPhone]
 * @param {string} refId - Booking reference identifier
 * @param {string} [tzOffset='+08:00'] - ISO timezone offset (default Manila UTC+8)
 * @returns {{summary: string, startRfc3339: string, endRfc3339: string, description: string}}
 */
export function formatCalendarEventPayload(bookingData, refId, tzOffset = '+08:00') {
  const summary = `Booking: ${bookingData.guestName} (${bookingData.guestCount} guests) - Ref #${refId}`;
  const startRfc3339 = `${bookingData.startDate}T15:00:00${tzOffset}`;
  const endRfc3339 = `${bookingData.endDate}T11:00:00${tzOffset}`;

  const descriptionLines = [
    `Guest Name: ${bookingData.guestName}`,
    `Email: ${bookingData.guestEmail || 'N/A'}`,
    `Phone: ${bookingData.guestPhone || 'N/A'}`,
    `Guests: ${bookingData.guestCount}`,
    `Booking Reference: ${refId}`,
    `Check-in: ${bookingData.startDate}`,
    `Check-out: ${bookingData.endDate}`,
    `Status: Confirmed`
  ];

  return {
    summary,
    startRfc3339,
    endRfc3339,
    description: descriptionLines.join('\n')
  };
}

/**
 * Converts backend bookedRanges [{from, to, title}] into FullCalendar event objects.
 * FullCalendar all-day events use exclusive end dates.
 *
 * @param {Array<{from: string, to: string, title?: string}>} bookedRanges
 * @returns {Array<Object>}
 */
export function mapBookingsToFullCalendarEvents(bookedRanges = []) {
  if (!bookedRanges || !Array.isArray(bookedRanges)) return [];
  return bookedRanges.map(r => ({
    id: `booking-${r.from}`,
    start: r.from,
    end: r.to,
    title: 'Booked',
    display: 'block',
    overlap: false,
    backgroundColor: '#94a3b8',
    borderColor: '#64748b',
    textColor: '#ffffff',
    classNames: ['fc-booked-event'],
    extendedProps: {
      isBooked: true,
      originalTitle: r.title || 'Reserved'
    }
  }));
}

/**
 * Extracts and calculates checkIn, checkOut, and nights from a FullCalendar selection info object.
 *
 * @param {{startStr: string, endStr: string}} selectInfo
 * @returns {{checkIn: string, checkOut: string, nights: number}}
 */
export function parseFullCalendarSelection(selectInfo) {
  if (!selectInfo || !selectInfo.startStr || !selectInfo.endStr) {
    return { checkIn: '', checkOut: '', nights: 0 };
  }
  const checkIn = selectInfo.startStr.split('T')[0];
  const checkOut = selectInfo.endStr.split('T')[0];

  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);
  const diffTime = endDate.getTime() - startDate.getTime();
  const nights = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

  return { checkIn, checkOut, nights };
}

/**
 * Validates whether an interactive FullCalendar selection is allowed.
 * Blocks past dates and conflicts with existing bookings.
 *
 * @param {{startStr: string, endStr: string}} selectInfo
 * @param {Array<{from: string, to: string}>} bookedRanges
 * @param {string} todayIso
 * @returns {boolean}
 */
export function isSelectionAllowed(selectInfo, bookedRanges = [], todayIso = new Date().toISOString().slice(0, 10)) {
  const { checkIn, checkOut } = parseFullCalendarSelection(selectInfo);
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return false;
  }
  if (checkIn < todayIso) {
    return false;
  }
  // Check overlap with booked ranges: overlap if checkIn < r.to and checkOut > r.from
  return !hasBookingConflict(checkIn, checkOut, bookedRanges);
}

/**
 * Determines whether DOM initialization should run immediately based on document.readyState.
 * In sandboxed iframe environments (such as Google Apps Script HtmlService),
 * DOMContentLoaded may have already fired by the time the user code executes.
 *
 * @param {string} readyState - The document.readyState string ('loading', 'interactive', 'complete')
 * @returns {boolean} True if DOM is already parsed and ready for element manipulation.
 */
export function shouldTriggerInitialization(readyState) {
  return readyState === 'interactive' || readyState === 'complete';
}

/**
 * Builds resilient fallback iframe HTML markup for Google Calendar
 * if client-side library loading fails or is delayed.
 *
 * @param {string} calendarId - Google Calendar ID
 * @param {string} timeZone - TimeZone string
 * @returns {string} HTML iframe markup
 */
export function buildCalendarFallbackMarkup(calendarId, timeZone = 'Asia/Manila') {
  const embedUrl = buildGoogleCalendarEmbedUrl(calendarId, timeZone);
  return `<iframe src="${embedUrl}" style="border: 0; width: 100%; height: 420px; border-radius: 8px;" frameborder="0" scrolling="no" title="Google Calendar Availability Schedule" loading="lazy"></iframe>`;
}

/**
 * Escapes unsafe HTML characters to prevent XSS.
 *
 * @param {string|any} str - Input value
 * @returns {string} Sanitized HTML string
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

/**
 * Builds the direct Google Calendar web template link for "Add to Calendar".
 *
 * @param {string} refId - Booking reference ID
 * @param {string} checkInDate - YYYY-MM-DD
 * @param {string} checkOutDate - YYYY-MM-DD
 * @returns {string} Google Calendar Add URL
 */
export function buildGoogleCalendarTemplateUrl(refId, checkInDate, checkOutDate) {
  const s = String(checkInDate).replace(/-/g, '');
  const e = String(checkOutDate).replace(/-/g, '');
  const title = encodeURIComponent(`Stay at 2-Bedroom Condominium (Ref #${refId})`);
  const details = encodeURIComponent(`Condo Reservation Ref #${refId}\nCheck-in: 3:00 PM\nCheck-out: 11:00 AM`);
  const loc = encodeURIComponent("418 Serin Tagaytay Condominium");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${s}T150000/${e}T110000&details=${details}&location=${loc}`;
}

/**
 * Generates RFC 5545 iCalendar (.ics) string.
 *
 * @param {Object} reservation - Reservation object
 * @returns {string} .ics content string
 */
export function buildIcsContent(reservation) {
  const inVal = String(reservation.startDate).replace(/-/g, '');
  const outVal = String(reservation.endDate).replace(/-/g, '');
  const ref = reservation.referenceId;
  const todayIso = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Condo Booking//EN",
    "BEGIN:VEVENT",
    `UID:condo-${ref}@booking.local`,
    `DTSTAMP:${todayIso}T000000Z`,
    `DTSTART:${inVal}T150000`,
    `DTEND:${outVal}T110000`,
    `SUMMARY:Stay at 2-Bedroom Condominium (Ref #${ref})`,
    `DESCRIPTION:Condominium Reservation Ref #${ref}\\nGuest: ${reservation.guestName}\\nGuests: ${reservation.guestCount}`,
    `LOCATION:418 Serin Tagaytay Condominium`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

/**
 * Validates the contact form fields on the client.
 *
 * @param {Object} data - Guest form data
 * @returns {{isValid: boolean, error: string|null}}
 */
export function validateGuestFormPayload(data) {
  if (!data || !data.guestName || !data.guestEmail || !data.guestPhone) {
    return { isValid: false, error: "Please fill in all required contact details." };
  }
  return { isValid: true, error: null };
}
