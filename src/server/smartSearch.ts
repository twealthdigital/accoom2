// src/server/smartSearch.ts

export interface ParsedSearchQuery {
  extractedLocation?: string;
  extractedBedrooms?: number;
  extractedPropertyType?: string;
  extractedMinPrice?: number;
  extractedMaxPrice?: number;
  extractedAmenities?: string[];
  cleanKeyword: string;
}

const KNOWN_LOCATIONS: { [key: string]: string } = {
  akungba: 'Akungba',
  aaua: 'Akungba',
  ikare: 'Ikare',
  akure: 'Akure',
  ondo: 'Ondo',
  lagos: 'Lagos',
  abuja: 'Abuja',
  ibadan: 'Ibadan',
  lekki: 'Lagos',
  maitama: 'Abuja',
  medoline: 'Akungba',
  permanent: 'Akungba',
  gate: 'Akungba',
};

const KNOWN_TYPES: { [key: string]: string } = {
  'self contain': 'Self-Contained',
  'self-contain': 'Self-Contained',
  'selfcontained': 'Self-Contained',
  'room and parlour': 'Room & Parlour',
  'mini flat': '1 Bedroom Flat',
  'flat': 'Flat',
  'duplex': 'Duplex',
  'villa': 'Duplex',
  'lodge': 'Student Lodge',
  'studio': 'Studio',
  'apartment': 'Apartment',
};

export function parseNaturalLanguageQuery(query: string): ParsedSearchQuery {
  let text = (query || '').toLowerCase().trim();
  const result: ParsedSearchQuery = {
    cleanKeyword: text,
  };

  if (!text) return result;

  // 1. Normalize common typos & noise
  text = text
    .replace(/accomodation/g, 'accommodation')
    .replace(/accomadation/g, 'accommodation')
    .replace(/accomidation/g, 'accommodation')
    .replace(/acoom/g, 'accommodation')
    .replace(/aprtment/g, 'apartment')
    .replace(/bed room/g, 'bedroom')
    .replace(/bed-room/g, 'bedroom');

  // 2. Extract bedrooms: "1 bed", "2 bedroom", "3 beds", "2 bdrm", "single room"
  const bedMatch = text.match(/(\d+)\s*(?:bed|bedroom|bdrm|bds)/i);
  if (bedMatch) {
    result.extractedBedrooms = parseInt(bedMatch[1], 10);
    text = text.replace(bedMatch[0], '').trim();
  } else if (text.includes('single room') || text.includes('one bedroom')) {
    result.extractedBedrooms = 1;
  }

  // 3. Extract Locations
  for (const [key, normalized] of Object.entries(KNOWN_LOCATIONS)) {
    if (new RegExp(`\\b${key}\\b`, 'i').test(text)) {
      result.extractedLocation = normalized;
      text = text.replace(new RegExp(`\\bin\\s+${key}\\b|\\bat\\s+${key}\\b|\\b${key}\\b`, 'gi'), '').trim();
      break;
    }
  }

  // 4. Extract Property Types
  for (const [key, normalized] of Object.entries(KNOWN_TYPES)) {
    if (text.includes(key)) {
      result.extractedPropertyType = normalized;
      text = text.replace(key, '').trim();
      break;
    }
  }

  // 5. Extract Price hints (e.g. "cheap", "under 200k", "below 300000")
  if (text.includes('cheap') || text.includes('affordable') || text.includes('budget')) {
    result.extractedMaxPrice = 250000;
  }
  const maxPriceMatch = text.match(/(?:under|below|less than)\s*₦?\s*(\d+)(?:k|000)?/i);
  if (maxPriceMatch) {
    let p = parseInt(maxPriceMatch[1], 10);
    if (p < 1000) p = p * 1000;
    result.extractedMaxPrice = p;
  }

  // 6. Remaining meaningful tokens
  result.cleanKeyword = text.replace(/\b(in|at|for|near|with|and|the|a|of)\b/gi, '').trim();

  return result;
}
