/**
 * Zero-Latency Deterministic Dynamic Pricing Engine for Unit 418 Serin East Tagaytay.
 * Pure ES Module logic without external API dependencies.
 */

export const PROPERTY_INFO = {
  unitNumber: 'Unit 418',
  condoName: 'Serin East Tagaytay',
  fullAddress: 'Unit 418 Serin East Tagaytay, Brgy. Silang Crossing East, Tagaytay City, Cavite, 4120, Philippines',
  competitorRadiusKm: 10,
  baseGuestsIncluded: 4,
  maxGuests: 6,
  extraGuestFeePerNight: 400
};

export const BASE_MARKET_RATES = {
  WEEKDAY: 5000,
  WEEKEND: 6200,
  PEAK: 8000
};

export const COMPETITOR_UNDERCUT_PHP = 500;

export const SEASONS = {
  AMIHAN_COOL: {
    code: 'AMIHAN_COOL',
    label: 'Cool Amihan Season (17–24°C)',
    weatherSummary: 'Northeast monsoon brings cool breezes, crisp mornings, and clear Taal views.',
    weekdayMultiplier: 1.10,
    weekendMultiplier: 1.10
  },
  SUMMER_ESCAPE: {
    code: 'SUMMER_ESCAPE',
    label: 'Dry Summer Escape',
    weatherSummary: 'Warm sunny weather; prime ridge escape from Metro Manila heat.',
    weekdayMultiplier: 1.05,
    weekendMultiplier: 1.05
  },
  BER_SHOULDER: {
    code: 'BER_SHOULDER',
    label: 'Ber-Months Shoulder Season',
    weatherSummary: 'Pleasant cool weather leading into the holiday rush.',
    weekdayMultiplier: 1.00,
    weekendMultiplier: 1.00
  },
  HABAGAT_RAINY: {
    code: 'HABAGAT_RAINY',
    label: 'Habagat Cozy Rainy Season',
    weatherSummary: 'Southwest monsoon, misty mountain fog, and cozy staycation weather.',
    weekdayMultiplier: 0.90,
    weekendMultiplier: 0.95
  }
};

/**
 * Hardcoded Philippine Holidays & Tagaytay Peak Events (2026-2027)
 * Maps exact ISO date strings (YYYY-MM-DD) or recurring dates (MM-DD)
 */
