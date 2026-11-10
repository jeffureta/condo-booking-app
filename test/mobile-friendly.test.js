import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const SCRIPTS_PATH = path.resolve('Scripts.html');
const STYLES_PATH = path.resolve('Styles.html');
const INDEX_PATH = path.resolve('Index.html');
const CODE_JS_PATH = path.resolve('Code.js');
const CODE_GS_PATH = path.resolve('Code.gs');

function simulateHtmlServicePreprocess(rawContent) {
  const match = rawContent.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i);
  const code = match ? match[1] : rawContent;

  return code.replace(
    /(\/(?![\/*])(?:\\.|[^\/\\\r\n])+\/[gimsuy]*)|("(?:\\.|[^"\\\r\n])*")|('(?:\\.|[^'\\\r\n])*')|(\/\*[\s\S]*?\*\/)|(\/\/.*$)/gm,
    (match, regex, dQuote, sQuote) => {
      if (regex || dQuote || sQuote) return match;
      return '';
    }
  );
}

describe('Mobile-Friendly UI & TDD Engine Contracts', () => {
  const rawHtml = fs.readFileSync(SCRIPTS_PATH, 'utf8');
  const rawStyles = fs.readFileSync(STYLES_PATH, 'utf8');
  const rawIndex = fs.readFileSync(INDEX_PATH, 'utf8');
  const rawCodeJs = fs.readFileSync(CODE_JS_PATH, 'utf8');
  const rawCodeGs = fs.readFileSync(CODE_GS_PATH, 'utf8');

  describe('Viewport and CSS Static Contracts', () => {
    test('Index.html, Code.js, and Code.gs include viewport-fit=cover', () => {
      assert.match(rawIndex, /viewport-fit=cover/, 'Index.html must have viewport-fit=cover');
      assert.match(rawCodeJs, /viewport-fit=cover/, 'Code.js must have viewport-fit=cover');
      assert.match(rawCodeGs, /viewport-fit=cover/, 'Code.gs must have viewport-fit=cover');
    });

    test('Styles.html sets 16px font-size on inputs and select to avoid iOS Safari zoom', () => {
      // input, select rule check
      assert.match(rawStyles, /input,\s*select\s*\{[^}]*font-size:\s*16px/s, 'input, select must use font-size: 16px');
      assert.match(rawStyles, /\.ai-chat-input\s*\{[^}]*font-size:\s*16px/s, '.ai-chat-input must use font-size: 16px');
    });

    test('Styles.html enforces >= 44px on calendar nav buttons and pan-y manipulation on grid', () => {
      assert.match(rawStyles, /\.cal-nav-btn\s*\{[^}]*width:\s*44px/s, '.cal-nav-btn width must be 44px');
      assert.match(rawStyles, /\.cal-nav-btn\s*\{[^}]*height:\s*44px/s, '.cal-nav-btn height must be 44px');
      assert.match(rawStyles, /\.cal-days-grid\s*\{[^}]*touch-action:\s*pan-y\s+manipulation/s, 'cal-days-grid must have touch-action: pan-y manipulation');
    });

    test('Styles.html has mobile drawer with 100dvh and safe area insets', () => {
      assert.match(rawStyles, /100dvh/, 'Styles.html should declare 100dvh for modern mobile viewports');
      assert.match(rawStyles, /env\(safe-area-inset-bottom/, 'Styles.html should handle safe area bottom inset');
    });
  });

  describe('Sandbox Execution & Mobile Logic', () => {
    const processedCode = simulateHtmlServicePreprocess(rawHtml);

    function createSandbox(initialWidth = 375) {
      const elements = {};
      function createElement(id, tagName = 'div') {
        const el = {
          id,
          tagName: tagName.toUpperCase(),
          dataset: {},
          style: {},
          _className: '',
          get className() { return this._className; },
          set className(val) {
            this._className = val;
            this.classList.classes.clear();
            if (val) {
              val.split(/\s+/).forEach(c => { if (c) this.classList.classes.add(c); });
            }
          },
          classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); el._className = Array.from(this.classes).join(' '); },
            remove(c) { this.classes.delete(c); el._className = Array.from(this.classes).join(' '); },
            contains(c) { return this.classes.has(c); }
          },
          children: [],
          appendChild(child) { this.children.push(child); return child; },
          removeChild(child) {
            const idx = this.children.indexOf(child);
            if (idx !== -1) this.children.splice(idx, 1);
            return child;
          },
          setAttribute(k, v) { this[k] = v; },
          getAttribute(k) { return this[k]; },
          addEventListener(event, handler) {
            this._listeners = this._listeners || {};
            this._listeners[event] = this._listeners[event] || [];
            this._listeners[event].push(handler);
          },
          trigger(event, evData = {}) {
            if (this._listeners && this._listeners[event]) {
              this._listeners[event].forEach(fn => fn(evData));
            }
          },
          scrollIntoView() {},
          click() {
            this.trigger('click', {});
          },
          focusCalled: false,
          focus() { this.focusCalled = true; },
          value: '',
          textContent: '',
          innerHTML: ''
        };
        elements[id] = el;
        return el;
      }

      createElement('checkInDate', 'input');
      createElement('checkOutDate', 'input');
      createElement('customCalendarGrid', 'div');
      createElement('calMonthTitle', 'h2');
      createElement('calPrevBtn', 'button');
      createElement('calNextBtn', 'button');
      createElement('calendarSeasonIcon', 'span');
      createElement('calendarSeasonTitle', 'span');
      createElement('calendarSeasonDesc', 'span');
      createElement('calendarErrorBanner', 'div');
      elements['calendarErrorBanner'].style.display = 'none';
      createElement('calendarErrorMessage', 'span');
      createElement('calendarRetryBtn', 'button');
      createElement('srAnnouncement', 'div');
      createElement('staySummaryCard', 'div');
      elements['staySummaryCard'].style.display = 'none';
      createElement('summaryCheckIn', 'span');
      createElement('summaryCheckOut', 'span');
      createElement('summaryNights', 'div');
      createElement('summaryMarketSubtotal', 'span');
      createElement('summaryUnitSubtotal', 'span');
      createElement('summaryTotalPrice', 'span');
      createElement('summarySavingsBadge', 'div');
      createElement('summaryDiscountRow', 'div');
      elements['summaryDiscountRow'].style.display = 'none';
      createElement('summaryDiscountLabel', 'span');
      createElement('summaryDiscountAmount', 'span');
      createElement('summaryExtraGuestRow', 'div');
      elements['summaryExtraGuestRow'].style.display = 'none';
      createElement('summaryExtraGuestLabel', 'span');
      createElement('summaryExtraGuestAmount', 'span');
      createElement('guestName', 'input');
      createElement('guestEmail', 'input');
      createElement('guestPhone', 'input');
      createElement('guestCount', 'select');
      elements['guestCount'].value = '2';
      createElement('statusMessage', 'div');
      createElement('bookingForm', 'form');
      createElement('submitBtn', 'button');
      createElement('confirmationBox', 'section');
      elements['confirmationBox'].style.display = 'none';
      createElement('confText', 'p');
      createElement('addToGoogleCalBtn', 'a');

      createElement('aiChatLauncher', 'button');
      createElement('aiChatDrawer', 'div');
      elements['aiChatDrawer'].style.display = 'none';
      createElement('aiChatCloseBtn', 'button');
      createElement('aiChatMessages', 'div');
      createElement('aiChatForm', 'form');
      createElement('aiChatInput', 'input');
      createElement('aiChatSendBtn', 'button');

      const bodyEl = createElement('body', 'body');

      const sandbox = {
        window: {
          innerWidth: initialWidth,
          addEventListener: () => {}
        },
        document: {
          readyState: 'complete',
          getElementById: (id) => elements[id] || null,
          createElement: (tag) => createElement('dynamic_' + Math.random(), tag),
          querySelectorAll: () => [],
          body: bodyEl
        },
        Blob: class MockBlob {
          constructor(parts, opts) { this.parts = parts; this.opts = opts; }
        },
        URL: { createObjectURL: () => 'blob:mock-url' },
        console,
        Date,
        Math,
        String,
        parseInt,
        encodeURIComponent
      };

      sandbox.window.document = sandbox.document;
      sandbox.window.URL = sandbox.URL;

      const context = vm.createContext(sandbox);
      vm.runInContext(processedCode, context);

      return { sandbox, context, elements, bodyEl };
    }

    test('formatCompactPhp formats numbers into clean compact strings', () => {
      const { context } = createSandbox();
      const fn = vm.runInContext('typeof formatCompactPhp === "function" ? formatCompactPhp : null', context);
      assert.ok(fn, 'formatCompactPhp function should be defined');
      assert.equal(vm.runInContext('formatCompactPhp(3340)', context), '₱3.3k');
      assert.equal(vm.runInContext('formatCompactPhp(3840)', context), '₱3.8k');
      assert.equal(vm.runInContext('formatCompactPhp(4000)', context), '₱4k');
      assert.equal(vm.runInContext('formatCompactPhp(800)', context), '₱800');
    });

    test('renderCalendar renders compact price sub-labels (.cal-cell-sub) on cells', () => {
      const { context, elements } = createSandbox();
      const grid = elements['customCalendarGrid'];
      assert.ok(grid.children.length > 0, 'Calendar grid should have rendered cells');

      // Find an available cell (future date)
      const availableCell = grid.children.find(c => !c.classList.contains('cal-disabled') && !c.classList.contains('cal-other-month') && !c.classList.contains('cal-booked'));
      assert.ok(availableCell, 'Should find at least one available current-month cell');
      
      const subLabel = availableCell.children.find(child => child.classList && child.classList.contains('cal-cell-sub'));
      assert.ok(subLabel, 'Available cell should contain a .cal-cell-sub element');
      assert.match(subLabel.textContent, /^₱[\d\.]+k$/, 'Sublabel should display compact rate like ₱3.3k');
    });

    test('Mobile AI Drawer toggling locks body scroll and suppresses auto-focus on mobile viewports', () => {
      const { context, elements, bodyEl, sandbox } = createSandbox(375); // Mobile width 375px
      
      // Open drawer on mobile
      vm.runInContext('toggleAiChatDrawer(true)', context);
      assert.equal(elements['aiChatDrawer'].style.display, 'flex');
      assert.equal(bodyEl.style.overflow, 'hidden', 'Body overflow should be hidden on mobile when drawer is open');
      assert.equal(elements['aiChatInput'].focusCalled, false, 'Auto-focus should NOT be called on mobile when drawer opens');

      // Close drawer on mobile
      vm.runInContext('toggleAiChatDrawer(false)', context);
      assert.equal(elements['aiChatDrawer'].style.display, 'none');
      assert.equal(bodyEl.style.overflow, '', 'Body overflow should be restored when drawer closes');

      // Desktop test: reset focusCalled, change innerWidth to 1024
      sandbox.window.innerWidth = 1024;
      elements['aiChatInput'].focusCalled = false;
      vm.runInContext('toggleAiChatDrawer(true)', context);
      assert.equal(elements['aiChatInput'].focusCalled, true, 'Auto-focus SHOULD be called on desktop when drawer opens');
    });
  });
});
