import express from "express";
import { searchSuggestions } from "../services/wikiService.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
//  POST /search/suggestions - Get search suggestions for a query
//  @param {string} query - Search query (place name, building, etc.)
//  @returns {Object} - Array of search suggestions with confidence scores
// ─────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    // Input validation
    const { query } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid search query",
        code: "INVALID_INPUT",
      });
    }

    const cleanQuery = query.trim();

    // Minimum query length validation
    if (cleanQuery.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Query must be at least 2 characters long",
        code: "QUERY_TOO_SHORT",
      });
    }

    // Maximum query length validation
    if (cleanQuery.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Query must be less than 100 characters",
        code: "QUERY_TOO_LONG",
      });
    }

    // Get search suggestions from Wikipedia
    console.log(`Getting search suggestions for: "${cleanQuery}"`);
    const suggestions = await searchSuggestions(cleanQuery);

    // Format response
    const response = {
      success: true,
      data: {
        query: cleanQuery,
        suggestions: suggestions,
        total_found: suggestions.length,
        timestamp: new Date().toISOString(),
      },
    };

    console.log(`Found ${suggestions.length} suggestions for: "${cleanQuery}"`);
    res.json(response);
  } catch (error) {
    console.error(`Search suggestions failed: ${error.message}`);

    // Handle specific error types
    if (error.message.includes("timeout")) {
      return res.status(408).json({
        success: false,
        error: "Search request timed out - please try again",
        code: "TIMEOUT",
      });
    }

    if (error.message.includes("API error")) {
      return res.status(503).json({
        success: false,
        error: "Wikipedia service temporarily unavailable",
        code: "SERVICE_UNAVAILABLE",
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /search/suggestions - Health check for search suggestions
//  @returns {Object} - Service status
// ─────────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Search suggestions service is running",
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: "Get search suggestions for a query",
      GET: "Service health check",
    },
  });
});

export default router;
