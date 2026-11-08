import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGoogleCalendarEmbedUrl,
  buildGoogleCalendarDirectLink,
  hasBookingConflict,
  validateBookingDates
} from '../calendar-utils.js';

describe('Google Calendar Embed & Integration Logic', () => {
  const CALENDAR_ID = '5e250418f97d2008bff93cc10a638b2aabe981af2d5e271b058eb8835dde2ae2@group.calendar.google.com';

  test('buildGoogleCalendarEmbedUrl creates an accessible iframe embed URL with timezone and parameters', () => {
    const url = buildGoogleCalendarEmbedUrl(CALENDAR_ID, 'Asia/Manila');
    assert.match(url, /^https:\/\/calendar\.google\.com\/calendar\/embed\?/);
    assert.ok(url.includes(`src=${encodeURIComponent(CALENDAR_ID)}`));
    assert.ok(url.includes('ctz=Asia%2FManila'));
    assert.ok(url.includes('showTitle=0'));
    assert.ok(url.includes('showNav=1'));
    assert.ok(url.includes('showPrint=0'));
    assert.ok(url.includes('showCalendars=0'));
  });

  test('buildGoogleCalendarDirectLink creates direct viewable link for visitors', () => {
    const directLink = buildGoogleCalendarDirectLink(CALENDAR_ID);
    assert.match(directLink, /^https:\/\/calendar\.google\.com\/calendar\/u\/0\/r\?cid=/);
    assert.ok(directLink.includes(encodeURIComponent(CALENDAR_ID)));
  });

  test('hasBookingConflict correctly flags overlap with existing reservations', () => {
    const existingBookings = [
      { from: '2026-12-10', to: '2026-12-15', title: 'Confirmed Guest' },
      { from: '2026-12-24', to: '2026-12-28', title: 'Holiday Reservation' }
    ];

    // Conflict overlapping middle
    assert.equal(hasBookingConflict('2026-12-12', '2026-12-14', existingBookings), true);
    // Conflict overlapping start
    assert.equal(hasBookingConflict('2026-12-08', '2026-12-11', existingBookings), true);
    // Conflict encompassing range
    assert.equal(hasBookingConflict('2026-12-05', '2026-12-20', existingBookings), true);

    // Non-conflicting booking before
    assert.equal(hasBookingConflict('2026-12-01', '2026-12-09', existingBookings), false);
    // Non-conflicting booking between
    assert.equal(hasBookingConflict('2026-12-16', '2026-12-23', existingBookings), false);
    // Non-conflicting booking after
    assert.equal(hasBookingConflict('2026-12-29', '2026-12-31', existingBookings), false);
  });

  test('validateBookingDates enforces valid check-in and check-out rules', () => {
    const valid = validateBookingDates('2026-12-01', '2026-12-05', '2026-11-08');
    assert.equal(valid.isValid, true);
    assert.equal(valid.error, null);

    // End date before or equal to start date
    const sameDay = validateBookingDates('2026-12-01', '2026-12-01', '2026-11-08');
    assert.equal(sameDay.isValid, false);
    assert.match(sameDay.error, /Check-out date must be after check-in date/i);

    // Past date check
    const inPast = validateBookingDates('2026-11-01', '2026-11-05', '2026-11-08');
    assert.equal(inPast.isValid, false);
    assert.match(inPast.error, /Check-in date cannot be in the past/i);
  });
});
