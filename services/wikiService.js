import axios from "axios";

// ─────────────────────────────────────────────────────────────
//  WikiService - Handles Wikipedia API integration
// Provides methods to search and extract content from Wikipedia articles
// ─────────────────────────────────────────────────────────────

class WikiService {
  constructor() {
    this.baseUrl = "https://en.wikipedia.org/api/rest_v1";
    this.timeout = 5000; // 5 seconds timeout for Wikipedia API
  }

  // ─────────────────────────────────────────────────────────────
  //  Search for a Wikipedia article by query - SINGLE METHOD APPROACH
  //  @param {string} query - Search query (place name, building, etc.)
  //  @returns {Promise<Object>} - Article summary with key info for timeline
  // ─────────────────────────────────────────────────────────────
  async searchArticle(query) {
    try {
      if (!query || typeof query !== "string" || query.trim().length === 0) {
        throw new Error("Invalid search query");
      }

      const cleanQuery = query.trim();

      // Use Wikipedia Summary API for fastest response
      const summaryUrl = `${this.baseUrl}/page/summary/${encodeURIComponent(
        cleanQuery
      )}`;

      const response = await axios.get(summaryUrl, {
        timeout: this.timeout,
        headers: {
          "User-Agent": "PlaceTimeline/1.0 (https://github.com/your-repo)",
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
          country:
            this.extractCountryFromSummary(response.data.extract) || null,
        };
      }

      throw new Error("No Wikipedia article found");
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`No Wikipedia article found for "${query}"`);
      }

      if (error.code === "ECONNABORTED") {
        throw new Error("Wikipedia API timeout - please try again");
      }

      throw new Error(`Wikipedia API error: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Extract country from Wikipedia summary text
  //  @param {string} summary - Wikipedia article summary
  //  @returns {string|null} - Country name or null if not found
  // ─────────────────────────────────────────────────────────────
  extractCountryFromSummary(summary) {
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
}

export default new WikiService();
