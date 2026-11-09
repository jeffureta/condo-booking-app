/**
 * Local Development Server for condo-booking-app
 * 
 * Emulates Google Apps Script HtmlService template evaluation and
 * provides a mock implementation of window.google.script.run for
 * local in-browser development and automated E2E testing.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLatestAverageMarketPrice, getLatestDailyAggregate } from '../sqlite-pricing-reader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// In-memory mock storage for booked reservations
const mockBookings = [
  {
    from: getRelativeIsoDate(2),
    to: getRelativeIsoDate(4),
    title: 'Reserved Guest'
  },
  {
    from: getRelativeIsoDate(10),
    to: getRelativeIsoDate(13),
    title: 'Reserved Guest'
  }
];

function getRelativeIsoDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

/**
 * Builds the composite HTML mimicking GAS HtmlService.createTemplateFromFile
 */
function buildGasHtml() {
  const indexPath = path.join(ROOT_DIR, 'Index.html');
  const stylesPath = path.join(ROOT_DIR, 'Styles.html');
  const scriptsPath = path.join(ROOT_DIR, 'Scripts.html');

  let indexContent = fs.readFileSync(indexPath, 'utf8');
  const stylesContent = fs.existsSync(stylesPath) ? fs.readFileSync(stylesPath, 'utf8') : '';
  const scriptsContent = fs.existsSync(scriptsPath) ? fs.readFileSync(scriptsPath, 'utf8') : '';

  // Replace <?!= include('Styles'); ?> and <?!= include('Scripts'); ?>
  indexContent = indexContent.replace(/<\?!=\s*include\(['"]Styles['"]\);\s*\?>/g, stylesContent);
  indexContent = indexContent.replace(/<\?!=\s*include\(['"]Scripts['"]\);\s*\?>/g, scriptsContent);

  // In-browser mock for google.script.run matching BookingService.js contract:
  // - getBookedRanges()
  // - createBooking(payload)
  const mockGasScript = `
  <script>
    (function() {
      console.info('%c[GAS Mock Runtime Active]', 'background: #0284c7; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;', 'Local dev server active on http://localhost:${PORT}');

      window.google = window.google || {};
      window.google.script = window.google.script || {};
      window.ONLINE_AVERAGE_MARKET_RATE = ${getLatestAverageMarketPrice()};

      function GasRunner(successHandler, failureHandler) {
        this._successHandler = successHandler || function() {};
        this._failureHandler = failureHandler || function(err) { console.error('[GAS Mock Error]', err); };
      }

      GasRunner.prototype.withSuccessHandler = function(fn) {
        return new GasRunner(fn, this._failureHandler);
      };

      GasRunner.prototype.withFailureHandler = function(fn) {
        return new GasRunner(this._successHandler, fn);
      };

      GasRunner.prototype.getBookedRanges = function() {
        var self = this;
        fetch('/api/mock/booked-ranges')
          .then(function(res) { return res.json(); })
          .then(function(data) {
            setTimeout(function() { self._successHandler(data); }, 50);
          })
          .catch(function(err) {
            self._failureHandler(err.message || 'Failed to fetch booked dates');
          });
      };

      GasRunner.prototype.createBooking = function(payload) {
        var self = this;
        fetch('/api/mock/create-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function(res) { return res.json(); })
          .then(function(data) {
            setTimeout(function() {
              if (data.success === false) {
                self._successHandler(data);
              } else {
                self._successHandler(data);
              }
            }, 100);
          })
          .catch(function(err) {
            self._failureHandler(err.message || 'Network error processing booking');
          });
      };

      window.google.script.run = new GasRunner();
    })();
  </script>
  `;

  // Inject before closing </head>
  return indexContent.replace('</head>', `${mockGasScript}\n</head>`);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API endpoint for booked ranges
  if (url.pathname === '/api/mock/booked-ranges' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockBookings));
    return;
  }

  // API endpoint for live SQLite staycation pricing benchmark
  if (url.pathname === '/api/pricing-benchmark' && req.method === 'GET') {
    const aggregate = getLatestDailyAggregate();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      aggregate: aggregate,
      averagePrice: getLatestAverageMarketPrice(),
      undercutPrice: getLatestAverageMarketPrice() - 500
    }));
    return;
  }

  // API endpoint for creating bookings
  if (url.pathname === '/api/mock/create-booking' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        
        // Basic validation
        if (!payload.guestName || !payload.guestEmail || !payload.startDate || !payload.endDate) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Missing required reservation fields'
          }));
          return;
        }

        // Generate mock reference
        const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
        const referenceId = `CND-${randomHex}`;

        // Save into mockBookings
        mockBookings.push({
          from: payload.startDate,
          to: payload.endDate,
          title: `Reserved - ${payload.guestName}`
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          referenceId: referenceId,
          refId: referenceId,
          guestName: payload.guestName,
          guestEmail: payload.guestEmail,
          startDate: payload.startDate,
          endDate: payload.endDate,
          guestCount: payload.guestCount || 2,
          totalPrice: payload.clientQuote ? payload.clientQuote.totalPrice : 15000,
          pricing: payload.clientQuote || null,
          message: 'Booking successfully confirmed in local mock runtime'
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  // Reset mock endpoint (useful for test isolation)
  if (url.pathname === '/api/mock/reset' && req.method === 'POST') {
    mockBookings.length = 0;
    mockBookings.push(
      { from: getRelativeIsoDate(2), to: getRelativeIsoDate(4), title: 'Reserved Guest' },
      { from: getRelativeIsoDate(10), to: getRelativeIsoDate(13), title: 'Reserved Guest' }
    );
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'RESET_OK' }));
    return;
  }

  // Health check endpoint
  if (url.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', port: PORT }));
    return;
  }

  // Root or HTML serve
  if (url.pathname === '/' || url.pathname === '/index.html') {
    try {
      const html = buildGasHtml();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Internal Dev Server Error: ${err.message}`);
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`[Dev Server] Local Google Apps Script emulation server running at:`);
  console.log(`  > Local: http://localhost:${PORT}`);
  console.log(`  > Mock Bookings: http://localhost:${PORT}/api/mock/booked-ranges`);
});

export default server;
