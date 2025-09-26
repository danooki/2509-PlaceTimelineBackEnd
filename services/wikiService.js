import axios from "axios";
import {
  extractCountryFromSummary,
  calculateConfidence,
  cleanSnippet,
} from "./wikiTextProcessor.js";
import { WikiTimeoutError, WikiNotFoundError } from "./wikiErrors.js";

// ─────────────────────────────────────────────────────────────
//  WikiService - Modern ES6+ Wikipedia API integration
//  Uses functional programming with direct environment variable access
// ─────────────────────────────────────────────────────────────

// Minimal configuration - main settings from .env file
const WIKI_BASE_URL = process.env.WIKIPEDIA_API_BASE_URL;
const WIKI_USER_AGENT = process.env.WIKIPEDIA_USER_AGENT;
const WIKI_TIMEOUT = parseInt(process.env.WIKIPEDIA_TIMEOUT);
const WIKI_BATCH_TIMEOUT = parseInt(process.env.WIKIPEDIA_BATCH_TIMEOUT);
const SEARCH_LIMIT = parseInt(process.env.WIKIPEDIA_SEARCH_LIMIT);
const RETURN_LIMIT = parseInt(process.env.WIKIPEDIA_RETURN_LIMIT);

// Fixed constants (not configurable)
const WIKI_SEARCH_URL = "https://en.wikipedia.org/w/api.php";

// ─────────────────────────────────────────────────────────────
//  Get search suggestions for a query - FUZZY MATCHING APPROACH
//  @param {string} query - Search query (place name, building, etc.)
//  @returns {Promise<Array>} - Array of search suggestions with confidence scores
// ─────────────────────────────────────────────────────────────
export const searchSuggestions = async (query) => {
  try {
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      throw new Error("Invalid search query");
    }

    const cleanQuery = query.trim();
    console.log(`Getting search suggestions for: "${cleanQuery}"`);

    // Use Wikipedia's search API for fuzzy matching
    const params = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: cleanQuery,
      srlimit: SEARCH_LIMIT,
      srprop: "snippet|timestamp|size",
      format: "json",
      origin: "*",
    });

    const response = await axios.get(`${WIKI_SEARCH_URL}?${params}`, {
      timeout: WIKI_TIMEOUT,
      headers: {
        "User-Agent": WIKI_USER_AGENT,
      },
    });

    if (!response.data || !response.data.query || !response.data.query.search) {
      return [];
    }

    const searchResults = response.data.query.search;

    // Process and enhance the search results
    const suggestions = await Promise.all(
      searchResults.map(async (result) => {
        const confidence = calculateConfidence(
          cleanQuery,
          result.title,
          result.snippet
        );

        // Get additional info for each suggestion
        let thumbnail = null;
        let country = null;

        try {
          // Get summary for thumbnail and country info
          const summaryUrl = `${WIKI_BASE_URL}/page/summary/${encodeURIComponent(
            result.title
          )}`;
          const summaryResponse = await axios.get(summaryUrl, {
            timeout: WIKI_BATCH_TIMEOUT,
            headers: {
              "User-Agent": WIKI_USER_AGENT,
            },
          });

          if (summaryResponse.data) {
            thumbnail = summaryResponse.data.thumbnail?.source || null;
            country =
              extractCountryFromSummary(summaryResponse.data.extract) || null;
          }
        } catch (error) {
          // If summary fails, continue without thumbnail/country
          console.log(
            `Could not get summary for "${result.title}": ${error.message}`
          );
        }

        return {
          title: result.title,
          snippet: cleanSnippet(result.snippet),
          confidence: confidence,
          thumbnail: thumbnail,
          country: country,
          size: result.size,
          timestamp: result.timestamp,
        };
      })
    );

    // Sort by confidence (highest first) and return top 3
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, RETURN_LIMIT);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new WikiTimeoutError();
    }

    console.error(`Search suggestions failed: ${error.message}`);
    throw new Error(`Search suggestions failed: ${error.message}`);
  }
};

// ─────────────────────────────────────────────────────────────
//  Search for a Wikipedia article by query - SINGLE METHOD APPROACH
//  @param {string} query - Search query (place name, building, etc.)
//  @returns {Promise<Object>} - Article summary with key info for timeline
// ─────────────────────────────────────────────────────────────
export const searchArticle = async (query) => {
  try {
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      throw new Error("Invalid search query");
    }

    const cleanQuery = query.trim();

    // Use Wikipedia Summary API for fastest response
    const summaryUrl = `${WIKI_BASE_URL}/page/summary/${encodeURIComponent(
      cleanQuery
    )}`;

    const response = await axios.get(summaryUrl, {
      timeout: WIKI_TIMEOUT,
      headers: {
        "User-Agent": WIKI_USER_AGENT,
      },
    });

    if (response.data && response.data.title) {
      return {
        name: response.data.title,
        summary: response.data.extract || "",
        thumbnail: response.data.thumbnail?.source || null,
        url: response.data.content_urls?.desktop?.page || null,
        coordinates: response.data.coordinates || null,
        type: response.data.type || null,
        country: extractCountryFromSummary(response.data.extract) || null,
      };
    }

    throw new WikiNotFoundError(query);
  } catch (error) {
    if (error.response?.status === 404) {
      throw new WikiNotFoundError(query);
    }

    if (error.code === "ECONNABORTED") {
      throw new WikiTimeoutError();
    }

    if (
      error instanceof WikiNotFoundError ||
      error instanceof WikiTimeoutError
    ) {
      throw error;
    }

    throw new Error(`Wikipedia API error: ${error.message}`);
  }
};
