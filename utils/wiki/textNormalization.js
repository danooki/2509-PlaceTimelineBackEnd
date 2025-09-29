// ─────────────────────────────────────────────────────────────
//  Wiki Text Normalization Utilities
//  Handles basic text processing, normalization, and snippet cleaning
// ─────────────────────────────────────────────────────────────

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
