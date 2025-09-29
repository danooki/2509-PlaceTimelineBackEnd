import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import config from "../utils/config.js";

// AI-specific rate limiting middleware - Limits AI API requests to 10 per hour
const aiRateLimiter = rateLimit({
  windowMs: config.aiRateLimit.windowMs, // Time window (1 hour)
  max: config.aiRateLimit.maxRequests, // Max AI requests per window (10)
  message: {
    error:
      "AI request limit exceeded. You can make 09 AI requests per hour. Please try again later.",
    retryAfter: Math.ceil(config.aiRateLimit.windowMs / 60000) + " minutes",
    limit: config.aiRateLimit.maxRequests,
    window: "1 hour",
  },
  standardHeaders: true, // Include rate limit info in headers
  legacyHeaders: false, // Disable legacy X-RateLimit headers
  keyGenerator: ipKeyGenerator, // Use proper IPv6-compatible key generator
  skip: (req) => {
    // Skip rate limiting in development if needed
    return (
      config.server.nodeEnv === "development" &&
      process.env.SKIP_AI_RATE_LIMIT === "true"
    );
  },
});

export default aiRateLimiter;
