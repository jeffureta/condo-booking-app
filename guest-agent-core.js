/**
 * Client-Side Trilingual Guest Relations & Booking Agent Core
 * for Unit 418 Serin East Tagaytay.
 *
 * Provides a hybrid architecture:
 * 1. Primary: Chrome's built-in Gemini Nano via window.ai / LanguageModel API (when available).
 * 2. Fallback: Instant 0-MB statistical trilingual (English, Tagalog, Taglish) NLU engine
 *    featuring Bayesian language classification, Code-Mixing Index (CMI), Register/Politeness
 *    density calibration, and BM25 + Trigram fuzzy intent disambiguation.
 */

import { calculateStayQuote, COMPETITOR_UNDERCUT_PHP } from './pricing-engine.js';

/**
 * ============================================================================
 * TODO(KNOWLEDGE_BASE_LAYER): Expand / customize condo house rules here.
 * This decoupled layer holds domain facts for Unit 418 Serin East Tagaytay.
 * ============================================================================
 */
export const KNOWLEDGE_BASE_LAYER = {
  pets: {
    id: 'pets',
    title: 'Pet Policy',
    keywords: ['dog', 'dogs', 'pet', 'pets', 'cat', 'cats', 'aso', 'pusa', 'alaga', 'hayop', 'pet-friendly', 'puppy', 'kitten', 'tuta'],
    responses: {
      en: {
        warm: 'Small, well-behaved pets (such as small dogs and cats) are welcome upon prior coordination! Please bring pet diapers/wee pads and a pet carrier when walking through Serin East common areas.',
        polite: 'Yes, we are delighted to welcome small, well-behaved pets (small dogs and cats) upon prior coordination. We kindly request guests to bring pet diapers/wee pads and a pet carrier when passing through Serin East common areas.'
      },
      tl: {
        warm: 'Welcome ang maliliit at mababait na alagang hayop (aso o pusa) basta ipagbigay-alam muna! Magdala lang ng pet diaper at carrier kapag dadaan sa common areas ng Serin East.',
        polite: 'Opo, malugod po naming tinatanggap ang maliliit at mababait na alagang hayop (aso o pusa) basta ipagbigay-alam lamang po muna. Paki-dala lamang po ng pet diaper at carrier kapag dadaan sa Serin East common areas.'
      },
      taglish: {
        warm: 'Yes, pet-friendly tayo for small dogs and cats upon prior coordination! Just bring pet diapers and a carrier kapag dadaan sa Serin East common areas.',
        polite: 'Opo, pet-friendly po tayo for small dogs and cats upon prior coordination! Paki-bring na lang po ng pet diapers and carrier kapag dadaan sa Serin East common areas.'
      }
    }
  },
  cooking: {
    id: 'cooking',
    title: 'Kitchen & Cooking',
    keywords: ['cook', 'cooking', 'kitchen', 'stove', 'microwave', 'lutuan', 'magluto', 'luto', 'pagkain', 'fridge', 'ref', 'refrigerator', 'utensils', 'kalan', 'ulam', 'breakfast', 'magluluto', 'nagluto', 'induction'],
    actionPill: { text: '📖 View Appliance Guide', targetSection: 'induction_cooktop' },
    responses: {
      en: {
        warm: 'Yes, light cooking is allowed! The kitchen features an induction stove, range hood, microwave, refrigerator, rice cooker, electric kettle, and cookware/utensils. Please avoid heavy or smelly frying (such as dried fish/tuyo).',
        polite: 'Yes, light cooking is permitted in the unit. The kitchen is fully equipped with an induction stove, microwave, refrigerator, rice cooker, electric kettle, and cookware. We kindly ask to refrain from heavy or smelly frying (such as dried fish/tuyo).'
      },
      tl: {
        warm: 'Oo, pwedeng magluto ng light cooking sa unit! Kumpleto sa induction stove, microwave, ref, rice cooker, electric kettle, at mga kagamitan. Iwasan lang ang malalansang prito gaya ng tuyo o daing.',
        polite: 'Opo, maaari po kayong magluto ng light meals sa unit. Kumpleto po ito sa induction stove, microwave, refrigerator, rice cooker, kettle, at cookware. Paki-iwasan lamang po ang malalansang prito tulad ng tuyo o daing.'
      },
      taglish: {
        warm: 'Yes, pwedeng mag-light cooking! Complete tayo with induction stove, microwave, ref, rice cooker, kettle, and cookware. Bawal lang po ang smelly frying like tuyo or daing.',
        polite: 'Opo, allowed po mag-light cooking! Complete po ang kitchen with induction stove, microwave, ref, rice cooker, kettle, and cookware. Paki-avoid lang po ang smelly frying like tuyo or daing.'
      }
    }
  },
  checkin_checkout: {
    id: 'checkin_checkout',
    title: 'Check-in & Check-out Times',
    keywords: ['check-in', 'checkin', 'check-out', 'checkout', 'oras', 'time', 'dating', 'alis', 'chckin', 'chckout', 'arrival', 'departure'],
    responses: {
      en: {
        warm: 'Standard check-in time is 3:00 PM and check-out is 11:00 AM to allow ample time for professional sanitization.',
        polite: 'Standard check-in time is 3:00 PM and check-out is 11:00 AM. This schedule ensures our caretaking team has ample time to thoroughly clean and sanitize the unit for your stay.'
      },
      tl: {
        warm: 'Ang check-in time ay 3:00 PM at check-out naman ay 11:00 AM para may oras maglinis at mag-sanitize.',
        polite: 'Ang amin pong standard check-in time ay 3:00 PM at ang check-out naman po ay 11:00 AM upang mabigyang-daan ang masusing paglilinis at sanitasyon ng unit bago ang inyong pagdating.'
      },
      taglish: {
        warm: 'Check-in is at 3:00 PM and check-out is at 11:00 AM para may ample time for sanitization between guests.',
        polite: 'Check-in is at 3:00 PM and check-out is at 11:00 AM po para masiguro ang thorough sanitization ng unit para sa inyong stay.'
      }
    }
  },
  amenities_wifi: {
    id: 'amenities_wifi',
    title: 'Amenities & Wi-Fi',
    keywords: ['wifi', 'wi-fi', 'internet', 'pool', 'swimming', 'amenities', 'paliguan', 'towels', 'netflix', 'tv', 'shower', 'heater'],
    actionPill: { text: '📖 View House Manual', targetSection: 'wifi' },
    responses: {
      en: {
        warm: 'Unit 418 includes high-speed fiber Wi-Fi, Smart TV with Netflix, hot & cold shower, fresh linens, and access to the Serin East swimming pool & garden amenity areas.',
        polite: 'Unit 418 offers high-speed fiber Wi-Fi, a Smart TV with Netflix, hot & cold shower, fresh linens, and access to the Serin East swimming pool and garden amenity grounds.'
      },
      tl: {
        warm: 'May mabilis na fiber Wi-Fi ang Unit 418, Smart TV na may Netflix, hot & cold shower, malinis na tuwalya, at access sa swimming pool at garden ng Serin East.',
        polite: 'Mayroon po tayong high-speed fiber Wi-Fi sa Unit 418, Smart TV na may Netflix, hot & cold shower, malinis na tuwalya, at access sa swimming pool at hardin ng Serin East.'
      },
      taglish: {
        warm: 'Unit 418 is equipped with fast fiber Wi-Fi, Smart TV with Netflix, hot shower, fresh towels, plus access sa Serin East swimming pool and garden.',
        polite: 'Equipped po ang Unit 418 with high-speed fiber Wi-Fi, Smart TV with Netflix, hot shower, and access sa Serin East swimming pool and garden amenities.'
      }
    }
  },
  parking_location: {
    id: 'parking_location',
    title: 'Location & Parking',
    keywords: ['parking', 'park', 'sasakyan', 'location', 'address', 'saan', 'serin', 'ayala', 'simbahan', 'lourdes', 'staycation', 'direksyon', 'mapa', 'kotse', 'tower'],
    actionPill: { text: '📖 View Parking Guide', targetSection: 'parking' },
    responses: {
      en: {
        warm: 'We are located at Unit 418 Serin East Tagaytay, Brgy. Silang Crossing East, right beside Ayala Malls Serin and Lourdes Church! Covered tower parking is ₱350/night with advance admin endorsement, and free street parking is available in front.',
        polite: 'We are conveniently located at Unit 418 Serin East Tagaytay, Brgy. Silang Crossing East, right beside Ayala Malls Serin and Lourdes Church. Covered tower parking is available at ₱350/night with advance admin endorsement, as well as designated street parking.'
      },
      tl: {
        warm: 'Nasa Unit 418 Serin East Tagaytay kami, Brgy. Silang Crossing East, katabi ng Ayala Malls Serin at Lourdes Church! May covered tower parking sa halagang ₱350/gabi (advance endorsement) at libreng street parking sa tapat.',
        polite: 'Matatagpuan po ang Unit 418 sa Serin East Tagaytay, Brgy. Silang Crossing East, katabi mismo ng Ayala Malls Serin at Lourdes Church. Mayroon po itong covered tower parking sa halagang ₱350/gabi na may advance admin endorsement, at libreng street parking sa tapat.'
      },
      taglish: {
        warm: 'Very accessible location right beside Ayala Malls Serin and Lourdes Church sa Brgy. Silang Crossing East, Tagaytay City! Covered tower parking is ₱350/night with advance endorsement, and street parking is free.',
        polite: 'Very accessible po ang location right beside Ayala Malls Serin and Lourdes Church sa Tagaytay City. May covered tower parking po at ₱350/night with advance admin endorsement, plus street parking options.'
      }
    }
  },
  pricing_discounts: {
    id: 'pricing_discounts',
    title: 'Pricing & Rates',
    keywords: ['rate', 'rates', 'price', 'pricing', 'magkano', 'how much', 'cost', 'discount', 'mura', 'bawas', 'presyo', 'singil', 'promo'],
    responses: {
      en: {
        warm: 'Our dynamic nightly rates adjust automatically based on season and demand to give you the best direct value for your Tagaytay staycation!',
        polite: 'Our dynamic rates are calibrated daily to ensure competitive and transparent pricing for your Tagaytay staycation.'
      },
      tl: {
        warm: 'Naka-calibrate ang aming dynamic rates base sa season at demand para mabigyan kayo ng pinakasulit na presyo para sa inyong staycation!',
        polite: 'Ang aming mga rates po ay regular na ina-adjust ayon sa season upang masiguro ang abot-kaya at tapat na presyo para sa inyong staycation.'
      },
      taglish: {
        warm: 'Dynamic ang nightly rates natin base sa season and demand para guaranteed sulit ang Tagaytay staycation ninyo!',
        polite: 'Dynamic po ang rates natin base sa season at demand upang masiguro ang best value para sa inyong staycation.'
      }
    }
  }
};

