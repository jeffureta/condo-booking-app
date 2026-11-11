import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const SCRIPTS_PATH = path.resolve('Scripts.html');

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

describe('Google Apps Script HtmlService Preprocessor & Dynamic Pricing Verification (TDD)', () => {
  const rawHtml = fs.readFileSync(SCRIPTS_PATH, 'utf8');

  test('Scripts.html MUST NOT contain ES6 template literals (backticks)', () => {
    const match = rawHtml.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i);
    const code = match ? match[1] : rawHtml;
    
    const backtickLines = [];
    code.split('\n').forEach((line, idx) => {
      if (line.includes('`')) {
        backtickLines.push({ line: idx + 1, text: line.trim() });
      }
    });

    assert.equal(
      backtickLines.length,
      0,
      `Found backtick template literals in Scripts.html on lines:\n` +
      backtickLines.map(l => `  L${l.line}: ${l.text}`).join('\n')
    );
  });

  test('Scripts.html MUST NOT contain raw "//" inside string literals (e.g. URLs or ICS PRODID)', () => {
    const match = rawHtml.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i);
    const code = match ? match[1] : rawHtml;

    const linesWithRawSlashSlash = [];
    code.split('\n').forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
      if (line.includes('https://') || line.includes('http://') || line.includes('//EN')) {
        linesWithRawSlashSlash.push({ line: idx + 1, text: trimmed });
      }
    });

    assert.equal(
      linesWithRawSlashSlash.length,
      0,
      `Found unescaped // in strings on lines:\n` +
      linesWithRawSlashSlash.map(l => `  L${l.line}: ${l.text}`).join('\n')
    );
  });

  test('Scripts.html compiles cleanly after simulated HtmlService ES5 preprocessor', () => {
    const processedCode = simulateHtmlServicePreprocess(rawHtml);
    assert.doesNotThrow(() => {
      new Function(processedCode);
    }, 'Compiled code threw an error after HtmlService comment preprocessing!');
  });

  test('Scripts.html executes correctly inside sandboxed VM and performs dynamic pricing calculations', () => {
    const processedCode = simulateHtmlServicePreprocess(rawHtml);

    const elements = {};
    function createElement(id, tagName = 'div') {
      const el = {
        id,
        tagName: tagName.toUpperCase(),
        dataset: {},
        style: {},
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
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
        addEventListener() {},
        scrollIntoView() {},
        click() {},
        value: '',
        textContent: '',
        innerHTML: ''
      };
      elements[id] = el;
      return el;
    }

    // Pre-create known elements
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

    // AI Concierge Chat Drawer & Launcher Elements
    createElement('aiChatLauncher', 'button');
    createElement('aiChatDrawer', 'div');
    elements['aiChatDrawer'].style.display = 'none';
    createElement('aiChatCloseBtn', 'button');
    createElement('aiChatResumeBanner', 'div');
    elements['aiChatResumeBanner'].style.display = 'none';
    createElement('aiChatResumeBtn', 'button');
    createElement('aiChatStartNewBtn', 'button');
    createElement('aiChatMessages', 'div');
    createElement('aiChatForm', 'form');
    createElement('aiChatInput', 'input');
    createElement('aiChatSendBtn', 'button');

    const mockStorage = {};
    const localStorageMock = {
      getItem: (k) => (k in mockStorage ? mockStorage[k] : null),
      setItem: (k, v) => { mockStorage[k] = String(v); },
      removeItem: (k) => { delete mockStorage[k]; }
    };

    const sandbox = {
      window: {
        addEventListener: () => {},
        localStorage: localStorageMock
      },
      localStorage: localStorageMock,
      document: {
        readyState: 'complete',
        getElementById: (id) => elements[id] || null,
        createElement: (tag) => createElement('dynamic_' + Math.random(), tag),
        querySelectorAll: () => [],
        body: createElement('body', 'body')
      },
      Blob: class MockBlob {
        constructor(parts, opts) {
          this.parts = parts;
          this.opts = opts;
        }
      },
      URL: {
        createObjectURL: () => 'blob:mock-url'
      },
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

    // Verify bootstrap execution
    assert.ok(elements['customCalendarGrid'].children.length > 0, 'customCalendarGrid should have day cells rendered');
    assert.ok(elements['calMonthTitle'].textContent.length > 0, 'calMonthTitle should have month and year text');

    // Test in-memory calculateNightlyPrice from sandbox
    const priceResult = vm.runInContext("calculateNightlyPrice('2026-12-25')", context);
    assert.equal(priceResult.savings, 500);
    assert.equal(priceResult.marketRate, 3840);
    assert.equal(priceResult.unitRate, 3340);

    // Test in-memory updateStaySummary with dynamic pricing
    elements['checkInDate'].value = '2026-11-10';
    elements['checkOutDate'].value = '2026-11-14';
    elements['guestCount'].value = '5';
    vm.runInContext("updateStaySummary()", context);

    assert.equal(elements['staySummaryCard'].style.display, 'flex');
    assert.ok(elements['summaryTotalPrice'].textContent.includes('₱14,960'));
    assert.equal(elements['summaryExtraGuestRow'].style.display, 'flex');

    // Test confirmation and link generation
    vm.runInContext("setupGoogleCalendarLink('CND-1234', 14960)", context);
    const gcalUrl = elements['addToGoogleCalBtn'].href;
    assert.ok(gcalUrl.includes('Unit%20418') || gcalUrl.includes('Unit 418'));
    assert.ok(gcalUrl.includes('14%2C960') || gcalUrl.includes('14,960'));

    // Test client-side AI agent in sandbox
    const dogReply = vm.runInContext("resolveGuestAgentReply('are dogs allowed?')", context);
    assert.ok(dogReply && dogReply.text);
    assert.match(dogReply.text, /pet|dog|alaga/i);

    const cookReply = vm.runInContext("resolveGuestAgentReply('can we cook?')", context);
    assert.ok(cookReply && cookReply.text);
    assert.match(cookReply.text, /cooking|luto/i);

    // Test 1-tap applyAgentDatesToBookingForm in sandbox
    vm.runInContext("applyAgentDatesToBookingForm('2026-12-15', '2026-12-18', 3)", context);
    assert.equal(elements['checkInDate'].value, '2026-12-15');
    assert.equal(elements['checkOutDate'].value, '2026-12-18');
    assert.equal(elements['guestCount'].value, '3');
    assert.equal(elements['staySummaryCard'].style.display, 'flex');

    // Test multi-turn entity memory & localStorage persistence in browser chat
    vm.runInContext("sendQuickQuestion('Is 2026-12-10 to 2026-12-13 available?')", context);
    const savedRaw1 = localStorageMock.getItem('unit418_ai_chat_session_v1');
    assert.ok(savedRaw1, 'Chat session should be persisted to localStorage after sending a message');
    const savedState1 = JSON.parse(savedRaw1);
    assert.equal(savedState1.messages.length, 2);
    assert.equal(savedState1.sessionMemory.startDate, '2026-12-10');
    assert.equal(savedState1.sessionMemory.endDate, '2026-12-13');

    // Follow-up turn without dates should carry over 2026-12-10 to 2026-12-13 for 5 guests
    vm.runInContext("sendQuickQuestion('Magkano kung 5 guests?')", context);
    const savedState2 = JSON.parse(localStorageMock.getItem('unit418_ai_chat_session_v1'));
    assert.equal(savedState2.messages.length, 4);
    assert.equal(savedState2.sessionMemory.guestCount, 5);
    assert.match(savedState2.messages[3].content, /2026-12-10/);
    assert.match(savedState2.messages[3].content, /5 guests/);

    // Test "Resume previous chat or start new?" banner when opening drawer with stored history
    vm.runInContext("toggleAiChatDrawer(false)", context);
    vm.runInContext("toggleAiChatDrawer(true)", context);
    assert.notEqual(
      elements['aiChatResumeBanner'].style.display,
      'none',
      'aiChatResumeBanner should be visible when opening drawer with stored chat history'
    );

    // Clicking "Resume previous chat" hides banner and keeps stored messages & memory
    vm.runInContext("resumeStoredChatSession()", context);
    assert.equal(elements['aiChatResumeBanner'].style.display, 'none');
    assert.equal(elements['aiChatMessages'].children.length, 4);

    // Reopening drawer shows banner again; clicking "Start new" clears history & resets to welcome message
    vm.runInContext("toggleAiChatDrawer(false)", context);
    vm.runInContext("toggleAiChatDrawer(true)", context);
    assert.notEqual(elements['aiChatResumeBanner'].style.display, 'none');

    vm.runInContext("startNewChatSession()", context);
    assert.equal(elements['aiChatResumeBanner'].style.display, 'none');
    const resetState = JSON.parse(localStorageMock.getItem('unit418_ai_chat_session_v1'));
    assert.equal(resetState.messages.length, 0);
    assert.equal(resetState.sessionMemory.startDate, null);
    assert.equal(elements['aiChatMessages'].children.length, 1, 'Should render fresh welcome message bubble after reset');
  });
});
