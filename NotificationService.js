/**
 * Notification Service for Condominium Booking System.
 * Dispatches automated transactional emails to guests and host.
 */

/**
 * Dispatches confirmation email to guest.
 *
 * @param {Object} data - Guest reservation details
 * @param {string} refId - Booking reference ID
 * @param {Object} [quote] - Optional pricing quote
 */
function sendGuestConfirmationEmail(data, refId, quote) {
  var totalStr = quote ? ('₱' + Math.round(quote.totalPrice).toLocaleString('en-US')) : 'N/A';
  var savingsStr = quote ? ('₱' + Math.round(quote.totalSavings).toLocaleString('en-US')) : '₱0';
  var marketSubStr = quote ? ('₱' + Math.round(quote.marketSubtotal).toLocaleString('en-US')) : 'N/A';

  var subject = 'Reservation Confirmed: ' + CONDO_UNIT_NAME + ' (Ref #' + refId + ')';
  var body = 'Hi ' + data.guestName + ',\n\n'
    + 'Thank you for your reservation! Your staycation booking for ' + CONDO_UNIT_NAME + ' is confirmed.\n\n'
    + 'Accommodation Details:\n'
    + '-------------------------------------\n'
    + 'Property: ' + CONDO_UNIT_NAME + '\n'
    + 'Address: ' + CONDO_FULL_ADDRESS + '\n'
    + 'Booking Reference: #' + refId + '\n'
    + 'Check-in Date: ' + data.startDate + ' (3:00 PM)\n'
    + 'Check-out Date: ' + data.endDate + ' (11:00 AM)\n'
    + 'Number of Guests: ' + data.guestCount + '\n'
    + '-------------------------------------\n\n'
    + 'Pricing & Staycation Savings Breakdown:\n'
    + '-------------------------------------\n'
    + '10km Market Benchmark: ' + marketSubStr + '\n'
    + 'Guaranteed Competitor Savings: -' + savingsStr + ' (-₱500/night dynamic discount)\n'
    + (quote && quote.discountAmount > 0 ? ('Multi-Night Staycation Discount: -₱' + Math.round(quote.discountAmount).toLocaleString('en-US') + '\n') : '')
    + (quote && quote.extraGuestFee > 0 ? ('Extra Guest Fee (5-6 pax): +₱' + Math.round(quote.extraGuestFee).toLocaleString('en-US') + '\n') : '')
    + 'Total Confirmed Amount: ' + totalStr + '\n'
    + '-------------------------------------\n\n'
    + 'We look forward to hosting your Tagaytay staycation. Please feel free to reply directly to this email with any questions.\n\n'
    + 'Warm regards,\nUnit 418 Host';

  if (typeof MailApp !== 'undefined') {
    MailApp.sendEmail(data.guestEmail, subject, body);
  }
}

/**
 * Dispatches notification email to host.
 *
 * @param {Object} data - Guest reservation details
 * @param {string} refId - Booking reference ID
 * @param {Object} [quote] - Optional pricing quote
 */
function sendHostNotificationEmail(data, refId, quote) {
  var totalStr = quote ? ('₱' + Math.round(quote.totalPrice).toLocaleString('en-US')) : 'N/A';
  var savingsStr = quote ? ('₱' + Math.round(quote.totalSavings).toLocaleString('en-US')) : '₱0';

  var subject = 'New Booking Received: ' + data.guestName + ' (Ref #' + refId + ')';
  var body = 'A new staycation reservation was just completed via the direct booking portal.\n\n'
    + 'Property: ' + CONDO_UNIT_NAME + '\n'
    + 'Address: ' + CONDO_FULL_ADDRESS + '\n\n'
    + 'Guest Details:\n'
    + 'Name: ' + data.guestName + '\n'
    + 'Email: ' + data.guestEmail + '\n'
    + 'Phone: ' + data.guestPhone + '\n'
    + 'Guests: ' + data.guestCount + '\n'
    + 'Dates: ' + data.startDate + ' to ' + data.endDate + '\n'
    + 'Reference ID: #' + refId + '\n\n'
    + 'Pricing Breakdown:\n'
    + 'Total Amount: ' + totalStr + '\n'
    + 'Guest Savings vs 10km Market: ' + savingsStr + '\n\n'
    + 'This booking has been added to your Google Calendar.';

  if (typeof MailApp !== 'undefined') {
    MailApp.sendEmail(HOST_NOTIFICATION_EMAIL, subject, body);
  }
}
