// Import required packages
import express from "express";

// Import middleware
import corsMiddleware from "./middleware/cors.js";
import rateLimiter from "./middleware/rateLimiter.js";
import errorHandler from "./middleware/errorHandler.js";

// Import routes
import healthRoutes from "./routes/health.js";
import timelineCreatorRoutes from "./routes/timelineCreator.js";

const app = express(); // Create Express application
app.use(express.json()); // Enables JSON parsing for POST requests

// Backend port
const port = process.env.PORT;

// Apply middleware
app.use(corsMiddleware);

// Routes
app.use("/health", healthRoutes); // endpoint for backend health check
app.use("/api/timeline", rateLimiter, timelineCreatorRoutes); // timeline creator with rate limiting

// 404 handler for unknown routes
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler
app.use(errorHandler);

// Start server
app.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}`)
);
