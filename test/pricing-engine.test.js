import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  PROPERTY_INFO,
  getSeasonForDate,
  getHolidayOrEvent,
  calculateNightlyPrice,
  calculateStayQuote,
  formatPhp
} from '../pricing-engine.js';

describe('Zero-Latency Dynamic Pricing Engine (TDD)', () => {
  test('PROPERTY_INFO holds accurate property, unit, and capacity metadata', () => {
    assert.equal(PROPERTY_INFO.unitNumber, 'Unit 418');
    assert.equal(PROPERTY_INFO.condoName, 'Serin East Tagaytay');
    assert.ok(PROPERTY_INFO.fullAddress.includes('Unit 418 Serin East Tagaytay'));
    assert.ok(PROPERTY_INFO.fullAddress.includes('Brgy. Silang Crossing East'));
    assert.ok(PROPERTY_INFO.fullAddress.includes('Tagaytay City'));
    assert.ok(PROPERTY_INFO.fullAddress.includes('4120'));
    assert.equal(PROPERTY_INFO.competitorRadiusKm, 10);
    assert.equal(PROPERTY_INFO.baseGuestsIncluded, 4);
    assert.equal(PROPERTY_INFO.maxGuests, 6);
    assert.equal(PROPERTY_INFO.extraGuestFeePerNight, 400);
  });

  test('formatPhp formats numbers as Philippine Peso strings', () => {
    assert.equal(formatPhp(4500), '₱4,500');
    assert.equal(formatPhp(0), '₱0');
    assert.equal(formatPhp(12500), '₱12,500');
  });

  test('getSeasonForDate accurately classifies Tagaytay microclimate seasons', () => {
    // Amihan Cool season (Dec, Jan, Feb)
    const dec = getSeasonForDate('2026-12-15');
    assert.equal(dec.code, 'AMIHAN_COOL');
    assert.equal(dec.weekdayMultiplier, 1.10);
    assert.equal(dec.weekendMultiplier, 1.10);

    const jan = getSeasonForDate('2027-01-20');
    assert.equal(jan.code, 'AMIHAN_COOL');

    // Summer Escape season (Mar, Apr, May)
    const mar = getSeasonForDate('2026-03-10');
    assert.equal(mar.code, 'SUMMER_ESCAPE');
    assert.equal(mar.weekdayMultiplier, 1.05);

    // Habagat Rainy season (Jun - Oct)
    const jul = getSeasonForDate('2026-07-15');
    assert.equal(jul.code, 'HABAGAT_RAINY');
    assert.equal(jul.weekdayMultiplier, 0.90);
    assert.equal(jul.weekendMultiplier, 0.95);

    // Ber Shoulder season (Nov)
    const nov = getSeasonForDate('2026-11-12');
    assert.equal(nov.code, 'BER_SHOULDER');
    assert.equal(nov.weekdayMultiplier, 1.00);
    assert.equal(nov.weekendMultiplier, 1.00);
  });

  test('getHolidayOrEvent recognizes Philippine official holidays & Tagaytay peak dates', () => {
    // Christmas / New Year peak window
    assert.ok(getHolidayOrEvent('2026-12-25'));
    assert.ok(getHolidayOrEvent('2026-12-31'));
    assert.ok(getHolidayOrEvent('2027-01-01'));

    // Valentine's weekend in Tagaytay
    assert.ok(getHolidayOrEvent('2026-02-14'));

    // Holy Week 2026 (Apr 2 - 5)
    assert.ok(getHolidayOrEvent('2026-04-02'));
    assert.ok(getHolidayOrEvent('2026-04-03'));
    assert.ok(getHolidayOrEvent('2026-04-04'));

    // Undas (All Saints / All Souls window)
    assert.ok(getHolidayOrEvent('2026-11-01'));
    assert.ok(getHolidayOrEvent('2026-11-02'));

    // Regular non-holiday returns null
    assert.equal(getHolidayOrEvent('2026-11-18'), null);
  });

  test('calculateNightlyPrice ALWAYS enforces unitRate = marketRate - 500', () => {
    const testDates = [
      '2026-11-10', // Tue (Nov Ber Shoulder Weekday)
      '2026-11-13', // Fri (Nov Weekend)
      '2026-12-15', // Tue (Dec Amihan Weekday)
      '2026-12-19', // Sat (Dec Amihan Weekend)
      '2026-12-25', // Fri (Christmas Holiday Peak)
      '2026-04-03', // Fri (Good Friday Peak)
      '2026-07-14', // Tue (Jul Habagat Rainy Weekday)
      '2026-07-18', // Sat (Jul Habagat Rainy Weekend)
      '2027-01-01', // New Year Peak
      '2027-04-09'  // Araw ng Kagitingan
    ];

    for (const d of testDates) {
      const price = calculateNightlyPrice(d);
      assert.equal(price.savings, 500, `Savings for ${d} must be 500`);
      assert.equal(price.unitRate, price.marketRate - 500, `unitRate must equal marketRate - 500 for ${d}`);
      assert.ok(price.unitRate > 0, `unitRate must be positive for ${d}`);
    }
  });

  test('calculateNightlyPrice produces correct base numbers for benchmark tiers', () => {
    // Nov Weekday (1.00x multiplier): Market 5000 -> Unit 4500
    const novWeekday = calculateNightlyPrice('2026-11-11'); // Wednesday
    assert.equal(novWeekday.marketRate, 5000);
    assert.equal(novWeekday.unitRate, 4500);
    assert.equal(novWeekday.tier, 'WEEKDAY');

    // Nov Weekend (1.00x multiplier): Market 6200 -> Unit 5700
    const novWeekend = calculateNightlyPrice('2026-11-14'); // Saturday
    assert.equal(novWeekend.marketRate, 6200);
    assert.equal(novWeekend.unitRate, 5700);
    assert.equal(novWeekend.tier, 'WEEKEND');

    // Dec Amihan Weekday (1.10x multiplier): 5000 * 1.1 = 5500 -> Unit 5000
    const decWeekday = calculateNightlyPrice('2026-12-08'); // Tuesday (Feast of Immaculate Conception is holiday so test Dec 9)
    const decRegularWeekday = calculateNightlyPrice('2026-12-09'); // Wednesday
    assert.equal(decRegularWeekday.marketRate, 5500);
    assert.equal(decRegularWeekday.unitRate, 5000);

    // Holiday Peak: Market 8000 -> Unit 7500
    const christmas = calculateNightlyPrice('2026-12-25');
    assert.equal(christmas.marketRate, 8000);
    assert.equal(christmas.unitRate, 7500);
    assert.equal(christmas.tier, 'PEAK');
  });

  test('calculateStayQuote calculates total, multi-night discount, and extra guest fees', () => {
    // 2-night stay for 2 guests (no multi-night discount, no extra guest fee)
    // Nov 10 (Tue) + Nov 11 (Wed) => 4500 + 4500 = 9000
    // Market: 5000 + 5000 = 10000. Savings: 1000
    const quote2Nights = calculateStayQuote('2026-11-10', '2026-11-12', 2);
    assert.equal(quote2Nights.nights, 2);
    assert.equal(quote2Nights.guestCount, 2);
    assert.equal(quote2Nights.extraGuests, 0);
    assert.equal(quote2Nights.marketSubtotal, 10000);
    assert.equal(quote2Nights.baseUnitSubtotal, 9000);
    assert.equal(quote2Nights.competitorUndercutSavings, 1000);
    assert.equal(quote2Nights.longStayDiscountAmount, 0);
    assert.equal(quote2Nights.extraGuestFeeTotal, 0);
    assert.equal(quote2Nights.totalPrice, 9000);
    assert.equal(quote2Nights.totalSavingsVsMarket, 1000);

    // 4-night stay for 5 guests (5% multi-night discount, 1 extra guest @ 400/night)
    // Nov 10, 11, 12, 13 (Tue, Wed, Thu, Fri)
    // Unit rates: 4500, 4500, 4500, 5700 = 19200
    // 5% discount on 19200 = 960 => base after discount = 18240
    // Extra guest fee: 1 extra guest * 400 * 4 nights = 1600
    // Total price = 18240 + 1600 = 19840
    const quote4Nights5Guests = calculateStayQuote('2026-11-10', '2026-11-14', 5);
    assert.equal(quote4Nights5Guests.nights, 4);
    assert.equal(quote4Nights5Guests.extraGuests, 1);
    assert.equal(quote4Nights5Guests.baseUnitSubtotal, 19200);
    assert.equal(quote4Nights5Guests.longStayDiscountRate, 0.05);
    assert.equal(quote4Nights5Guests.longStayDiscountAmount, 960);
    assert.equal(quote4Nights5Guests.extraGuestFeeTotal, 1600);
    assert.equal(quote4Nights5Guests.totalPrice, 19840);

    // 7-night weekly stay (10% discount)
    const quote7Nights = calculateStayQuote('2026-11-10', '2026-11-17', 4);
    assert.equal(quote7Nights.nights, 7);
    assert.equal(quote7Nights.longStayDiscountRate, 0.10);
    assert.ok(quote7Nights.longStayDiscountAmount > 0);
  });
});
