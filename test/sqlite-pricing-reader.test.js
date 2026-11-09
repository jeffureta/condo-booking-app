import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import {
  DEFAULT_PRICING_DB_PATH,
  FALLBACK_AVERAGE_MARKET_PRICE,
  getLatestDailyAggregate,
  getLatestAverageMarketPrice
} from '../sqlite-pricing-reader.js';

describe('SQLite Staycation Pricing Reader (TDD)', () => {
  test('constants have expected defaults', () => {
    assert.equal(FALLBACK_AVERAGE_MARKET_PRICE, 3840);
    assert.ok(DEFAULT_PRICING_DB_PATH.includes('staycation_prices.db'));
  });

  test('getLatestDailyAggregate returns latest record from live staycation_prices.db', () => {
    const aggregate = getLatestDailyAggregate();
    assert.ok(aggregate !== null, 'Aggregate should not be null when db exists');
    assert.equal(typeof aggregate.average_price, 'number');
    assert.equal(aggregate.average_price, 3840.0);
    assert.equal(aggregate.platform, 'all');
    assert.equal(aggregate.listing_count, 5);
  });

  test('getLatestAverageMarketPrice extracts rounded average price from database', () => {
    const price = getLatestAverageMarketPrice();
    assert.equal(price, 3840);
  });

  test('getLatestDailyAggregate orders by date DESC correctly in an isolated database', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sqlite-pricing-test-'));
    const tmpDbPath = path.join(tmpDir, 'test_prices.db');

    const db = new DatabaseSync(tmpDbPath);
    db.exec(`
      CREATE TABLE daily_aggregates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        platform TEXT NOT NULL,
        listing_count INTEGER NOT NULL,
        average_price REAL NOT NULL,
        median_price REAL NOT NULL,
        min_price REAL NOT NULL,
        max_price REAL NOT NULL,
        search_center TEXT NOT NULL,
        radius_km REAL NOT NULL,
        UNIQUE(date, platform)
      );
      INSERT INTO daily_aggregates (date, platform, listing_count, average_price, median_price, min_price, max_price, search_center, radius_km)
      VALUES
        ('2026-11-01', 'all', 4, 3500.0, 3500.0, 3000.0, 4000.0, 'East Serin Tagaytay', 10.0),
        ('2026-11-09', 'all', 5, 3840.0, 3800.0, 3200.0, 4500.0, 'East Serin Tagaytay', 10.0);
    `);
    db.close();

    const latest = getLatestDailyAggregate(tmpDbPath);
    assert.ok(latest);
    assert.equal(latest.date, '2026-11-09');
    assert.equal(latest.average_price, 3840.0);

    const price = getLatestAverageMarketPrice(tmpDbPath);
    assert.equal(price, 3840);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('getLatestAverageMarketPrice falls back gracefully if db does not exist', () => {
    const fallback = getLatestAverageMarketPrice('/path/to/nonexistent/db.sqlite', 4000);
    assert.equal(fallback, 4000);

    const defaultFallback = getLatestAverageMarketPrice('/path/to/nonexistent/db.sqlite');
    assert.equal(defaultFallback, 3840);
  });
});