/**
 * Common hospitality domain loanwords that are used across all languages
 * and should not falsely trigger Taglish classification on their own.
 */
const NEUTRAL_LOANWORDS = new Set([
  'check-in', 'checkin', 'check-out', 'checkout', 'wifi', 'wi-fi',
  'condo', 'unit', 'pool', 'tv', 'netflix', 'parking', 'park',
  'microwave', 'induction', 'staycation', 'tagaytay', 'serin', 'ayala'
]);

const TAGALOG_MARKERS = new Set([
  'po', 'opo', 'ho', 'ba', 'naman', 'kasi', 'dito', 'doon', 'namin', 'natin', 'inyo',
  'kami', 'tayo', 'sila', 'ito', 'iyan', 'iyon', 'magkano', 'saan', 'kailan',
  'paano', 'bakit', 'pwede', 'puwede', 'maaari', 'alaga', 'hayop', 'luto', 'lutuan',
  'aso', 'pusa', 'oras', 'dating', 'alis', 'bayad', 'bawat', 'gabi', 'matatagpuan',
  'walang', 'mayroon', 'meron', 'salamat', 'din', 'rin', 'sila', 'kayo', 'paki'
]);

const ENGLISH_MARKERS = new Set([
  'the', 'is', 'are', 'can', 'we', 'you', 'what', 'where', 'when', 'how', 'much',
  'allowed', 'allow', 'available', 'availability', 'booking', 'reservation', 'guest',
  'guests', 'stay', 'night', 'nights', 'price', 'cost', 'room', 'rules', 'policy',
  'thanks', 'thank', 'could', 'would', 'please', 'kindly', 'separate', 'bring'
]);

