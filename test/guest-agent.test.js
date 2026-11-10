import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  KNOWLEDGE_BASE_LAYER,
  detectMessageLanguage,
  analyzeLanguageStatistics,
  scoreKnowledgeBaseIntents,
  extractBookingEntities,
  resolveGuestAgentReply,
  generateHybridAgentReply
} from '../guest-agent-core.js';

describe('Client-Side Trilingual Guest Relations & Booking Agent (TDD Red-Green-Refactor)', () => {
  describe('Statistical Language & Register Analysis (analyzeLanguageStatistics)', () => {
    test('classifies English and extracts statistical probabilities', () => {
      const stats = analyzeLanguageStatistics('Are dogs allowed in the unit?');
      assert.equal(stats.language, 'en');
      assert.ok(stats.probabilities.en > stats.probabilities.tl);
      assert.equal(typeof stats.codeMixingIndex, 'number');
      assert.equal(typeof stats.politenessScore, 'number');
    });

    test('classifies pure Tagalog even with neutral hospitality loanwords', () => {
      // "Anong oras po ang check-in sa condo?" should NOT be misclassified as Taglish just because of 'check-in' and 'condo'
      const stats1 = analyzeLanguageStatistics('Anong oras po ang check-in sa condo?');
      assert.equal(stats1.language, 'tl');
      assert.equal(stats1.register, 'polite');
      assert.ok(stats1.politenessScore > 0);

      const stats2 = analyzeLanguageStatistics('Mabilis po ba ang wifi sa unit?');
      assert.equal(stats2.language, 'tl');
      assert.equal(stats2.register, 'polite');
    });

    test('detects true Taglish code-mixing and morphological mixing', () => {
      const stats1 = analyzeLanguageStatistics('Allowed ba dogs dito?');
      assert.equal(stats1.language, 'taglish');
      assert.ok(stats1.codeMixingIndex > 0 || stats1.probabilities.taglish > 0.4);

      const stats2 = analyzeLanguageStatistics('Pwede ba mag-cook ng breakfast?');
      assert.equal(stats2.language, 'taglish');

      const stats3 = analyzeLanguageStatistics('Magkano rate for 4 guests this weekend?');
      assert.equal(stats3.language, 'taglish');
    });

    test('calibrates politeness register (polite vs warm)', () => {
      const politeTl = analyzeLanguageStatistics('Maaari po bang magtanong kung may parking?');
      assert.equal(politeTl.register, 'polite');

      const politeEn = analyzeLanguageStatistics('Could you please let me know if pets are allowed?');
      assert.equal(politeEn.register, 'polite');

      const warmEn = analyzeLanguageStatistics('Can we cook?');
      assert.equal(warmEn.register, 'warm');

      const warmTl = analyzeLanguageStatistics('May parking ba diyan?');
      assert.equal(warmTl.register, 'warm');
    });

    test('detectMessageLanguage remains backward-compatible', () => {
      assert.equal(detectMessageLanguage('Are dogs allowed in the unit?'), 'en');
      assert.equal(detectMessageLanguage('Pwede po ba ang aso sa condo?'), 'tl');
      assert.equal(detectMessageLanguage('Allowed ba dogs dito?'), 'taglish');
    });
  });

  describe('Statistical BM25 & Trigram Intent Scoring (scoreKnowledgeBaseIntents)', () => {
    test('avoids substring collisions on "staycation" and "separate"', () => {
      // "staycation" contains "cat" -> previously triggered 'pets'
      const scoredStay = scoreKnowledgeBaseIntents('Where is the location for our staycation?');
      assert.ok(scoredStay.ranked.length > 0);
      assert.equal(scoredStay.ranked[0].id, 'parking_location');
      assert.notEqual(scoredStay.ranked[0].id, 'pets');

      // "separate" contains "rate" -> should not trigger pricing unless asking about rates
      const scoredKitchen = scoreKnowledgeBaseIntents('Is the kitchen separate or open layout?');
      assert.equal(scoredKitchen.ranked[0].id, 'cooking');
    });

    test('tolerates minor typos and Tagalog verb morphology via character trigrams', () => {
      // Typo "chckin" -> checkin_checkout
      const typoCheck = scoreKnowledgeBaseIntents('What time is chckin?');
      assert.equal(typoCheck.ranked[0].id, 'checkin_checkout');

      // Tagalog verb morphology "magluluto" -> cooking
      const morphCook = scoreKnowledgeBaseIntents('Pwede ba magluluto ng ulam?');
      assert.equal(morphCook.ranked[0].id, 'cooking');
    });
  });

  describe('Multi-Intent Synthesis & Register-Calibrated Responses', () => {
    test('synthesizes multi-topic FAQ inquiry into a cohesive reply', () => {
      const reply = resolveGuestAgentReply('Allowed ba dogs at pwede ba mag-cook?');
      assert.equal(reply.language, 'taglish');
      assert.ok(Array.isArray(reply.topics));
      assert.ok(reply.topics.includes('pets'));
      assert.ok(reply.topics.includes('cooking'));
      assert.match(reply.text, /pet|dog/i);
      assert.match(reply.text, /cook|induction|luto/i);
      assert.ok(reply.stats);
      assert.equal(reply.stats.language, 'taglish');
    });

    test('synthesizes date availability quote alongside FAQ inquiry', () => {
      const context = {
        bookedRanges: []
      };
      const reply = resolveGuestAgentReply('Is 2026-12-10 to 2026-12-13 available for 3 guests and are dogs allowed?', context);
      assert.equal(reply.hasQuote, true);
      assert.ok(reply.bookingAction);
      assert.ok(reply.topics.includes('booking_quote'));
      assert.ok(reply.topics.includes('pets'));
      assert.match(reply.text, /available/i);
      assert.match(reply.text, /pet|dog/i);
    });

    test('adapts tone based on polite vs warm register', () => {
      const politeReply = resolveGuestAgentReply('Maaari po bang magluto sa unit?');
      assert.equal(politeReply.stats.register, 'polite');
      assert.match(politeReply.text, /opo|po/i);

      const politeEnReply = resolveGuestAgentReply('Could you please let me know the check-in time?');
      assert.equal(politeEnReply.stats.register, 'polite');
      assert.ok(politeReply.text.length > 0);
    });

    test('provides clarifying fallback when confidence is low or query is ambiguous', () => {
      const reply = resolveGuestAgentReply('xyz123 random words query?');
      assert.equal(reply.topic, 'general_help');
      assert.ok(reply.stats.confidence < 0.35);
    });
  });

  describe('Hybrid Google Built-in AI / Gemini Nano Fallback with Stats Injection', () => {
    test('injects statistical context into Gemini Nano prompt', async () => {
      let capturedSystemPrompt = '';
      let capturedPrompt = '';
      const mockSession = {
        prompt: async (promptText) => {
          capturedPrompt = promptText;
          return `[Nano Answer] Yes, small pets are welcome upon coordination.`;
        },
        destroy: () => {}
      };
      const mockAi = {
        languageModel: {
          capabilities: async () => ({ available: 'readily' }),
          create: async (opts) => {
            capturedSystemPrompt = opts.systemPrompt || '';
            return mockSession;
          }
        }
      };

      const reply = await generateHybridAgentReply('Allowed ba dogs dito?', {}, mockAi);
      assert.equal(reply.engine, 'gemini-nano');
      assert.ok(capturedSystemPrompt.includes('Language: taglish') || capturedSystemPrompt.includes('taglish'));
      assert.ok(capturedPrompt.includes('Allowed ba dogs dito?'));
      assert.ok(reply.stats);
    });

    test('gracefully falls back to deterministic statistical engine when window.ai is absent', async () => {
      const reply = await generateHybridAgentReply('Can we cook?', {}, null);
      assert.equal(reply.engine, 'deterministic-fallback');
      assert.match(reply.text, /light cooking/i);
      assert.ok(reply.stats);
    });
  });
});
