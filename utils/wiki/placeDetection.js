// ─────────────────────────────────────────────────────────────
//  Wiki Place Detection Utilities
//  Handles place identification and classification from Wikipedia articles
// ─────────────────────────────────────────────────────────────

import { normalizeText } from "./textNormalization.js";

// ─────────────────────────────────────────────────────────────
// Check if a Wikipedia article is a place (building, city, landmark, area)
//  @param {string} title - Wikipedia article title
//  @param {string} snippet - Article snippet
//  @returns {Object} - {isPlace: boolean, placeType: string, confidence: number}
// ─────────────────────────────────────────────────────────────
export function isPlace(title, snippet) {
  if (!title || !snippet) {
    return { isPlace: false, placeType: null, confidence: 0 };
  }

  const normalizedTitle = normalizeText(title);
  const normalizedSnippet = normalizeText(snippet);
  const combinedText = `${normalizedTitle} ${normalizedSnippet}`;

  // Place type indicators with confidence weights
  const placeIndicators = {
    // Buildings and structures
    building: {
      keywords: [
        "tower",
        "building",
        "palace",
        "castle",
        "cathedral",
        "church",
        "mosque",
        "temple",
        "monument",
        "statue",
        "bridge",
        "stadium",
        "museum",
        "library",
        "theater",
        "theatre",
        "opera",
        "hotel",
        "station",
        "airport",
        "harbor",
        "harbour",
        "port",
        "fort",
        "fortress",
        "wall",
        "gate",
        "arch",
        "dome",
        "spire",
        "skyscraper",
        "mansion",
        "villa",
        "chateau",
        "basilica",
        "chapel",
        "synagogue",
        "shrine",
        "obelisk",
        "lighthouse",
        "windmill",
        "mill",
        "factory",
        "warehouse",
        "market",
        "bazaar",
        "plaza",
        "square",
        "piazza",
      ],
      weight: 0.8,
    },

    // Cities and urban areas
    city: {
      keywords: [
        "city",
        "town",
        "village",
        "municipality",
        "metropolis",
        "capital",
        "borough",
        "district",
        "neighborhood",
        "neighbourhood",
        "quarter",
        "downtown",
        "uptown",
        "suburb",
        "suburbs",
        "urban",
        "metropolitan",
        "municipal",
        "civic",
        "downtown",
      ],
      weight: 0.9,
    },

    // Landmarks and natural places
    landmark: {
      keywords: [
        "landmark",
        "monument",
        "memorial",
        "park",
        "garden",
        "plaza",
        "square",
        "piazza",
        "boulevard",
        "avenue",
        "street",
        "road",
        "highway",
        "bridge",
        "tunnel",
        "valley",
        "mountain",
        "hill",
        "peak",
        "river",
        "lake",
        "bay",
        "beach",
        "coast",
        "shore",
        "island",
        "peninsula",
        "desert",
        "forest",
        "jungle",
        "canyon",
        "gorge",
        "waterfall",
        "volcano",
        "crater",
        "cave",
        "grotto",
        "cliff",
        "plateau",
        "plain",
        "prairie",
      ],
      weight: 0.7,
    },

    // Areas and regions
    area: {
      keywords: [
        "region",
        "area",
        "zone",
        "district",
        "province",
        "state",
        "county",
        "territory",
        "republic",
        "kingdom",
        "empire",
        "nation",
        "country",
        "continent",
        "hemisphere",
        "peninsula",
        "archipelago",
        "island",
        "islands",
        "coast",
        "shoreline",
        "border",
        "frontier",
        "boundary",
        "territory",
        "colony",
        "settlement",
        "outpost",
      ],
      weight: 0.6,
    },
  };

  // Negative indicators (things that are NOT places)
  const negativeIndicators = [
    "person",
    "people",
    "human",
    "man",
    "woman",
    "child",
    "baby",
    "family",
    "person",
    "artist",
    "writer",
    "author",
    "poet",
    "musician",
    "singer",
    "actor",
    "actress",
    "director",
    "producer",
    "scientist",
    "inventor",
    "philosopher",
    "politician",
    "president",
    "king",
    "queen",
    "emperor",
    "empress",
    "prince",
    "princess",
    "war",
    "battle",
    "conflict",
    "revolution",
    "movement",
    "organization",
    "company",
    "corporation",
    "business",
    "industry",
    "technology",
    "invention",
    "discovery",
    "theory",
    "concept",
    "idea",
    "philosophy",
    "religion",
    "belief",
    "culture",
    "language",
    "music",
    "art",
    "literature",
    "book",
    "novel",
    "poem",
    "song",
    "movie",
    "film",
    "television",
    "radio",
    "newspaper",
    "magazine",
    "website",
    "software",
    "application",
    "game",
    "sport",
    "team",
    "player",
    "coach",
  ];

  // Check for negative indicators first
  const hasNegativeIndicators = negativeIndicators.some((indicator) =>
    combinedText.includes(normalizeText(indicator))
  );

  if (hasNegativeIndicators) {
    return { isPlace: false, placeType: null, confidence: 0.1 };
  }

  // Calculate confidence for each place type
  let maxConfidence = 0;
  let bestPlaceType = null;

  for (const [placeType, config] of Object.entries(placeIndicators)) {
    let matches = 0;
    let totalKeywords = config.keywords.length;

    for (const keyword of config.keywords) {
      if (combinedText.includes(normalizeText(keyword))) {
        matches++;
      }
    }

    const confidence = (matches / totalKeywords) * config.weight;

    if (confidence > maxConfidence) {
      maxConfidence = confidence;
      bestPlaceType = placeType;
    }
  }

  // Additional checks for common place patterns
  const placePatterns = [
    // "X Tower", "X Building", "X Palace", etc.
    /\b(tower|building|palace|castle|cathedral|church|mosque|temple|monument|statue|bridge|stadium|museum|library|theater|theatre|opera|hotel|station|airport|harbor|harbour|port|fort|fortress|wall|gate|arch|dome|spire|skyscraper|mansion|villa|chateau|basilica|chapel|synagogue|shrine|obelisk|lighthouse|windmill|mill|factory|warehouse|market|bazaar|plaza|square|piazza)\b/i,

    // "X City", "X Town", "X Village", etc.
    /\b(city|town|village|municipality|metropolis|capital|borough|district|neighborhood|neighbourhood|quarter|downtown|uptown|suburb|suburbs|urban|metropolitan|municipal|civic)\b/i,

    // Geographic features
    /\b(park|garden|plaza|square|piazza|boulevard|avenue|street|road|highway|bridge|tunnel|valley|mountain|hill|peak|river|lake|bay|beach|coast|shore|island|peninsula|desert|forest|jungle|canyon|gorge|waterfall|volcano|crater|cave|grotto|cliff|plateau|plain|prairie)\b/i,
  ];

  const hasPlacePattern = placePatterns.some((pattern) =>
    pattern.test(combinedText)
  );

  if (hasPlacePattern && maxConfidence < 0.3) {
    maxConfidence = 0.3;
    bestPlaceType = bestPlaceType || "landmark";
  }

  // Final confidence threshold
  const isPlaceResult = maxConfidence >= 0.2;

  return {
    isPlace: isPlaceResult,
    placeType: isPlaceResult ? bestPlaceType : null,
    confidence: maxConfidence,
  };
}
