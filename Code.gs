/**
 * Google Apps Script Backend for Condominium Booking System
 * Serves as the API & Google Calendar Database connector.
 */

// CONFIGURATION: Set your secondary calendar ID here
// You can find your Calendar ID under Google Calendar Settings > Integrate Calendar
const CALENDAR_ID = '5e250418f97d2008bff93cc10a638b2aabe981af2d5e271b058eb8835dde2ae2@group.calendar.google.com'; 
const HOST_NOTIFICATION_EMAIL = Session.getEffectiveUser().getEmail();

/**
 * Serves the HTML frontend or returns availability as JSON if queried with ?action=getAvailableDates
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'getAvailableDates') {
    const bookedRanges = getBookedRanges();
    return ContentService.createTextOutput(JSON.stringify(bookedRanges))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Otherwise, serve the interactive web app HTML interface
  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Book 2-Bedroom Condominium')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL) // Required for Google Sites iframe embedding
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Handles booking form submissions via POST or google.script.run
 */
function createBooking(data) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      return { success: false, message: 'Configuration error: Calendar not found. Please verify CALENDAR_ID in Code.gs.' };
    }

    const startDate = new Date(data.startDate + 'T15:00:00'); // Check-in at 3:00 PM
    const endDate = new Date(data.endDate + 'T11:00:00');     // Check-out at 11:00 AM

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { success: false, message: 'Invalid start or end dates provided.' };
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
      message: 'Booking confirmed successfully!'
    };
  } catch (err) {
    return { success: false, message: 'Server error: ' + err.toString() };
  }
}

/**
 * Returns busy/booked date ranges from Google Calendar
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

/**
 * Dispatches confirmation email to guest
 */
function sendGuestConfirmationEmail(data, refId) {
  const subject = `Reservation Confirmed: 2-Bedroom Condominium (Ref #${refId})`;
  const body = `Hi ${data.guestName},\n\n`
    + `Thank you for your reservation! Your booking for the 2-Bedroom Condominium is confirmed.\n\n`
    + `Booking Details:\n`
    + `-------------------------------------\n`
    + `Reference ID: ${refId}\n`
    + `Check-in Date: ${data.startDate} (3:00 PM)\n`
    + `Check-out Date: ${data.endDate} (11:00 AM)\n`
    + `Number of Guests: ${data.guestCount}\n`
    + `-------------------------------------\n\n`
    + `We look forward to hosting you. Please feel free to reply directly to this email with any questions.\n\n`
    + `Warm regards,\nCondominium Host`;

  MailApp.sendEmail(data.guestEmail, subject, body);
}

/**
 * Dispatches notification email to host
 */
function sendHostNotificationEmail(data, refId) {
  const subject = `New Booking Received: ${data.guestName} (Ref #${refId})`;
  const body = `A new reservation was just made via Google Sites.\n\n`
    + `Guest Details:\n`
    + `Name: ${data.guestName}\n`
    + `Email: ${data.guestEmail}\n`
    + `Phone: ${data.guestPhone}\n`
    + `Guests: ${data.guestCount}\n`
    + `Dates: ${data.startDate} to ${data.endDate}\n`
    + `Reference ID: ${refId}\n\n`
    + `This booking has been added to your Google Calendar.`;

  MailApp.sendEmail(HOST_NOTIFICATION_EMAIL, subject, body);
}
