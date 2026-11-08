/**
 * Pure domain logic and formatting helpers for Booking Service.
 * Exportable for Node.js unit tests and usable by Google Apps Script services.
 */

export function generateReferenceId() {
  return 'CND-' + Math.floor(1000 + Math.random() * 9000);
}

export function validateBookingPayload(data) {
  if (!data || !data.startDate || !data.endDate) {
    return { isValid: false, message: 'Missing start or end date.' };
  }
  const startDate = new Date(data.startDate + 'T15:00:00');
  const endDate = new Date(data.endDate + 'T11:00:00');

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { isValid: false, message: 'Invalid start or end dates provided.' };
  }

  if (endDate <= startDate) {
    return { isValid: false, message: 'Check-out date must be after check-in date.' };
  }

  return { isValid: true, startDate, endDate };
}

export function formatGuestEmail(data, refId) {
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

  return { subject, body };
}

export function formatHostEmail(data, refId) {
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

  return { subject, body };
}