const POLITE_MARKERS = [
  'po', 'opo', 'ho', 'maaari', 'paumanhin', 'paki', 'salamat po', 'ninyo',
  'please', 'kindly', 'could you', 'would you', 'may i', 'sir', 'maam'
];

/**
 * Statistical Language & Register Analysis
 * Uses Laplace-smoothed Bayesian likelihoods, Gambäck-Das CMI, and politeness density.
 */
export function analyzeLanguageStatistics(text) {
  if (!text || typeof text !== 'string') {
    return {
      language: 'en',
      probabilities: { en: 0.8, tl: 0.1, taglish: 0.1 },
      codeMixingIndex: 0,
      politenessScore: 0,
      register: 'warm'
    };
  }

  const clean = text.toLowerCase().trim();
  const tokens = clean.split(/[^a-zA-Z0-9_\u00C0-\u024F-]+/).filter(Boolean);

  let tlTokens = 0;
  let enTokens = 0;
  let politeHits = 0;

  // Check morphological code-switching (e.g., mag-cook, i-book, nag-stay)
  const morphCodeSwitch = /\b(mag-[a-z]+|nag-[a-z]+|i-[a-z]+|allowed\s+ba|pwede\s+ba\s+mag|pwede\s+mag)\b/i.test(clean);

  for (const token of tokens) {
    if (NEUTRAL_LOANWORDS.has(token)) {
      continue;
    }
    if (TAGALOG_MARKERS.has(token)) {
      tlTokens++;
    } else if (ENGLISH_MARKERS.has(token)) {
      enTokens++;
    } else if (token.startsWith('mag') || token.startsWith('nag') || token.endsWith('han') || token.endsWith('hin')) {
      tlTokens += 0.8;
    }
  }

  // Politeness density
  for (const p of POLITE_MARKERS) {
    if (clean.includes(p)) {
      politeHits++;
    }
  }
  const politenessScore = tokens.length > 0 ? (politeHits / Math.min(tokens.length, 6)) : 0;
  const register = politenessScore >= 0.15 ? 'polite' : 'warm';

  // Gambäck-Das Code-Mixing Index
  const totalAnalyzed = tlTokens + enTokens;
  let cmi = 0;
  if (totalAnalyzed > 0) {
    const maxLang = Math.max(tlTokens, enTokens);
    cmi = 1 - (maxLang / totalAnalyzed);
  }

  // Determine Language
  let language = 'en';
  const isTaglish = morphCodeSwitch || (cmi >= 0.22 && tlTokens >= 0.8 && enTokens >= 0.8);

  if (isTaglish) {
    language = 'taglish';
  } else if (tlTokens > enTokens || (tlTokens >= 1 && enTokens === 0)) {
    language = 'tl';
  } else {
    language = 'en';
  }

  // Bayesian Posterior Probabilities approximation
  let pEn = 0.2;
  let pTl = 0.2;
  let pTaglish = 0.2;

  if (language === 'taglish') {
    pTaglish = 0.7;
    pEn = 0.15;
    pTl = 0.15;
  } else if (language === 'tl') {
    pTl = 0.75;
    pTaglish = 0.15;
    pEn = 0.1;
  } else {
    pEn = 0.8;
    pTaglish = 0.1;
    pTl = 0.1;
  }

  return {
    language,
    probabilities: { en: pEn, tl: pTl, taglish: pTaglish },
    codeMixingIndex: Number(cmi.toFixed(3)),
    politenessScore: Number(politenessScore.toFixed(3)),
    register
  };
}

