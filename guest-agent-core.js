/**
 * Client-Side Trilingual Guest Relations & Booking Agent Core
 * for Unit 418 Serin East Tagaytay.
 *
 * Provides a hybrid architecture:
 * 1. Primary: Chrome's built-in Gemini Nano via window.ai / LanguageModel API (when available).
 * 2. Fallback: Instant 0-MB deterministic trilingual (English, Tagalog, Taglish) NLU engine.
 */

import { calculateStayQuote, COMPETITOR_UNDERCUT_PHP } from './pricing-engine.js';

/**
 * ============================================================================
 * TODO(KNOWLEDGE_BASE_LAYER): Expand / customize condo house rules here.
 * This decoupled layer holds the domain facts for Unit 418 Serin East Tagaytay.
 * ============================================================================
 */
export const KNOWLEDGE_BASE_LAYER = {
  pets: {
    id: 'pets',
    keywords: ['dog', 'dogs', 'pet', 'pets', 'cat', 'cats', 'aso', 'pusa', 'alaga', 'hayop', 'pet-friendly', 'puppy'],
    responses: {
      en: 'Small, well-behaved pets (such as small dogs and cats) are welcome upon prior coordination! Please bring pet diapers/wee pads and a pet carrier when walking through Serin East common areas.',
      tl: 'Welcome po ang maliliit at mababait na alagang hayop (tulad ng aso o pusa) basta ipagbigay-alam muna! Magdala lamang po ng pet diaper at carrier para sa common areas ng Serin East.',
      taglish: 'Yes po, pet-friendly tayo for small dogs and cats upon prior coordination! Just bring pet diapers and a carrier kapag dadaan sa Serin East common areas.'
    }
  },
  cooking: {
    id: 'cooking',
    keywords: ['cook', 'cooking', 'kitchen', 'stove', 'microwave', 'lutuan', 'magluto', 'luto', 'pagkain', 'fridge', 'ref', 'utensils', 'kalan'],
    responses: {
      en: 'Yes, light cooking is allowed! The kitchen features an induction stove, range hood, microwave, refrigerator, rice cooker, electric kettle, and cookware/utensils. Please avoid heavy or smelly frying (such as dried fish/tuyo).',
      tl: 'Opo, maaaring magluto ng light cooking sa unit! Kumpleto po ito sa induction stove, microwave, refrigerator, rice cooker, electric kettle, at mga gamit sa pagluluto. Iwasan lamang po ang malalansang prito gaya ng tuyo o daing.',
      taglish: 'Yes po, pwedeng mag-light cooking! Kompleto tayo with induction stove, microwave, ref, rice cooker, kettle, and basic cookware. Bawal lang po ang smelly frying like tuyo or daing.'
    }
  },
  checkin_checkout: {
    id: 'checkin_checkout',
    keywords: ['check-in', 'checkin', 'check-out', 'checkout', 'oras', 'time', 'anong oras', 'dating', 'alis'],
    responses: {
      en: 'Standard check-in time is 3:00 PM and check-out is 11:00 AM to allow ample time for professional sanitization.',
      tl: 'Ang standard check-in time ay 3:00 PM at ang check-out naman ay 11:00 AM para sa masusing paglilinis at sanitasyon ng unit.',
      taglish: 'Check-in is at 3:00 PM and check-out is at 11:00 AM po para may ample time for thorough sanitization between guests.'
    }
  },
  amenities_wifi: {
    id: 'amenities_wifi',
    keywords: ['wifi', 'wi-fi', 'internet', 'pool', 'swimming', 'amenities', 'paliguan', 'towels', 'netflix', 'tv'],
    responses: {
      en: 'Unit 418 includes high-speed fiber Wi-Fi, Smart TV with Netflix, hot & cold shower, fresh linens, and access to the Serin East swimming pool & garden amenity areas.',
      tl: 'Mayroong high-speed fiber Wi-Fi ang Unit 418, Smart TV na may Netflix, hot & cold shower, malinis na tuwalya, at access sa swimming pool at hardin ng Serin East.',
      taglish: 'Unit 418 is equipped with high-speed fiber Wi-Fi, Smart TV with Netflix, hot shower, fresh towels, plus access sa Serin East swimming pool and garden amenities.'
    }
  },
  parking_location: {
    id: 'parking_location',
    keywords: ['parking', 'park', 'sasakyan', 'location', 'address', 'saan', 'serin', 'ayala', 'simbahan', 'lourdes'],
    responses: {
      en: 'We are conveniently located at Unit 418 Serin East Tagaytay, Brgy. Silang Crossing East, right beside Ayala Malls Serin and Lourdes Church! Pay parking is available on-site.',
      tl: 'Matatagpuan po ang Unit 418 sa Serin East Tagaytay, Brgy. Silang Crossing East, katabi mismo ng Ayala Malls Serin at Lourdes Church! May available na on-site pay parking.',
      taglish: 'Very convenient location right beside Ayala Malls Serin and Lourdes Church sa Brgy. Silang Crossing East, Tagaytay City! May pay parking po sa building.'
    }
  },
  pricing_discounts: {
    id: 'pricing_discounts',
    keywords: ['rate', 'rates', 'price', 'pricing', 'magkano', 'how much', 'cost', 'discount', 'mura', 'bawas'],
    responses: {
      en: 'Our dynamic rates guarantee a ₱500/night undercut compared to the 10km Tagaytay 2BR market average! Plus enjoy 5% off for 3+ nights and 10% off for 7+ nights.',
      tl: 'Garantisadong mas mababa ng ₱500 bawat gabi ang presyo natin kumpara sa 10km Tagaytay 2BR market average! Dagdag pa ang 5% discount para sa 3+ nights at 10% discount para sa 7+ nights.',
      taglish: 'Guaranteed ₱500/night savings tayo compared sa 10km Tagaytay 2BR market average! May extra 5% off for 3+ nights and 10% off for 7+ nights weekly staycation.'
    }
  }
};

