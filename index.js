// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

// Import required packages
import express from "express";

// Import middleware
import corsMiddleware from "./middleware/cors.js";
import webRateLimiter from "./middleware/webRateLimiter.js";
import aiRateLimiter from "./middleware/aiRateLimiter.js";
import errorHandler from "./middleware/errorHandler.js";

// Import routes
import healthRoutes from "./routes/healthRoute.js";
import timelineCreatorRoutes from "./routes/timelineCreatorRoute.js";
import searchSuggestionsRoutes from "./routes/searchSuggestionsRoute.js";
import relatedEventsRoutes from "./routes/relatedEventsRoute.js";

const app = express(); // Create Express application
app.use(express.json()); // Enables JSON parsing for POST requests

// Backend port
const port = process.env.PORT;

// Apply middleware
app.use(corsMiddleware);

// Routes
app.use("/health", healthRoutes); // endpoint for backend health check
app.use("/api/search/suggestions", webRateLimiter, searchSuggestionsRoutes); // search suggestions with rate limiting
app.use("/api/timeline", aiRateLimiter, timelineCreatorRoutes); // timeline creator with AI rate limiting (10/hour)
app.use("/api/related-events", aiRateLimiter, relatedEventsRoutes); // related events with AI rate limiting (10/hour)

// 404 handler for unknown routes
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler
app.use(errorHandler);

// Start server
app.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}`)
);
