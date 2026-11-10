import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  DEFAULT_CHAT_DB_PATH,
  initChatDatabase,
  saveChatTurn,
  getChatSession,
  resetChatSession,
  getUnresolvedInquiries,
  getChatAnalyticsSummary
} from '../sqlite-chat-store.js';

describe('SQLite Chat Store & NLU Telemetry Deep Module (TDD)', () => {
  test('DEFAULT_CHAT_DB_PATH points to data/chat_history.db', () => {
    assert.ok(DEFAULT_CHAT_DB_PATH.endsWith(path.join('data', 'chat_history.db')));
  });

  test('saves a user/bot chat turn, merges entities, and retrieves full session history in order', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sqlite-chat-test-'));
    const dbPath = path.join(tmpDir, 'chat_history.db');

    initChatDatabase(dbPath);

    // Turn 1: User asks about availability for specific dates
    const saved1 = saveChatTurn({
      sessionId: 'sess-101',
      userMessage: 'Is 2026-12-10 to 2026-12-13 available?',
      botReply: 'Great news! Unit 418 is available from 2026-12-10 to 2026-12-13 (3 nights) for 2 guest(s).',
      language: 'en',
      register: 'warm',
      topic: 'booking_quote',
      topics: ['booking_quote'],
      confidence: 0.95,
      hasQuote: true,
      engine: 'deterministic-fallback',
      entities: { startDate: '2026-12-10', endDate: '2026-12-13', guestCount: 2 }
    }, dbPath);

    assert.equal(saved1.sessionId, 'sess-101');
    assert.deepEqual(saved1.sessionMemory, {
      startDate: '2026-12-10',
      endDate: '2026-12-13',
      guestCount: 2,
      lastLanguage: 'en',
      lastRegister: 'warm'
    });

    // Turn 2: Follow-up updating only guestCount (multi-turn carryover)
    const saved2 = saveChatTurn({
      sessionId: 'sess-101',
      userMessage: 'Magkano kung 5 guests?',
      botReply: 'Available po ang Unit 418 from 2026-12-10 to 2026-12-13 (3 nights) for 5 guests!',
      language: 'taglish',
      register: 'warm',
      topic: 'booking_quote',
      topics: ['booking_quote', 'pricing_discounts'],
      confidence: 0.85,
      hasQuote: true,
      engine: 'deterministic-fallback',
      entities: { startDate: null, endDate: null, guestCount: 5 }
    }, dbPath);

    assert.deepEqual(saved2.sessionMemory, {
      startDate: '2026-12-10',
      endDate: '2026-12-13',
      guestCount: 5,
      lastLanguage: 'taglish',
      lastRegister: 'warm'
    });

    const session = getChatSession('sess-101', dbPath);
    assert.ok(session);
    assert.equal(session.sessionId, 'sess-101');
    assert.equal(session.messages.length, 4); // 2 user + 2 bot messages
    assert.equal(session.messages[0].role, 'user');
    assert.equal(session.messages[0].content, 'Is 2026-12-10 to 2026-12-13 available?');
    assert.equal(session.messages[1].role, 'bot');
    assert.equal(session.messages[2].role, 'user');
    assert.equal(session.messages[2].content, 'Magkano kung 5 guests?');
    assert.equal(session.messages[3].role, 'bot');
    assert.equal(session.sessionMemory.startDate, '2026-12-10');
    assert.equal(session.sessionMemory.endDate, '2026-12-13');
    assert.equal(session.sessionMemory.guestCount, 5);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('resetChatSession clears messages and resets session memory for a fresh start', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sqlite-chat-reset-'));
    const dbPath = path.join(tmpDir, 'chat_history.db');

    saveChatTurn({
      sessionId: 'sess-reset-1',
      userMessage: 'Are dogs allowed?',
      botReply: 'Small, well-behaved pets are welcome!',
      language: 'en',
      register: 'warm',
      topic: 'pets',
      topics: ['pets'],
      confidence: 0.9,
      hasQuote: false,
      engine: 'deterministic-fallback',
      entities: { startDate: '2026-12-20', endDate: '2026-12-22', guestCount: 4 }
    }, dbPath);

    const beforeReset = getChatSession('sess-reset-1', dbPath);
    assert.equal(beforeReset.messages.length, 2);

    const resetResult = resetChatSession('sess-reset-1', dbPath);
    assert.equal(resetResult.success, true);

    const afterReset = getChatSession('sess-reset-1', dbPath);
    assert.equal(afterReset.messages.length, 0);
    assert.deepEqual(afterReset.sessionMemory, {
      startDate: null,
      endDate: null,
      guestCount: null,
      lastLanguage: 'en',
      lastRegister: 'warm'
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('getUnresolvedInquiries and getChatAnalyticsSummary surface low-confidence FAQ gaps and telemetry', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sqlite-chat-analytics-'));
    const dbPath = path.join(tmpDir, 'chat_history.db');

    // High-confidence known FAQ
    saveChatTurn({
      sessionId: 'sess-a1',
      userMessage: 'Pwede po ba mag-cook?',
      botReply: 'Opo, allowed po mag-light cooking!',
      language: 'taglish',
      register: 'polite',
      topic: 'cooking',
      topics: ['cooking'],
      confidence: 0.85,
      hasQuote: false,
      engine: 'deterministic-fallback'
    }, dbPath);

    // Low-confidence / general_help unresolved inquiry
    saveChatTurn({
      sessionId: 'sess-a2',
      userMessage: 'Do you have an EV charger in the basement?',
      botReply: 'Hello! I am your Unit 418 Serin East Tagaytay AI concierge...',
      language: 'en',
      register: 'warm',
      topic: 'general_help',
      topics: ['general_help'],
      confidence: 0,
      hasQuote: false,
      engine: 'deterministic-fallback'
    }, dbPath);

    const unresolved = getUnresolvedInquiries({ limit: 10 }, dbPath);
    assert.equal(unresolved.length, 1);
    assert.equal(unresolved[0].content, 'Do you have an EV charger in the basement?');
    assert.equal(unresolved[0].topic, 'general_help');

    const summary = getChatAnalyticsSummary(dbPath);
    assert.equal(summary.totalSessions, 2);
    assert.equal(summary.totalUserMessages, 2);
    assert.equal(summary.unresolvedCount, 1);
    assert.equal(summary.languages.taglish, 1);
    assert.equal(summary.languages.en, 1);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
