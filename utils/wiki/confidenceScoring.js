// ─────────────────────────────────────────────────────────────
//  Wiki Confidence Scoring Utilities
//  Handles confidence calculation and scoring for Wikipedia search results
// ─────────────────────────────────────────────────────────────

import { normalizeText } from "./textNormalization.js";
import { isPlace } from "./placeDetection.js";

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
// Enhanced confidence calculation with place filtering
//  @param {string} query - Original search query
//  @param {string} title - Wikipedia article title
//  @param {string} snippet - Article snippet
//  @returns {number} - Confidence score between 0 and 1 (0 if not a place)
// ─────────────────────────────────────────────────────────────
export function calculatePlaceConfidence(query, title, snippet) {
  // First check if it's a place
  const placeCheck = isPlace(title, snippet);

  if (!placeCheck.isPlace) {
    return 0; // Not a place, return 0 confidence
  }

  // Calculate base confidence using existing method
  const baseConfidence = calculateConfidence(query, title, snippet);

  // Boost confidence for places
  const placeBoost = placeCheck.confidence * 0.2;

  // Apply place type bonus
  let typeBonus = 0;
  switch (placeCheck.placeType) {
    case "city":
      typeBonus = 0.1;
      break;
    case "building":
      typeBonus = 0.05;
      break;
    case "landmark":
      typeBonus = 0.05;
      break;
    case "area":
      typeBonus = 0.02;
      break;
  }

  const finalConfidence = Math.min(
    baseConfidence + placeBoost + typeBonus,
    1.0
  );

  return finalConfidence;
}
