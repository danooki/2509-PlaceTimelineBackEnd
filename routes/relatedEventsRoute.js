import express from "express";
import { findRelatedEvents } from "../services/relatedEventsService.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
//  POST /related-events - Find related historical events for a place
//  @param {Object} placeData - Place information with dates and location
//  @returns {Object} - Related historical events organized by category
// ─────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    // Input validation
    const { placeData } = req.body;

    if (!placeData || typeof placeData !== "object") {
      return res.status(400).json({
        success: false,
        error: "Invalid place data provided",
        code: "INVALID_INPUT",
      });
    }

    // Validate required fields
    const { name } = placeData;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Place name is required",
        code: "MISSING_PLACE_NAME",
      });
    }

    // Validate optional fields
    const cleanPlaceData = {
      name: name.trim(),
      construction_start: placeData.construction_start || null,
      construction_end: placeData.construction_end || null,
      country: placeData.country || null,
      date_precision: placeData.date_precision || null,
    };

    // Find related historical events
    console.log(`Finding related events for: "${cleanPlaceData.name}"`);
    const relatedEvents = await findRelatedEvents(cleanPlaceData);

    // Format response
    const response = {
      success: true,
      data: relatedEvents,
      timestamp: new Date().toISOString(),
    };

    console.log(
      `Found ${relatedEvents.total_events} related events for: "${cleanPlaceData.name}"`
    );
    res.json(response);
  } catch (error) {
    console.error(`Related events search failed: ${error.message}`);

    // Handle specific error types
    if (error.message.includes("timeout")) {
      return res.status(408).json({
        success: false,
        error: "Related events search timed out - please try again",
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

    if (error.message.includes("Invalid place data")) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: "INVALID_PLACE_DATA",
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
//  GET /related-events - Health check for related events service
//  @returns {Object} - Service status
// ─────────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Related events service is running",
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: "Find related historical events for a place",
      GET: "Service health check",
    },
  });
});

export default router;
