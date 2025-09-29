import rateLimit from "express-rate-limit";
import config from "../utils/config.js";

// Web API rate limiting middleware - Prevent abuse for general API endpoints
const webRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // Time window
  max: config.rateLimit.maxRequests, // Max requests per window
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: Math.ceil(config.rateLimit.windowMs / 60000) + " minutes",
  },
  standardHeaders: true, // Include rate limit info in headers
  legacyHeaders: false, // Disable legacy X-RateLimit headers
});

export default webRateLimiter;