export const PH_HOLIDAYS_AND_EVENTS = {
  // Recurring / Fixed
  '01-01': 'New Year\'s Day',
  '02-14': 'Valentine\'s Day Staycation Peak',
  '04-09': 'Araw ng Kagitingan (Day of Valor)',
  '05-01': 'Labor Day',
  '06-12': 'Independence Day',
  '08-21': 'Ninoy Aquino Day',
  '11-01': 'All Saints\' Day (Undas)',
  '11-02': 'All Souls\' Day',
  '11-30': 'Bonifacio Day',
  '12-08': 'Feast of the Immaculate Conception',
  '12-24': 'Christmas Eve',
  '12-25': 'Christmas Day',
  '12-30': 'Rizal Day',
  '12-31': 'Last Day of the Year',

  // 2026 Specific
  '2026-02-13': 'Valentine\'s Weekend Eve',
  '2026-02-15': 'Valentine\'s Weekend',
  '2026-02-16': 'Chinese New Year Eve',
  '2026-02-17': 'Chinese New Year',
  '2026-03-20': 'Eid\'l Fitr',
  '2026-04-02': 'Maundy Thursday (Holy Week)',
  '2026-04-03': 'Good Friday (Holy Week)',
  '2026-04-04': 'Black Saturday (Holy Week)',
  '2026-04-05': 'Easter Sunday',
  '2026-05-02': 'Labor Day Long Weekend',
  '2026-05-03': 'Labor Day Long Weekend',
  '2026-05-27': 'Eid\'l Adha',
  '2026-06-13': 'Independence Day Long Weekend',
  '2026-06-14': 'Independence Day Long Weekend',
  '2026-08-22': 'Ninoy Aquino Long Weekend',
  '2026-08-23': 'Ninoy Aquino Long Weekend',
  '2026-08-29': 'National Heroes Long Weekend',
  '2026-08-30': 'National Heroes Long Weekend',
  '2026-08-31': 'National Heroes Day',
  '2026-10-31': 'Undas Weekend',
  '2026-11-28': 'Bonifacio Long Weekend',
  '2026-11-29': 'Bonifacio Long Weekend',
  '2026-12-20': 'Christmas Holiday Season Peak',
  '2026-12-21': 'Christmas Holiday Season Peak',
  '2026-12-22': 'Christmas Holiday Season Peak',
  '2026-12-23': 'Christmas Holiday Season Peak',
  '2026-12-26': 'Christmas Holiday Season Peak',
  '2026-12-27': 'Christmas Holiday Season Peak',
  '2026-12-28': 'Christmas Holiday Season Peak',
  '2026-12-29': 'Christmas Holiday Season Peak',

  // 2027 Specific
  '2027-01-02': 'New Year Long Weekend Peak',
  '2027-01-03': 'New Year Long Weekend Peak',
  '2027-02-05': 'Chinese New Year Eve',
  '2027-02-06': 'Chinese New Year',
  '2027-02-07': 'Chinese New Year Weekend',
  '2027-02-13': 'Valentine\'s Weekend',
  '2027-02-15': 'Valentine\'s Weekend',
  '2027-03-25': 'Maundy Thursday (Holy Week)',
  '2027-03-26': 'Good Friday (Holy Week)',
  '2027-03-27': 'Black Saturday (Holy Week)',
  '2027-03-28': 'Easter Sunday',
  '2027-04-10': 'Araw ng Kagitingan Long Weekend',
  '2027-04-11': 'Araw ng Kagitingan Long Weekend',
  '2027-08-28': 'National Heroes Long Weekend',
  '2027-08-29': 'National Heroes Long Weekend',
  '2027-08-30': 'National Heroes Day',
  '2027-10-30': 'Undas Long Weekend',
  '2027-10-31': 'Undas Long Weekend',
  '2027-12-20': 'Christmas Holiday Season Peak',
  '2027-12-21': 'Christmas Holiday Season Peak',
  '2027-12-22': 'Christmas Holiday Season Peak',
  '2027-12-23': 'Christmas Holiday Season Peak',
  '2027-12-26': 'Christmas Holiday Season Peak',
  '2027-12-27': 'Christmas Holiday Season Peak',
  '2027-12-28': 'Christmas Holiday Season Peak',
  '2027-12-29': 'Christmas Holiday Season Peak'
};

export function formatPhp(amount) {
  return '₱' + Math.round(amount).toLocaleString('en-US');
}

export function getSeasonForDate(dateStr) {
  const month = parseInt(dateStr.slice(5, 7), 10); // 1 to 12
  if (month === 12 || month === 1 || month === 2) {
    return SEASONS.AMIHAN_COOL;
  }
  if (month >= 3 && month <= 5) {
    return SEASONS.SUMMER_ESCAPE;
  }
  if (month === 11) {
    return SEASONS.BER_SHOULDER;
  }
  return SEASONS.HABAGAT_RAINY; // Jun to Oct
}

export function getHolidayOrEvent(dateStr) {
  if (PH_HOLIDAYS_AND_EVENTS[dateStr]) {
    return PH_HOLIDAYS_AND_EVENTS[dateStr];
  }
  const mmDd = dateStr.slice(5, 10);
  if (PH_HOLIDAYS_AND_EVENTS[mmDd]) {
    return PH_HOLIDAYS_AND_EVENTS[mmDd];
  }
  return null;
}

