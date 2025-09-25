import express from "express";
import wikiService from "../services/wikiService.js";
import openaiService from "../services/openaiService.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
//  POST /timeline - Create timeline data for a place
//  @param {string} query - Search query (place name, building, etc.)
//  @returns {Object} - Complete timeline data with Wikipedia info and dates
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

    // Step 1: Get Wikipedia data
    console.log(`Searching Wikipedia for: "${cleanQuery}"`);
    const wikiData = await wikiService.searchArticle(cleanQuery);

    // Step 2: Extract dates using OpenAI
    console.log(`Extracting dates for: "${wikiData.name}"`);
    const dateData = await openaiService.extractDates(
      wikiData.summary,
      wikiData.name
    );

    // Step 3: Combine and format response
    const timelineData = {
      success: true,
      data: {
        // Wikipedia data
        name: wikiData.name,
        summary: wikiData.summary,
        thumbnail: wikiData.thumbnail,
        url: wikiData.url,
        coordinates: wikiData.coordinates,
        type: wikiData.type,
        country: wikiData.country,

        // Extracted dates
        construction_start: dateData.construction_start,
        construction_end: dateData.construction_end,
        date_precision: dateData.date_precision,
        status: dateData.status,
        extracted_at: dateData.extracted_at,
      },
    };

    console.log(`Timeline created successfully for: "${wikiData.name}"`);
    res.json(timelineData);
  } catch (error) {
    console.error(`Timeline creation failed: ${error.message}`);

    // Handle specific error types
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: "NOT_FOUND",
      });
    }

    if (error.message.includes("timeout")) {
      return res.status(408).json({
        success: false,
        error: error.message,
        code: "TIMEOUT",
      });
    }

    if (error.message.includes("quota") || error.message.includes("API key")) {
      return res.status(503).json({
        success: false,
        error: "AI service temporarily unavailable",
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

export default router;