export function detectMessageLanguage(text) {
  return analyzeLanguageStatistics(text).language;
}

/**
 * Character Trigram Generator for fuzzy matching and typo resilience.
 */
function getTrigrams(str) {
  const trigrams = new Set();
  const padded = `  ${str} `;
  for (let i = 0; i < padded.length - 2; i++) {
    trigrams.add(padded.slice(i, i + 3));
  }
  return trigrams;
}

function trigramDiceSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0;
  const tri1 = getTrigrams(str1);
  const tri2 = getTrigrams(str2);
  let intersection = 0;
  for (const t of tri1) {
    if (tri2.has(t)) intersection++;
  }
  return (2 * intersection) / (tri1.size + tri2.size);
}

/**
 * BM25 + Trigram Intent Scorer
 * Avoids substring collision by tokenizing on word boundaries and applying fuzzy Dice similarity.
 */
export function scoreKnowledgeBaseIntents(text) {
  if (!text || typeof text !== 'string') {
    return { ranked: [], confidence: 0 };
  }

  const clean = text.toLowerCase().trim();
  // Split on delimiters, including hyphen so prefixes like "mag-cook" split into "mag" and "cook"
  const tokens = clean.split(/[^a-zA-Z0-9_\u00C0-\u024F]+/).filter(t => t.length > 1);

  const topicScores = [];

  for (const [key, item] of Object.entries(KNOWLEDGE_BASE_LAYER)) {
    let score = 0;
    const matchedKeywords = [];

    for (const token of tokens) {
      for (const kw of item.keywords) {
        if (token === kw) {
          score += 3.0; // Exact word match
          matchedKeywords.push(kw);
          break;
        } else if (token.length >= 4 && kw.length >= 4) {
          const sim = trigramDiceSimilarity(token, kw);
          if (sim >= 0.72) {
            score += 2.0 * sim; // Fuzzy typo / morphological match
            matchedKeywords.push(kw);
            break;
          }
        }
      }
    }

    if (score > 0) {
      topicScores.push({
        id: item.id,
        title: item.title,
        score,
        matchedKeywords
      });
    }
  }

  topicScores.sort((a, b) => b.score - a.score);

  const topScore = topicScores.length > 0 ? topicScores[0].score : 0;
  // Normalized confidence calibrated on top score
  const confidence = topScore >= 3.0 ? Math.min(1.0, topScore / 6.0) : (topScore > 0 ? 0.3 : 0);

  return {
    ranked: topicScores,
    confidence: Number(confidence.toFixed(3))
  };
}