export function calculateNightlyPrice(dateStr) {
  const holiday = getHolidayOrEvent(dateStr);
  const season = getSeasonForDate(dateStr);
  const dateObj = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, ... 5 = Fri, 6 = Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

  let tier = 'WEEKDAY';
  let tierLabel = 'Weekday';
  let baseMarketRate = BASE_MARKET_RATES.WEEKDAY;
  let multiplier = season.weekdayMultiplier;

  if (holiday) {
    tier = 'PEAK';
    tierLabel = holiday;
    baseMarketRate = BASE_MARKET_RATES.PEAK;
    multiplier = 1.0; // Holiday peak rate is already premium
  } else if (isWeekend) {
    tier = 'WEEKEND';
    tierLabel = 'Weekend';
    baseMarketRate = BASE_MARKET_RATES.WEEKEND;
    multiplier = season.weekendMultiplier;
  }

  // Calculate market rate rounded to nearest 50
  const adjustedMarket = Math.round((baseMarketRate * multiplier) / 50) * 50;
  // Unit 418 rate is strictly 500 PHP below the 10km market benchmark
  const unitRate = adjustedMarket - COMPETITOR_UNDERCUT_PHP;

  return {
    dateStr,
    tier,
    tierLabel,
    seasonCode: season.code,
    seasonLabel: season.label,
    weatherSummary: season.weatherSummary,
    holidayName: holiday,
    marketRate: adjustedMarket,
    unitRate,
    savings: COMPETITOR_UNDERCUT_PHP
  };
}

export function calculateStayQuote(checkInStr, checkOutStr, guestCount = 2) {
  if (!checkInStr || !checkOutStr || checkOutStr <= checkInStr) {
    return null;
  }

  const inDate = new Date(checkInStr + 'T00:00:00');
  const outDate = new Date(checkOutStr + 'T00:00:00');
  const nights = Math.max(0, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));

  if (nights === 0) return null;

  const validGuestCount = Math.min(6, Math.max(1, parseInt(guestCount, 10) || 2));
  const extraGuests = Math.max(0, validGuestCount - PROPERTY_INFO.baseGuestsIncluded);

  const nightlyBreakdown = [];
  let marketSubtotal = 0;
  let baseUnitSubtotal = 0;

  for (let i = 0; i < nights; i++) {
    const cur = new Date(inDate.getTime() + i * (24 * 60 * 60 * 1000));
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const nightly = calculateNightlyPrice(dateStr);
    nightlyBreakdown.push(nightly);
    marketSubtotal += nightly.marketRate;
    baseUnitSubtotal += nightly.unitRate;
  }

  // Multi-night discount on unit subtotal
  let longStayDiscountRate = 0;
  let longStayDiscountLabel = null;
  if (nights >= 7) {
    longStayDiscountRate = 0.10;
    longStayDiscountLabel = 'Weekly Staycation Discount (10% Off)';
  } else if (nights >= 3) {
    longStayDiscountRate = 0.05;
    longStayDiscountLabel = 'Extended Staycation Discount (5% Off)';
  }

  const longStayDiscountAmount = Math.round(baseUnitSubtotal * longStayDiscountRate);
  const extraGuestFeeTotal = extraGuests * PROPERTY_INFO.extraGuestFeePerNight * nights;
  const totalPrice = baseUnitSubtotal - longStayDiscountAmount + extraGuestFeeTotal;
  const competitorUndercutSavings = COMPETITOR_UNDERCUT_PHP * nights;
  const totalSavingsVsMarket = competitorUndercutSavings + longStayDiscountAmount;
  const averageNightlyRate = Math.round(totalPrice / nights);

  return {
    propertyInfo: PROPERTY_INFO,
    checkIn: checkInStr,
    checkOut: checkOutStr,
    nights,
    guestCount: validGuestCount,
    extraGuests,
    marketSubtotal,
    baseUnitSubtotal,
    competitorUndercutSavings,
    longStayDiscountRate,
    longStayDiscountAmount,
    longStayDiscountLabel,
    extraGuestFeePerNight: PROPERTY_INFO.extraGuestFeePerNight,
    extraGuestFeeTotal,
    totalPrice,
    totalSavingsVsMarket,
    averageNightlyRate,
    nightlyBreakdown
  };
}
