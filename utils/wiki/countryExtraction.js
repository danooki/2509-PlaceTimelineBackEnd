// ─────────────────────────────────────────────────────────────
//  Wiki Country Extraction Utilities
//  Handles country detection and extraction from Wikipedia summaries
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