/**
 * Automatically detects whether text is primarily English, Tagalog, or Taglish.
 */
export function detectMessageLanguage(text) {
  if (!text) return 'en';
  const clean = text.toLowerCase();

  const tagalogMarkers = [
    'po', 'opo', 'ba', 'naman', 'kasi', 'dito', 'doon', 'namin', 'natin', 'inyo',
    'kami', 'tayo', 'sila', 'ito', 'iyan', 'iyon', 'magkano', 'saan', 'kailan',
    'paano', 'bakit', 'pwede', 'puwede', 'maaari', 'alaga', 'hayop', 'luto', 'lutuan',
    'aso', 'pusa', 'oras', 'dating', 'alis', 'bayad', 'bawat', 'gabi', 'matatagpuan',
    'walang', 'mayroon', 'meron', 'salamat'
  ];

  const englishMarkers = [
    'the', 'is', 'are', 'can', 'we', 'you', 'what', 'where', 'when', 'how', 'much',
    'allowed', 'allow', 'available', 'availability', 'booking', 'reservation', 'guest',
    'guests', 'stay', 'night', 'nights', 'price', 'cost', 'check',
    'in', 'out', 'room', 'rules', 'policy', 'thanks', 'thank'
  ];

  let tlScore = 0;
  let enScore = 0;

  const words = clean.split(/[^a-zA-Z0-9_-]+/).filter(Boolean);

  for (const word of words) {
    if (tagalogMarkers.includes(word)) tlScore++;
    if (englishMarkers.includes(word)) enScore++;
  }

  // Taglish patterns: mixing Tagalog markers with substantive English content words
  const isTaglish = (tlScore >= 1 && enScore >= 1) ||
    /\b(allowed\s+ba|pwede\s+ba\s+mag|mag-cook|mag-book|i-book|nag-book)\b/i.test(clean);

  if (isTaglish) {
    return 'taglish';
  }

  if (tlScore > 0 && enScore === 0) {
    return 'tl';
  }

  if (tlScore > enScore) {
    return 'tl';
  }

  return 'en';
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
 * Synchronous deterministic trilingual agent resolver.
 */
export function resolveGuestAgentReply(userMessage, context = {}) {
  const language = detectMessageLanguage(userMessage);
  const clean = (userMessage || '').toLowerCase();
  const bookedRanges = context.bookedRanges || [];

  const entities = extractBookingEntities(userMessage);

  // Check if query is asking for date booking / availability quote
  if (entities.startDate && entities.endDate) {
    const isConflict = bookedRanges.some(r => entities.startDate < r.to && entities.endDate > r.from);

    if (isConflict) {
      const conflictMsgs = {
        en: `Sorry, the dates from ${entities.startDate} to ${entities.endDate} are not available due to an existing booking. Please pick another date range on the calendar!`,
        tl: `Paumanhin po, may nakareserba na sa petsang ${entities.startDate} hanggang ${entities.endDate}. Maaari po kayong pumili ng ibang available na araw sa kalendaryo!`,
        taglish: `Sorry po, occupied na ang ${entities.startDate} to ${entities.endDate} on our calendar. Please select other dates po!`
      };
      return {
        topic: 'availability_conflict',
        language,
        text: conflictMsgs[language] || conflictMsgs.en,
        hasQuote: false,
        bookingAction: null
      };
    }

    const guestCount = entities.guestCount || 2;
    const quote = calculateStayQuote(entities.startDate, entities.endDate, guestCount);

    if (quote) {
      const savings = quote.totalSavingsVsMarket || quote.totalSavings || 0;
      const availMsgs = {
        en: `Great news! Unit 418 is available from ${entities.startDate} to ${entities.endDate} (${quote.nights} night${quote.nights > 1 ? 's' : ''}) for ${guestCount} guest(s). Confirmed total is ₱${quote.totalPrice.toLocaleString('en-US')} (saving ₱${savings.toLocaleString('en-US')} vs market).`,
        tl: `Magandang balita! Available ang Unit 418 mula ${entities.startDate} hanggang ${entities.endDate} (${quote.nights} gabi) para sa ${guestCount} bisita. Ang kabuuang bayad ay ₱${quote.totalPrice.toLocaleString('en-US')} (nakatipid ng ₱${savings.toLocaleString('en-US')}).`,
        taglish: `Available po ang Unit 418 from ${entities.startDate} to ${entities.endDate} (${quote.nights} nights) for ${guestCount} guests! Total is ₱${quote.totalPrice.toLocaleString('en-US')} with ₱${savings.toLocaleString('en-US')} total savings vs 10km market.`
      };

      return {
        topic: 'booking_quote',
        language,
        text: availMsgs[language] || availMsgs.en,
        hasQuote: true,
        bookingAction: {
          startDate: entities.startDate,
          endDate: entities.endDate,
          guestCount: guestCount,
          totalPrice: quote.totalPrice,
          quote: quote
        }
      };
    }
  }

  // Match against Knowledge Base Layer
  for (const key of Object.keys(KNOWLEDGE_BASE_LAYER)) {
    const item = KNOWLEDGE_BASE_LAYER[key];
    const matched = item.keywords.some(kw => clean.includes(kw));
    if (matched) {
      return {
        topic: item.id,
        language,
        text: item.responses[language] || item.responses.en,
        hasQuote: false,
        bookingAction: null
      };
    }
  }

  // Default fallback welcome / guidance
  const defaultReplies = {
    en: 'Hello! I am your Unit 418 Serin East Tagaytay AI concierge. You can ask me about house rules (e.g. "are dogs allowed?", "can we cook?"), amenities, check-in times, or check date availability!',
    tl: 'Kumusta po! Ako ang inyong Unit 418 Serin East Tagaytay AI concierge. Maaari ninyong itanong ang tungkol sa house rules (hal. "pwede ba ang aso?", "maaari bang magluto?"), amenities, o mag-check ng bakanteng petsa!',
    taglish: 'Hi po! I am your Unit 418 Serin East Tagaytay AI concierge. Feel free to ask about house rules ("allowed ba dogs?", "pwede ba mag-cook?"), amenities, or check available dates!'
  };

  return {
    topic: 'general_help',
    language,
    text: defaultReplies[language] || defaultReplies.en,
    hasQuote: false,
    bookingAction: null
  };
}

/**
 * Hybrid Generator using Chrome's built-in Gemini Nano (window.ai) with fallback.
 */
export async function generateHybridAgentReply(userMessage, context = {}, aiNamespace = null) {
  const fallbackResult = resolveGuestAgentReply(userMessage, context);

  // Check if Chrome Built-in AI (Prompt API) is available
  const ai = aiNamespace || (typeof window !== 'undefined' && (window.ai || window.model));

  if (ai && ai.languageModel) {
    try {
      const capabilities = await ai.languageModel.capabilities();
      if (capabilities && capabilities.available !== 'no') {
        const systemPrompt = `You are the friendly guest-relations concierge for Unit 418 Serin East Tagaytay.
Ground your answer strictly on these facts:
- Pets: Small well-behaved pets allowed with diaper and carrier in common areas upon coordination.
- Cooking: Light cooking allowed with induction stove, microwave, rice cooker, kettle, fridge. No smelly frying like tuyo.
- Check-in: 3:00 PM, Check-out: 11:00 AM.
- Location: Unit 418 Serin East Tagaytay, Brgy. Silang Crossing East, beside Ayala Malls Serin.
- Pricing: Guaranteed ₱500/night undercut vs 10km market benchmark.
Answer in the same language as the guest (English, Tagalog, or Taglish). Keep it concise (1-3 sentences).`;

        const session = await ai.languageModel.create({
          systemPrompt: systemPrompt
        });

        const prompt = `Guest inquiry: ${userMessage}\nConcierge answer:`;
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
      // Gracefully fall back to deterministic trilingual responder
      console.warn('[GuestAgent] Chrome Gemini Nano call failed or not ready, falling back to deterministic NLU:', err);
    }
  }

  return {
    ...fallbackResult,
    engine: 'deterministic-fallback'
  };
}
