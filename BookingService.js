/**
 * Booking Service for Condominium Booking System.
 * Manages calendar queries, double-booking verification, and event creation.
 */

/**
 * Handles booking requests with validation, double-booking checks, calendar event insertion,
 * and automated confirmation emails.
 *
 * @param {Object} data - Guest reservation data
 * @returns {Object} Booking result with success flag and reference ID
 */
function createBooking(data) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      return { success: false, message: 'Configuration error: Calendar not found. Please verify CALENDAR_ID.' };
    }

    const startDate = new Date(data.startDate + 'T15:00:00'); // Check-in at 3:00 PM
    const endDate = new Date(data.endDate + 'T11:00:00');     // Check-out at 11:00 AM

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { success: false, message: 'Invalid start or end dates provided.' };
    }

    if (endDate <= startDate) {
      return { success: false, message: 'Check-out date must be after check-in date.' };
    }

    // Double-booking check: ensure no overlapping events in this date range
    const conflictingEvents = calendar.getEvents(startDate, endDate);
    if (conflictingEvents.length > 0) {
      return { success: false, message: 'Conflict: Selected dates were just reserved by another guest. Please choose other dates.' };
    }

    const refId = 'CND-' + Math.floor(1000 + Math.random() * 9000);
    const eventTitle = `Booking: ${data.guestName} (${data.guestCount} guests) - Ref #${refId}`;
    const eventDescription = [
      `Guest Name: ${data.guestName}`,
      `Email: ${data.guestEmail}`,
      `Phone: ${data.guestPhone}`,
      `Guests: ${data.guestCount}`,
      `Booking Reference: ${refId}`,
      `Check-in: ${data.startDate}`,
      `Check-out: ${data.endDate}`,
      `Status: Confirmed`
    ].join('\n');

    // Create Calendar Event
    calendar.createEvent(eventTitle, startDate, endDate, {
      description: eventDescription
    });

    // Send confirmation email to guest
    if (data.guestEmail) {
      sendGuestConfirmationEmail(data, refId);
    }

    // Send notification email to host
    sendHostNotificationEmail(data, refId);

    return {
      success: true,
      refId: refId,
      referenceId: refId, // Alias for frontend compatibility
      message: 'Booking confirmed successfully!'
    };
  } catch (err) {
    return { success: false, message: 'Server error: ' + err.toString() };
  }
}

/**
 * Backward-compatible alias for createBooking.
 * Ensures compatibility if client-side code invokes processBooking().
 */
function processBooking(data) {
  return createBooking(data);
}

/**
 * Returns busy/booked date ranges from Google Calendar for the upcoming 12 months.
 *
 * @returns {Array<Object>} List of booked ranges { from, to, title }
 */
function getBookedRanges() {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) return [];

    const now = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(now.getFullYear() + 1);

    const events = calendar.getEvents(now, oneYearLater);
    return events.map(function(evt) {
      const start = evt.getStartTime();
      const end = evt.getEndTime();
      return {
        from: Utilities.formatDate(start, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        to: Utilities.formatDate(end, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        title: evt.getTitle()
      };
    });
  } catch (e) {
    return [];
  }
}
