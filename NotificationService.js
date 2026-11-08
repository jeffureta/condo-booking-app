/**
 * Notification Service for Condominium Booking System.
 * Dispatches automated transactional emails to guests and host.
 */

/**
 * Dispatches confirmation email to guest.
 *
 * @param {Object} data - Guest reservation details
 * @param {string} refId - Booking reference ID
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

  if (typeof MailApp !== 'undefined') {
    MailApp.sendEmail(data.guestEmail, subject, body);
  }
}

/**
 * Dispatches notification email to host.
 *
 * @param {Object} data - Guest reservation details
 * @param {string} refId - Booking reference ID
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

  if (typeof MailApp !== 'undefined') {
    MailApp.sendEmail(HOST_NOTIFICATION_EMAIL, subject, body);
  }
}
