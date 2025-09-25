// Import required packages
import express from "express";

// Import middleware
import corsMiddleware from "./middleware/cors.js";
import rateLimiter from "./middleware/rateLimiter.js";
import errorHandler from "./middleware/errorHandler.js";

// Import routes
import healthRoutes from "./routes/health.js";

const app = express(); // Create Express application
app.use(express.json()); // Enables JSON parsing for POST requests

// Backend port
const port = process.env.PORT;

// Apply middleware
app.use(corsMiddleware);

// Routes
app.use("/health", healthRoutes); // endpoint for backend health check

// TODO: When you create Wikipedia/AI search routes, apply rate limiter only to those specific routes
// Example: app.use("/api/search", rateLimiter, searchRoutes);
// This way users can reload the website freely, but Wikipedia/AI calls are rate limited

// 404 handler for unknown routes
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler
app.use(errorHandler);

// Start server
app.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}`)
);
