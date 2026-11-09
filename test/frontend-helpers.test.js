import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml,
  buildGoogleCalendarTemplateUrl,
  buildIcsContent,
  validateGuestFormPayload,
  FULL_CONDO_ADDRESS
} from '../calendar-utils.js';

describe('Frontend Helper & Client Logic (TDD)', () => {
  test('escapeHtml safely sanitizes potentially dangerous HTML characters', () => {
    const raw = `<script>alert('xss')</script> & "hello" 'world'`;
    const escaped = escapeHtml(raw);
    assert.equal(escaped, '&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt; &amp; &quot;hello&quot; &#39;world&#39;');
    assert.equal(escapeHtml(123), '123');
    assert.equal(escapeHtml(''), '');
  });

  test('buildGoogleCalendarTemplateUrl constructs proper web Google Calendar link with Unit 418 address and pricing', () => {
    const url = buildGoogleCalendarTemplateUrl('REF123', '2026-12-01', '2026-12-05', 20000);
    assert.ok(url.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE'));
    assert.ok(url.includes('dates=20261201T150000%2F20261205T110000') || url.includes('dates=20261201T150000/20261205T110000'));
    assert.ok(url.includes('REF123'));
    assert.ok(url.includes('Unit%20418') || url.includes('Unit 418'));
    assert.ok(url.includes('Serin%20East%20Tagaytay') || url.includes('Serin East Tagaytay'));
    assert.ok(url.includes('Silang%20Crossing%20East') || url.includes('Silang Crossing East'));
    assert.ok(url.includes('4120'));
  });

  test('buildIcsContent generates valid RFC 5545 iCalendar data with full Unit 418 details', () => {
    const reservation = {
      referenceId: 'CND-8822',
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      guestName: 'Jane Doe',
      guestCount: 2,
      totalPrice: 20000
    };

    const ics = buildIcsContent(reservation);
    assert.ok(ics.includes('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('VERSION:2.0'));
    assert.ok(ics.includes('BEGIN:VEVENT'));
    assert.ok(ics.includes('UID:condo-CND-8822@booking.local'));
    assert.ok(ics.includes('DTSTART:20261201T150000'));
    assert.ok(ics.includes('DTEND:20261205T110000'));
    assert.ok(ics.includes('SUMMARY:Staycation: Unit 418 Serin East Tagaytay (Ref #CND-8822)'));
    assert.ok(ics.includes(FULL_CONDO_ADDRESS));
    assert.ok(ics.includes('Total: ₱20,000'));
    assert.ok(ics.includes('END:VEVENT'));
    assert.ok(ics.includes('END:VCALENDAR'));
  });

  test('validateGuestFormPayload validates contact details correctly', () => {
    const valid = validateGuestFormPayload({
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      guestName: 'John Smith',
      guestEmail: 'john@example.com',
      guestPhone: '09171234567',
      guestCount: 2
    });
    assert.equal(valid.isValid, true);
    assert.equal(valid.error, null);

    const missingContact = validateGuestFormPayload({
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      guestName: 'John',
      guestEmail: '',
      guestPhone: '123',
      guestCount: 1
    });
    assert.equal(missingContact.isValid, false);
    assert.match(missingContact.error, /contact details/i);
  });
});
