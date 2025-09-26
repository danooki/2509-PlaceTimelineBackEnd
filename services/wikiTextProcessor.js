// ─────────────────────────────────────────────────────────────
//  WikiTextProcessor - Text processing utilities for Wikipedia data
//  Handles text normalization, country extraction, confidence scoring, and snippet cleaning
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Extract country from Wikipedia summary text
//  @param {string} summary - Wikipedia article summary
//  @returns {string|null} - Country name or null if not found
// ─────────────────────────────────────────────────────────────
export function extractCountryFromSummary(summary) {
  if (!summary) return null;

  // Common country patterns in Wikipedia summaries
  const countryPatterns = [
    // "in [Country]" patterns
    /\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[,.]/g,
    // "of [Country]" patterns
    /\bof\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[,.]/g,
    // "located in [Country]" patterns
    /\blocated\s+in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[,.]/g,
  ];

  // Common countries to look for
  const commonCountries = [
    "France",
    "Germany",
    "Italy",
    "Spain",
    "United Kingdom",
    "United States",
    "Japan",
    "China",
    "India",
    "Brazil",
    "Canada",
    "Australia",
    "Russia",
    "Mexico",
    "Argentina",
    "Chile",
    "Peru",
    "Colombia",
    "Venezuela",
    "Egypt",
    "South Africa",
    "Nigeria",
    "Kenya",
    "Morocco",
    "Tunisia",
    "Turkey",
    "Greece",
    "Portugal",
    "Netherlands",
    "Belgium",
    "Switzerland",
    "Austria",
    "Poland",
    "Czech Republic",
    "Hungary",
    "Romania",
    "Bulgaria",
    "Sweden",
    "Norway",
    "Denmark",
    "Finland",
    "Iceland",
    "Ireland",
  ];

  for (const pattern of countryPatterns) {
    const matches = summary.match(pattern);
    if (matches) {
      for (const match of matches) {
        const country = match
          .replace(/^(in|of|located in)\s+/i, "")
          .replace(/[,.]$/, "")
          .trim();
        if (commonCountries.includes(country)) {
          return country;
        }
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// Calculate confidence score for search suggestions
//  @param {string} query - Original search query
//  @param {string} title - Wikipedia article title
//  @param {string} snippet - Article snippet
//  @returns {number} - Confidence score between 0 and 1
// ─────────────────────────────────────────────────────────────
export function calculateConfidence(query, title, snippet) {
  const normalizedQuery = normalizeText(query);
  const normalizedTitle = normalizeText(title);
  const normalizedSnippet = normalizeText(snippet);

  let confidence = 0;

  // Exact title match (highest priority)
  if (normalizedTitle === normalizedQuery) {
    confidence = 1.0;
  }
  // Title contains query
  else if (normalizedTitle.includes(normalizedQuery)) {
    confidence = 0.9;
  }
  // Query contains title (partial match)
  else if (normalizedQuery.includes(normalizedTitle)) {
    confidence = 0.8;
  }
  // Word-based matching
  else {
    const queryWords = normalizedQuery.split(/\s+/);
    const titleWords = normalizedTitle.split(/\s+/);
    const snippetWords = normalizedSnippet.split(/\s+/);

    let wordMatches = 0;
    let totalWords = queryWords.length;

    // Check word matches in title
    queryWords.forEach((queryWord) => {
      if (queryWord.length > 2) {
        // Ignore short words
        if (
          titleWords.some(
            (titleWord) =>
              titleWord.includes(queryWord) || queryWord.includes(titleWord)
          )
        ) {
          wordMatches++;
        }
      }
    });

    // Boost confidence if snippet also contains query words
    let snippetMatches = 0;
    queryWords.forEach((queryWord) => {
      if (queryWord.length > 2 && normalizedSnippet.includes(queryWord)) {
        snippetMatches++;
      }
    });

    confidence =
      (wordMatches / totalWords) * 0.7 + (snippetMatches / totalWords) * 0.3;
  }

  // Apply length penalty for very short queries
  if (query.length < 3) {
    confidence *= 0.5;
  }

  return Math.min(Math.max(confidence, 0), 1); // Ensure between 0 and 1
}

// ─────────────────────────────────────────────────────────────
// Normalize text for comparison (remove diacritics, lowercase, etc.)
//  @param {string} text - Text to normalize
//  @returns {string} - Normalized text
// ─────────────────────────────────────────────────────────────
export function normalizeText(text) {
  if (!text) return "";

  return text
    .toLowerCase()
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .trim();
}

// ─────────────────────────────────────────────────────────────
// Clean and format snippet text
//  @param {string} snippet - Raw snippet from Wikipedia
//  @returns {string} - Cleaned snippet
// ─────────────────────────────────────────────────────────────
export function cleanSnippet(snippet) {
  if (!snippet) return "";

  return snippet
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&[a-zA-Z0-9#]+;/g, " ") // Remove HTML entities
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}