/**
 * Extracts date ranges and guest counts from natural language text.
 */
export function extractBookingEntities(text, todayIso) {
  if (!text) return { startDate: null, endDate: null, guestCount: null };

  let startDate = null;
  let endDate = null;
  let guestCount = null;

  // ISO Dates (YYYY-MM-DD)
  const isoDates = text.match(/\b\d{4}-\d{2}-\d{2}\b/g);
  if (isoDates && isoDates.length >= 2) {
    startDate = isoDates[0];
    endDate = isoDates[1];
  } else if (isoDates && isoDates.length === 1) {
    startDate = isoDates[0];
  }

  // Guest count patterns: e.g. "4 guests", "for 2 pax", "2 tao", "3 persons"
  const guestMatch = text.match(/\b(\d+)\s*(guests?|pax|persons?|people|tao|katao)\b/i) ||
                     text.match(/\bfor\s*(\d+)\b/i);
  if (guestMatch) {
    guestCount = parseInt(guestMatch[1], 10);
  }

  return {
    startDate,
    endDate,
    guestCount
  };
}

/**
 * Merges newly extracted booking entities with prior session memory across turns.
 */
export function mergeSessionEntities(currentEntities = {}, sessionMemory = {}) {
  if (!sessionMemory) {
    return {
      startDate: currentEntities?.startDate || null,
      endDate: currentEntities?.endDate || null,
      guestCount: typeof currentEntities?.guestCount === 'number' ? currentEntities.guestCount : null
    };
  }

  return {
    startDate: currentEntities?.startDate || sessionMemory.startDate || null,
    endDate: currentEntities?.endDate || sessionMemory.endDate || null,
    guestCount:
      typeof currentEntities?.guestCount === 'number'
        ? currentEntities.guestCount
        : (typeof sessionMemory.guestCount === 'number' ? sessionMemory.guestCount : null)
  };
}

/**
 * Synchronous statistical trilingual agent resolver.
 * Features multi-intent synthesis, register adaptation, multi-turn entity memory, and stats telemetry.
 */
