/**
 * Booking Service for Condominium Booking System.
 * Manages calendar queries, double-booking verification, and event creation.
 */

var ONLINE_AVERAGE_MARKET_RATE = 3840;
var COMPETITOR_UNDERCUT_PHP = 500;

/**
 * Calculates server-side stay quote for Unit 418 Serin East Tagaytay.
 * Uses deterministic rules to verify stay totals without client trust.
 */
function calculateServerStayQuote(startDateStr, endDateStr, guestCount) {
  var inDate = new Date(startDateStr + 'T00:00:00');
  var outDate = new Date(endDateStr + 'T00:00:00');
  var nights = Math.max(0, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));
  if (nights === 0) return null;

  var guests = Math.min(6, Math.max(1, parseInt(guestCount, 10) || 2));
  var extraGuests = Math.max(0, guests - 4);
  var marketSubtotal = 0;
  var baseUnitSubtotal = 0;

  for (var i = 0; i < nights; i++) {
    var marketRate = Math.round(ONLINE_AVERAGE_MARKET_RATE);
    var unitRate = marketRate - COMPETITOR_UNDERCUT_PHP;

    marketSubtotal += marketRate;
    baseUnitSubtotal += unitRate;
  }

  var discountRate = 0;
  var discountAmount = 0;
  var extraGuestFee = extraGuests * 400 * nights;
  var totalPrice = baseUnitSubtotal + extraGuestFee;

  return {
    nights: nights,
    guestCount: guests,
    marketSubtotal: marketSubtotal,
    baseUnitSubtotal: baseUnitSubtotal,
    totalSavings: COMPETITOR_UNDERCUT_PHP * nights,
    discountAmount: discountAmount,
    extraGuestFee: extraGuestFee,
    totalPrice: totalPrice
  };
}

/**
 * Handles booking requests with validation, double-booking checks, calendar event insertion,
 * and automated confirmation emails.
 *
 * @param {Object} data - Guest reservation data
 * @returns {Object} Booking result with success flag and reference ID
 */
function createBooking(data) {
  try {
    var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      return { success: false, message: 'Configuration error: Calendar not found. Please verify CALENDAR_ID.' };
    }

    var startDate = new Date(data.startDate + 'T15:00:00'); // Check-in at 3:00 PM
    var endDate = new Date(data.endDate + 'T11:00:00');     // Check-out at 11:00 AM

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { success: false, message: 'Invalid start or end dates provided.' };
    }

    if (endDate <= startDate) {
      return { success: false, message: 'Check-out date must be after check-in date.' };
    }

    // Double-booking check: ensure no overlapping events in this date range
    var conflictingEvents = calendar.getEvents(startDate, endDate);
    if (conflictingEvents.length > 0) {
      return { success: false, message: 'Conflict: Selected dates were just reserved by another guest. Please choose other dates.' };
    }

    var quote = calculateServerStayQuote(data.startDate, data.endDate, data.guestCount);
    var totalAmountStr = quote ? ('₱' + Math.round(quote.totalPrice).toLocaleString('en-US')) : 'N/A';
    var savingsStr = quote ? ('₱' + Math.round(quote.totalSavings).toLocaleString('en-US')) : '₱0';

    var refId = 'CND-' + Math.floor(1000 + Math.random() * 9000);
    var eventTitle = 'Staycation: ' + data.guestName + ' (' + data.guestCount + ' guests) - ' + totalAmountStr + ' - Ref #' + refId;
    var eventDescription = [
      'Property: ' + CONDO_UNIT_NAME,
      'Address: ' + CONDO_FULL_ADDRESS,
      'Guest Name: ' + data.guestName,
      'Email: ' + data.guestEmail,
      'Phone: ' + data.guestPhone,
      'Guests: ' + data.guestCount,
      'Booking Reference: ' + refId,
      'Check-in: ' + data.startDate + ' (3:00 PM)',
      'Check-out: ' + data.endDate + ' (11:00 AM)',
      'Total Price: ' + totalAmountStr,
      'Competitor Savings (-₱500/night): ' + savingsStr,
      'Status: Confirmed'
    ].join('\n');

    // Create Calendar Event
    calendar.createEvent(eventTitle, startDate, endDate, {
      description: eventDescription,
      location: CONDO_FULL_ADDRESS
    });

    // Send confirmation email to guest
    if (data.guestEmail) {
      sendGuestConfirmationEmail(data, refId, quote);
    }

    // Send notification email to host
    sendHostNotificationEmail(data, refId, quote);

    return {
      success: true,
      refId: refId,
      referenceId: refId, // Alias for frontend compatibility
      totalPrice: quote ? quote.totalPrice : null,
      pricing: quote,
      message: 'Booking confirmed successfully!'
    };
  } catch (err) {
    return { success: false, message: 'Server error: ' + err.toString() };
  }
}

/**
 * Backward-compatible alias for createBooking.
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
    var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) return [];

    var now = new Date();
    var oneYearLater = new Date();
    oneYearLater.setFullYear(now.getFullYear() + 1);

    var events = calendar.getEvents(now, oneYearLater);
    return events.map(function(evt) {
      var start = evt.getStartTime();
      var end = evt.getEndTime();
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
