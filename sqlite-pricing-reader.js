import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export const DEFAULT_PRICING_DB_PATH =
  process.env.STAYCATION_PRICING_DB_PATH ||
  '/Users/jeffureta/repos/dynamic-staycation-pricing/staycation_prices.db';

export const FALLBACK_AVERAGE_MARKET_PRICE = 3840;

/**
 * Reads the latest daily aggregate record from staycation_prices.db.
 *
 * @param {string} [dbPath]
 * @returns {Object|null}
 */
export function getLatestDailyAggregate(dbPath = DEFAULT_PRICING_DB_PATH) {
  if (!dbPath || !fs.existsSync(dbPath)) {
    return null;
  }

  try {
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      const stmt = db.prepare(`
        SELECT id, date, platform, listing_count, average_price, median_price,
               min_price, max_price, search_center, radius_km
        FROM daily_aggregates
        ORDER BY date DESC, id DESC
        LIMIT 1
      `);
      const row = stmt.get();
      return row ? { ...row } : null;
    } finally {
      db.close();
    }
  } catch (err) {
    return null;
  }
}

/**
 * Returns the rounded latest average market price from SQLite, or fallback.
 *
 * @param {string} [dbPath]
 * @param {number} [fallbackPrice]
 * @returns {number}
 */
export function getLatestAverageMarketPrice(
  dbPath = DEFAULT_PRICING_DB_PATH,
  fallbackPrice = FALLBACK_AVERAGE_MARKET_PRICE
) {
  try {
    const aggregate = getLatestDailyAggregate(dbPath);
    if (aggregate && typeof aggregate.average_price === 'number' && aggregate.average_price > 0) {
      return Math.round(aggregate.average_price);
    }
  } catch {
    // Fallback on error
  }
  return fallbackPrice;
}
