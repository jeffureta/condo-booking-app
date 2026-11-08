import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGoogleCalendarEmbedUrl,
  buildGoogleCalendarDirectLink,
  hasBookingConflict,
  validateBookingDates,
  formatCalendarEventPayload,
  generateMonthGrid,
  isDateBooked,
  isRangeConflicting,
  calculateSelectionRange,
  computeNights,
  mapBookingsToFullCalendarEvents,
  isSelectionAllowed,
  parseFullCalendarSelection,
  shouldTriggerInitialization,
  buildCalendarFallbackMarkup,
  createCalendarErrorMessage
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
      { from: '2026-11-10', to: '2026-11-11', title: 'Booking: Test Guest (2 guests) - Ref #CND-TEST' },
      { from: '2026-12-10', to: '2026-12-15', title: 'Confirmed Guest' },
      { from: '2026-12-24', to: '2026-12-28', title: 'Holiday Reservation' }
    ];

    // Conflict for Nov 10-11, 2026
    assert.equal(hasBookingConflict('2026-11-10', '2026-11-11', existingBookings), true);
    assert.equal(hasBookingConflict('2026-11-09', '2026-11-12', existingBookings), true);
    // Non-conflicting booking just before Nov 10
    assert.equal(hasBookingConflict('2026-11-08', '2026-11-10', existingBookings), false);
    // Non-conflicting booking just after Nov 11
    assert.equal(hasBookingConflict('2026-11-11', '2026-11-13', existingBookings), false);

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

  test('formatCalendarEventPayload formats event summary, timestamps, and description accurately', () => {
    const bookingData = {
      startDate: '2026-11-10',
      endDate: '2026-11-11',
      guestName: 'Test Guest',
      guestCount: '2',
      guestEmail: 'testguest@example.com',
      guestPhone: '+63 917 123 4567'
    };

    const payload = formatCalendarEventPayload(bookingData, 'CND-TEST', '+08:00');
    assert.equal(payload.summary, 'Booking: Test Guest (2 guests) - Ref #CND-TEST');
    assert.equal(payload.startRfc3339, '2026-11-10T15:00:00+08:00');
    assert.equal(payload.endRfc3339, '2026-11-11T11:00:00+08:00');
    assert.ok(payload.description.includes('Guest Name: Test Guest'));
    assert.ok(payload.description.includes('Booking Reference: CND-TEST'));
    assert.ok(payload.description.includes('Check-in: 2026-11-10'));
    assert.ok(payload.description.includes('Check-out: 2026-11-11'));
  });

  describe('Vanilla JS Calendar Grid Core (TDD)', () => {
    test('generateMonthGrid returns 42 calendar day cells for standard 6-week layout', () => {
      const grid = generateMonthGrid(2026, 10); // November 2026 (0-indexed month: 10)
      assert.equal(grid.length, 42);
      // Nov 1, 2026 is Sunday, so first day is Nov 1
      assert.equal(grid[0].isoDate, '2026-11-01');
      assert.equal(grid[0].isCurrentMonth, true);
      assert.equal(grid[0].dayNumber, 1);

      // Verify December padding at end
      const lastCell = grid[41];
      assert.equal(lastCell.isCurrentMonth, false);
      assert.ok(lastCell.isoDate.startsWith('2026-12'));
    });

    test('isDateBooked correctly identifies occupied dates', () => {
      const bookedRanges = [
        { from: '2026-11-10', to: '2026-11-13' },
        { from: '2026-11-20', to: '2026-11-22' }
      ];

      // Stay check-in Nov 10, guest stays night of 10, 11, 12, departs 11am on 13
      assert.equal(isDateBooked('2026-11-09', bookedRanges), false);
      assert.equal(isDateBooked('2026-11-10', bookedRanges), true);
      assert.equal(isDateBooked('2026-11-11', bookedRanges), true);
      assert.equal(isDateBooked('2026-11-12', bookedRanges), true);
      // Checkout day (Nov 13): available for incoming guest check-in at 3pm
      assert.equal(isDateBooked('2026-11-13', bookedRanges), false);
      assert.equal(isDateBooked('2026-11-14', bookedRanges), false);
    });

    test('isRangeConflicting checks whether requested stay crosses existing bookings', () => {
      const bookedRanges = [
        { from: '2026-11-10', to: '2026-11-13' }
      ];

      // Crossing booked range: conflict
      assert.equal(isRangeConflicting('2026-11-08', '2026-11-14', bookedRanges), true);
      assert.equal(isRangeConflicting('2026-11-11', '2026-11-12', bookedRanges), true);
      // Adjacent checkout day turnover: no conflict
      assert.equal(isRangeConflicting('2026-11-08', '2026-11-10', bookedRanges), false);
      assert.equal(isRangeConflicting('2026-11-13', '2026-11-16', bookedRanges), false);
    });

    test('calculateSelectionRange orders drag-backward or drag-forward selections', () => {
      // Forward drag
      const forward = calculateSelectionRange('2026-11-14', '2026-11-18');
      assert.equal(forward.checkIn, '2026-11-14');
      assert.equal(forward.checkOut, '2026-11-18');
      assert.equal(forward.nights, 4);

      // Backward drag
      const backward = calculateSelectionRange('2026-11-18', '2026-11-14');
      assert.equal(backward.checkIn, '2026-11-14');
      assert.equal(backward.checkOut, '2026-11-18');
      assert.equal(backward.nights, 4);

      // Same date clicked
      const same = calculateSelectionRange('2026-11-14', '2026-11-14');
      assert.equal(same.checkIn, '2026-11-14');
      assert.equal(same.checkOut, '2026-11-14');
      assert.equal(same.nights, 0);
    });

    test('computeNights computes accurate night counts', () => {
      assert.equal(computeNights('2026-11-10', '2026-11-11'), 1);
      assert.equal(computeNights('2026-11-10', '2026-11-15'), 5);
      assert.equal(computeNights('2026-11-30', '2026-12-02'), 2);
      assert.equal(computeNights('2026-11-10', '2026-11-10'), 0);
    });

    test('createCalendarErrorMessage formats user-friendly error with error code or message', () => {
      const errWithMsg = createCalendarErrorMessage(new Error('Network timeout'));
      assert.equal(errWithMsg, 'Unable to load dates: Network timeout. Please click Retry.');

      const stringErr = createCalendarErrorMessage('ScriptError');
      assert.equal(stringErr, 'Unable to load dates: ScriptError. Please click Retry.');

      const nullErr = createCalendarErrorMessage(null);
      assert.equal(nullErr, 'Unable to load live availability. Please click Retry.');
    });
  });

  describe('FullCalendar Data & Interaction Adapter (TDD)', () => {
    test('mapBookingsToFullCalendarEvents converts booked ranges into FullCalendar background and display events', () => {
      const bookedRanges = [
        { from: '2026-11-10', to: '2026-11-13', title: 'Confirmed Guest' }
      ];

      const events = mapBookingsToFullCalendarEvents(bookedRanges);
      assert.equal(events.length, 1);
      assert.equal(events[0].id, 'booking-2026-11-10');
      assert.equal(events[0].start, '2026-11-10');
      assert.equal(events[0].end, '2026-11-13');
      assert.equal(events[0].title, 'Booked');
      assert.equal(events[0].display, 'block');
      assert.equal(events[0].overlap, false);
      assert.ok(events[0].backgroundColor);
    });

    test('parseFullCalendarSelection extracts ISO date strings correctly for single and multi-night stays', () => {
      // FullCalendar selectInfo provides inclusive start and exclusive end for all-day selections
      const selectInfo = {
        startStr: '2026-11-15',
        endStr: '2026-11-18'
      };

      const result = parseFullCalendarSelection(selectInfo);
      assert.equal(result.checkIn, '2026-11-15');
      assert.equal(result.checkOut, '2026-11-18');
      assert.equal(result.nights, 3);
    });

    test('isSelectionAllowed rejects past dates, single-day clicks without checkout, and conflicting booked ranges', () => {
      const today = '2026-11-08';
      const bookedRanges = [
        { from: '2026-11-10', to: '2026-11-13' }
      ];

      // Past date selection: disallowed
      assert.equal(isSelectionAllowed({ startStr: '2026-11-05', endStr: '2026-11-07' }, bookedRanges, today), false);

      // Start date before today: disallowed
      assert.equal(isSelectionAllowed({ startStr: '2026-11-07', endStr: '2026-11-09' }, bookedRanges, today), false);

      // Valid open range before booking: allowed
      assert.equal(isSelectionAllowed({ startStr: '2026-11-08', endStr: '2026-11-10' }, bookedRanges, today), true);

      // Valid turnover start (checking in on same day previous guest checks out at 11am): allowed
      assert.equal(isSelectionAllowed({ startStr: '2026-11-13', endStr: '2026-11-16' }, bookedRanges, today), true);

      // Overlapping existing booking: disallowed
      assert.equal(isSelectionAllowed({ startStr: '2026-11-09', endStr: '2026-11-11' }, bookedRanges, today), false);
      assert.equal(isSelectionAllowed({ startStr: '2026-11-11', endStr: '2026-11-12' }, bookedRanges, today), false);
      assert.equal(isSelectionAllowed({ startStr: '2026-11-08', endStr: '2026-11-15' }, bookedRanges, today), false);
    });

    test('shouldTriggerInitialization evaluates document readyState correctly', () => {
      assert.equal(shouldTriggerInitialization('loading'), false);
      assert.equal(shouldTriggerInitialization('interactive'), true);
      assert.equal(shouldTriggerInitialization('complete'), true);
      assert.equal(shouldTriggerInitialization(undefined), false);
    });

    test('buildCalendarFallbackMarkup generates accessible iframe fallback when FullCalendar CDN fails', () => {
      const fallbackHtml = buildCalendarFallbackMarkup(CALENDAR_ID, 'Asia/Manila');
      assert.ok(fallbackHtml.includes('<iframe'));
      assert.ok(fallbackHtml.includes('calendar.google.com/calendar/embed'));
      assert.ok(fallbackHtml.includes(encodeURIComponent(CALENDAR_ID)));
      assert.ok(fallbackHtml.includes('title='));
    });
  });
});
