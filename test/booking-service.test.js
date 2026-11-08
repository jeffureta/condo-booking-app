import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateReferenceId,
  formatGuestEmail,
  formatHostEmail,
  validateBookingPayload
} from '../booking-service-core.js';

describe('Booking Service Domain Logic (TDD)', () => {
  test('generateReferenceId returns unique reference ID in CND-XXXX format', () => {
    const id1 = generateReferenceId();
    const id2 = generateReferenceId();
    assert.match(id1, /^CND-\d{4}$/);
    assert.match(id2, /^CND-\d{4}$/);
  });

  test('validateBookingPayload catches missing or invalid booking fields', () => {
    const valid = validateBookingPayload({
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      guestName: 'Alice Guo',
      guestEmail: 'alice@example.com',
      guestPhone: '09171234567',
      guestCount: 2
    });
    assert.equal(valid.isValid, true);

    const invalidDates = validateBookingPayload({
      startDate: 'invalid',
      endDate: '2026-12-05',
      guestName: 'Alice',
      guestEmail: 'alice@example.com',
      guestPhone: '123'
    });
    assert.equal(invalidDates.isValid, false);
    assert.match(invalidDates.message, /invalid start or end dates/i);
  });

  test('formatGuestEmail generates clear confirmation email with reference ID and check-in times', () => {
    const data = {
      guestName: 'Maria Santos',
      guestEmail: 'maria@example.com',
      startDate: '2026-12-20',
      endDate: '2026-12-23',
      guestCount: 4
    };
    const { subject, body } = formatGuestEmail(data, 'CND-9988');
    assert.ok(subject.includes('CND-9988'));
    assert.ok(body.includes('Maria Santos'));
    assert.ok(body.includes('Check-in Date: 2026-12-20 (3:00 PM)'));
    assert.ok(body.includes('Check-out Date: 2026-12-23 (11:00 AM)'));
    assert.ok(body.includes('Number of Guests: 4'));
  });

  test('formatHostEmail generates clear host notification email', () => {
    const data = {
      guestName: 'Maria Santos',
      guestEmail: 'maria@example.com',
      guestPhone: '+63 917 555 1234',
      startDate: '2026-12-20',
      endDate: '2026-12-23',
      guestCount: 4
    };
    const { subject, body } = formatHostEmail(data, 'CND-9988');
    assert.ok(subject.includes('CND-9988'));
    assert.ok(body.includes('Maria Santos'));
    assert.ok(body.includes('+63 917 555 1234'));
    assert.ok(body.includes('Dates: 2026-12-20 to 2026-12-23'));
  });
});
