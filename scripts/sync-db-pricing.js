#!/usr/bin/env node
/**
 * Synchronizes the latest average staycation price from staycation_prices.db
 * into BookingService.js, BookingService.gs, and Scripts.html.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLatestAverageMarketPrice } from '../sqlite-pricing-reader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const latestAvg = getLatestAverageMarketPrice();
console.log(`[Pricing Sync] Latest online average staycation rate: ₱${latestAvg.toLocaleString('en-US')}`);
console.log(`[Pricing Sync] Unit 418 guaranteed undercut (-₱500): ₱${(latestAvg - 500).toLocaleString('en-US')}`);

const filesToUpdate = [
  path.join(ROOT_DIR, 'BookingService.js'),
  path.join(ROOT_DIR, 'BookingService.gs'),
  path.join(ROOT_DIR, 'Scripts.html')
];

for (const filePath of filesToUpdate) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace var ONLINE_AVERAGE_MARKET_RATE = <number>;
  const updated = content.replace(
    /var\s+ONLINE_AVERAGE_MARKET_RATE\s*=\s*\d+;/g,
    `var ONLINE_AVERAGE_MARKET_RATE = ${latestAvg};`
  );

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`[Pricing Sync] Updated ${path.basename(filePath)} with rate ${latestAvg}`);
  } else {
    console.log(`[Pricing Sync] ${path.basename(filePath)} already up-to-date (${latestAvg})`);
  }
}

console.log('[Pricing Sync] Complete.');
