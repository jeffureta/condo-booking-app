import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  KNOWLEDGE_BASE_LAYER,
  detectMessageLanguage,
  extractBookingEntities,
  resolveGuestAgentReply,
  generateHybridAgentReply
} from '../guest-agent-core.js';

describe('Client-Side Trilingual Guest Relations & Booking Agent (TDD Red-Green-Refactor)', () => {
  describe('Language Detection (detectMessageLanguage)', () => {
    test('detects English query', () => {
      assert.equal(detectMessageLanguage('Are dogs allowed in the unit?'), 'en');
      assert.equal(detectMessageLanguage('Can we cook inside the condo?'), 'en');
      assert.equal(detectMessageLanguage('What time is check in and check out?'), 'en');
    });

    test('detects Tagalog query', () => {
      assert.equal(detectMessageLanguage('Pwede po ba ang aso sa condo?'), 'tl');
      assert.equal(detectMessageLanguage('Maaari po ba kaming magluto dito?'), 'tl');
      assert.equal(detectMessageLanguage('Magkano po ba ang bayad sa bawat gabi?'), 'tl');
    });

    test('detects Taglish query', () => {
      assert.equal(detectMessageLanguage('Allowed ba dogs dito?'), 'taglish');
      assert.equal(detectMessageLanguage('Pwede ba mag-cook ng food?'), 'taglish');
      assert.equal(detectMessageLanguage('Magkano rate for 4 guests this weekend?'), 'taglish');
    });
  });

  describe('Guest-Relations FAQ Resolution & Knowledge Base Layer', () => {
    test('contains decoupled Knowledge Base layer with pet and cooking rules', () => {
      assert.ok(KNOWLEDGE_BASE_LAYER.pets);
      assert.ok(KNOWLEDGE_BASE_LAYER.cooking);
      assert.ok(KNOWLEDGE_BASE_LAYER.pets.responses.en);
      assert.ok(KNOWLEDGE_BASE_LAYER.pets.responses.tl);
      assert.ok(KNOWLEDGE_BASE_LAYER.pets.responses.taglish);
    });

    test('answers "are dogs allowed?" in matching language', () => {
      const enReply = resolveGuestAgentReply('Are dogs allowed in the unit?');
      assert.equal(enReply.topic, 'pets');
      assert.equal(enReply.language, 'en');
      assert.match(enReply.text, /small.*pet|dog/i);

      const tlReply = resolveGuestAgentReply('Pwede po ba magdala ng aso?');
      assert.equal(tlReply.topic, 'pets');
      assert.equal(tlReply.language, 'tl');
      assert.match(tlReply.text, /alaga.*hayop|aso/i);

      const taglishReply = resolveGuestAgentReply('Allowed ba ang dogs dito?');
      assert.equal(taglishReply.topic, 'pets');
      assert.equal(taglishReply.language, 'taglish');
      assert.match(taglishReply.text, /pet-friendly/i);
    });

    test('answers "can we cook?" in matching language', () => {
      const enReply = resolveGuestAgentReply('Can we cook?');
      assert.equal(enReply.topic, 'cooking');
      assert.equal(enReply.language, 'en');
      assert.match(enReply.text, /light cooking/i);
      assert.match(enReply.text, /induction stove/i);

      const tlReply = resolveGuestAgentReply('Maaari po bang magluto sa unit?');
      assert.equal(tlReply.topic, 'cooking');
      assert.equal(tlReply.language, 'tl');
      assert.match(tlReply.text, /magluto/i);

      const taglishReply = resolveGuestAgentReply('Pwede ba mag-cook ng food?');
      assert.equal(taglishReply.topic, 'cooking');
      assert.equal(taglishReply.language, 'taglish');
      assert.match(taglishReply.text, /light cooking/i);
    });
  });

  describe('Entity Extraction & Booking Actions', () => {
    test('extracts date ranges and guest counts accurately', () => {
      const entities = extractBookingEntities('Can I book from 2026-12-05 to 2026-12-08 for 4 guests?');
      assert.equal(entities.startDate, '2026-12-05');
      assert.equal(entities.endDate, '2026-12-08');
      assert.equal(entities.guestCount, 4);
    });

    test('returns quote and 1-tap booking action CTA when dates are available', () => {
      const context = {
        bookedRanges: [
          { from: '2026-11-20', to: '2026-11-22', title: 'Reserved Guest' }
        ]
      };
      const reply = resolveGuestAgentReply('Is 2026-12-10 to 2026-12-13 available for 3 guests?', context);
      assert.equal(reply.hasQuote, true);
      assert.ok(reply.bookingAction);
      assert.equal(reply.bookingAction.startDate, '2026-12-10');
      assert.equal(reply.bookingAction.endDate, '2026-12-13');
      assert.equal(reply.bookingAction.guestCount, 3);
      assert.ok(reply.bookingAction.totalPrice > 0);
      assert.match(reply.text, /available/i);
    });

    test('flags conflict when queried dates overlap with existing reservation', () => {
      const context = {
        bookedRanges: [
          { from: '2026-12-10', to: '2026-12-15', title: 'Reserved Guest' }
        ]
      };
      const reply = resolveGuestAgentReply('Can we book 2026-12-12 to 2026-12-14?', context);
      assert.equal(reply.hasQuote, false);
      assert.equal(reply.bookingAction, null);
      assert.match(reply.text, /not available|occupied|conflict|reserved/i);
    });
  });

  describe('Hybrid Google Built-in AI / Gemini Nano Fallback', () => {
    test('uses Chrome Gemini Nano prompt API if available', async () => {
      const mockSession = {
        prompt: async (promptText) => `[Gemini Nano Response] Dogs are welcome! Prompt length: ${promptText.length}`,
        destroy: () => {}
      };
      const mockAi = {
        languageModel: {
          capabilities: async () => ({ available: 'readily' }),
          create: async () => mockSession
        }
      };

      const reply = await generateHybridAgentReply('Are dogs allowed?', {}, mockAi);
      assert.ok(reply.text.includes('[Gemini Nano Response]'));
      assert.equal(reply.engine, 'gemini-nano');
    });

    test('gracefully falls back to deterministic engine when window.ai is absent or throws', async () => {
      const reply = await generateHybridAgentReply('Can we cook?', {}, null);
      assert.equal(reply.engine, 'deterministic-fallback');
      assert.match(reply.text, /light cooking/i);
    });
  });
});
