/**
 * Pure domain logic and formatting helpers for Booking Service.
 * Exportable for Node.js unit tests and usable by Google Apps Script services.
 */

import { calculateStayQuote, formatPhp, PROPERTY_INFO } from './pricing-engine.js';

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
  const quote = calculateStayQuote(data.startDate, data.endDate, data.guestCount);
  const totalStr = quote ? formatPhp(quote.totalPrice) : 'N/A';
  const savingsStr = quote ? formatPhp(quote.totalSavingsVsMarket) : '₱0';
  const marketSubStr = quote ? formatPhp(quote.marketSubtotal) : 'N/A';

  const subject = `Reservation Confirmed: Unit 418 Serin East Tagaytay (Ref #${refId})`;
  const body = `Hi ${data.guestName},\n\n`
    + `Thank you for your reservation! Your staycation booking for Unit 418 Serin East Tagaytay is confirmed.\n\n`
    + `Accommodation Details:\n`
    + `-------------------------------------\n`
    + `Property: ${PROPERTY_INFO.unitNumber} • ${PROPERTY_INFO.condoName}\n`
    + `Address: ${PROPERTY_INFO.fullAddress}\n`
    + `Booking Reference: ${refId}\n`
    + `Check-in Date: ${data.startDate} (3:00 PM)\n`
    + `Check-out Date: ${data.endDate} (11:00 AM)\n`
    + `Number of Guests: ${data.guestCount}\n`
    + `-------------------------------------\n\n`
    + `Pricing & Staycation Savings Breakdown:\n`
    + `-------------------------------------\n`
    + `10km Market Benchmark: ${marketSubStr}\n`
    + `Guaranteed Competitor Savings: -${savingsStr} (-₱500/night dynamic discount)\n`
    + (quote && quote.longStayDiscountAmount > 0 ? `Multi-Night Staycation Discount: -${formatPhp(quote.longStayDiscountAmount)} (${quote.longStayDiscountLabel})\n` : '')
    + (quote && quote.extraGuestFeeTotal > 0 ? `Extra Guest Fee (5-6 pax): +${formatPhp(quote.extraGuestFeeTotal)}\n` : '')
    + `Total Confirmed Amount: ${totalStr}\n`
    + `-------------------------------------\n\n`
    + `We look forward to hosting your Tagaytay staycation. Please feel free to reply directly to this email with any questions.\n\n`
    + `Warm regards,\nUnit 418 Host`;

  return { subject, body };
}

export function formatHostEmail(data, refId) {
  const quote = calculateStayQuote(data.startDate, data.endDate, data.guestCount);
  const totalStr = quote ? formatPhp(quote.totalPrice) : 'N/A';
  const savingsStr = quote ? formatPhp(quote.totalSavingsVsMarket) : '₱0';

  const subject = `New Booking Received: ${data.guestName} (Ref #${refId})`;
  const body = `A new staycation reservation was just completed via the direct booking portal.\n\n`
    + `Property: ${PROPERTY_INFO.unitNumber} • ${PROPERTY_INFO.condoName}\n`
    + `Address: ${PROPERTY_INFO.fullAddress}\n\n`
    + `Guest Details:\n`
    + `Name: ${data.guestName}\n`
    + `Email: ${data.guestEmail}\n`
    + `Phone: ${data.guestPhone}\n`
    + `Guests: ${data.guestCount}\n`
    + `Dates: ${data.startDate} to ${data.endDate}\n`
    + `Reference ID: ${refId}\n\n`
    + `Pricing Breakdown:\n`
    + `Total Amount: ${totalStr}\n`
    + `Guest Savings vs 10km Market: ${savingsStr}\n\n`
    + `This booking has been added to your Google Calendar.`;

  return { subject, body };
}