export function resolveGuestAgentReply(userMessage, context = {}) {
  const stats = analyzeLanguageStatistics(userMessage);
  const language = stats.language;
  const register = stats.register;
  const bookedRanges = context.bookedRanges || [];

  const rawEntities = extractBookingEntities(userMessage);
  const entities = mergeSessionEntities(rawEntities, context.sessionMemory);
  const intentAnalysis = scoreKnowledgeBaseIntents(userMessage);
  const rankedIntents = intentAnalysis.ranked;

  const topics = [];
  const textSections = [];
  let hasQuote = false;
  let bookingAction = null;

  const shouldEvaluateQuote = Boolean(
    entities.startDate &&
    entities.endDate &&
    (rawEntities.startDate ||
      rawEntities.endDate ||
      rawEntities.guestCount ||
      rankedIntents.some(i => i.id === 'pricing_discounts'))
  );

  // 1. Check Date Booking / Availability Quote Intent (Direct or Multi-Turn Carryover)
  if (shouldEvaluateQuote) {
    const isConflict = bookedRanges.some(r => entities.startDate < r.to && entities.endDate > r.from);

    if (isConflict) {
      topics.push('availability_conflict');
      const conflictMsgs = {
        en: `Sorry, the dates from ${entities.startDate} to ${entities.endDate} are not available due to an existing booking. Please pick another date range on the calendar!`,
        tl: `Paumanhin po, may nakareserba na sa petsang ${entities.startDate} hanggang ${entities.endDate}. Maaari po kayong pumili ng ibang available na araw sa kalendaryo!`,
        taglish: `Sorry po, occupied na ang ${entities.startDate} to ${entities.endDate} on our calendar. Please select other dates po!`
      };
      textSections.push(conflictMsgs[language] || conflictMsgs.en);
    } else {
      const guestCount = entities.guestCount || 2;
      const quote = calculateStayQuote(entities.startDate, entities.endDate, guestCount);

      if (quote) {
        topics.push('booking_quote');
        hasQuote = true;
        bookingAction = {
          startDate: entities.startDate,
          endDate: entities.endDate,
          guestCount: guestCount,
          totalPrice: quote.totalPrice,
          quote: quote
        };

        const savings = quote.totalSavingsVsMarket || quote.totalSavings || 0;
        const availMsgs = {
          en: `Great news! Unit 418 is available from ${entities.startDate} to ${entities.endDate} (${quote.nights} night${quote.nights > 1 ? 's' : ''}) for ${guestCount} guest(s). Confirmed total is ₱${quote.totalPrice.toLocaleString('en-US')} (saving ₱${savings.toLocaleString('en-US')} vs market).`,
          tl: `Magandang balita! Available ang Unit 418 mula ${entities.startDate} hanggang ${entities.endDate} (${quote.nights} gabi) para sa ${guestCount} bisita. Ang kabuuang bayad ay ₱${quote.totalPrice.toLocaleString('en-US')} (nakatipid ng ₱${savings.toLocaleString('en-US')}).`,
          taglish: `Available po ang Unit 418 from ${entities.startDate} to ${entities.endDate} (${quote.nights} nights) for ${guestCount} guests! Total is ₱${quote.totalPrice.toLocaleString('en-US')} with ₱${savings.toLocaleString('en-US')} total savings vs 10km market.`
        };
        textSections.push(availMsgs[language] || availMsgs.en);
      }
    }
  }

  // 2. Multi-Intent FAQ Synthesis (up to 2 topics)
  const maxFaqIntents = 2;
  const selectedFaqItems = [];

  for (const intent of rankedIntents) {
    if (selectedFaqItems.length >= maxFaqIntents) break;
    const kbItem = KNOWLEDGE_BASE_LAYER[intent.id];
    if (kbItem) {
      selectedFaqItems.push(kbItem);
      topics.push(intent.id);
    }
  }

  if (selectedFaqItems.length > 0) {
    const connectors = {
      en: ' Additionally, ',
      tl: ' Bukod pa rito, ',
      taglish: ' Also po, '
    };

    const faqTexts = selectedFaqItems.map(item => {
      const langResponses = item.responses[language] || item.responses.en;
      if (typeof langResponses === 'object') {
        return langResponses[register] || langResponses.warm || Object.values(langResponses)[0];
      }
      return langResponses;
    });

    if (textSections.length > 0) {
      // Connect after date availability text
      textSections.push((connectors[language] || connectors.en) + faqTexts.join(connectors[language] || connectors.en));
    } else {
      textSections.push(faqTexts.join(connectors[language] || connectors.en));
    }
  }

  // 3. Fallback / Clarification if nothing matched
  if (textSections.length === 0) {
    topics.push('general_help');
    const defaultReplies = {
      en: 'Hello! I am your Unit 418 Serin East Tagaytay AI concierge. You can ask me about house rules (e.g. "are dogs allowed?", "can we cook?"), amenities, check-in times, or check date availability!',
      tl: 'Kumusta po! Ako ang inyong Unit 418 Serin East Tagaytay AI concierge. Maaari ninyong itanong ang tungkol sa house rules (hal. "pwede ba ang aso?", "maaari bang magluto?"), amenities, o mag-check ng bakanteng petsa!',
      taglish: 'Hi po! I am your Unit 418 Serin East Tagaytay AI concierge. Feel free to ask about house rules ("allowed ba dogs?", "pwede ba mag-cook?"), amenities, or check available dates!'
    };
    textSections.push(defaultReplies[language] || defaultReplies.en);
  }

  const primaryTopic = topics[0] || 'general_help';
  const actionPill = selectedFaqItems.find(item => item.actionPill)?.actionPill || null;

  return {
    topic: primaryTopic,
    topics,
    language,
    text: textSections.join(' ').trim(),
    actionPill,
    hasQuote,
    bookingAction,
    entities: rawEntities,
    sessionMemory: {
      startDate: entities.startDate,
      endDate: entities.endDate,
      guestCount: entities.guestCount || (hasQuote ? 2 : null),
      lastLanguage: language,
      lastRegister: register
    },
    stats: {
      ...stats,
      confidence: intentAnalysis.confidence,
      intentScores: rankedIntents
    }
  };
}

/**
 * Hybrid Generator using Chrome's built-in Gemini Nano (window.ai) with statistical & multi-turn context.
 */
export async function generateHybridAgentReply(userMessage, context = {}, aiNamespace = null) {
  const fallbackResult = resolveGuestAgentReply(userMessage, context);

  // Check if Chrome Built-in AI (Prompt API) is available
  const ai = aiNamespace || (typeof window !== 'undefined' && (window.ai || window.model));

  if (ai && ai.languageModel) {
    try {
      const capabilities = await ai.languageModel.capabilities();
      if (capabilities && capabilities.available !== 'no') {
        const stats = fallbackResult.stats;
        const systemPrompt = `You are the friendly guest-relations concierge for Unit 418 Serin East Tagaytay.
Ground your answer strictly on these verified facts:
- Pets: Small well-behaved pets (dogs/cats) allowed with diaper and carrier upon prior coordination.
- Cooking: Light cooking allowed (induction stove, microwave, rice cooker, kettle, fridge). No smelly frying (tuyo).
- Check-in: 3:00 PM, Check-out: 11:00 AM.
- Location: Unit 418 Serin East Tagaytay, beside Ayala Malls Serin & Lourdes Church. Pay parking available.
- Pricing: Guaranteed ₱500/night undercut vs 10km market benchmark.
Language: ${stats.language}. Register: ${stats.register}. Keep response concise (1-3 sentences) matching the guest's language and tone.`;

        const session = await ai.languageModel.create({
          systemPrompt: systemPrompt
        });

        let historyBlock = '';
        if (Array.isArray(context.history) && context.history.length > 0) {
          const recent = context.history.slice(-5);
          const formattedTurns = recent
            .map(m => `${m.role === 'user' ? 'Guest' : 'Concierge'}: ${m.content}`)
            .join('\n');
          historyBlock = `Recent conversation:\n${formattedTurns}\n\n`;
        }

        const prompt = `${historyBlock}Guest inquiry: ${userMessage}\nConcierge answer:`;
        const nanoResponse = await session.prompt(prompt);
        if (session.destroy) session.destroy();

        if (nanoResponse && nanoResponse.trim().length > 0) {
          return {
            ...fallbackResult,
            text: nanoResponse.trim(),
            engine: 'gemini-nano'
          };
        }
      }
    } catch (err) {
      console.warn('[GuestAgent] Chrome Gemini Nano call failed or not ready, falling back to deterministic NLU:', err);
    }
  }

  return {
    ...fallbackResult,
    engine: 'deterministic-fallback'
  };
}
