// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

// Configuration object that centralizes all our app settings
const config = {
  // Server settings
  server: {
    port: process.env.PORT || 10002,
    nodeEnv: process.env.NODE_ENV || "development",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:50002",
  },

  // AI/ML API settings
  aimlapi: {
    apiKey: process.env.AIMLAPI_KEY,
    model: process.env.AIMLAPI_MODEL,
  },

  // Wikipedia API settings
  wikipedia: {
    baseUrl: process.env.WIKIPEDIA_API_BASE_URL,
    userAgent: process.env.WIKIPEDIA_USER_AGENT,
  },

  // Rate limiting settings
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
};

// Function to validate that required environment variables are present
function validateConfig() {
  const required = ["AIMLAPI_KEY"];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error(
      "\n💡 Don't forget to add your .env file and check all the variables."
    );
    process.exit(1); // Exit the application if required vars are missing
  }

  console.log("Configuration loaded successfully");
}

// Validate configuration when this file is imported
validateConfig();

// Export the config object so other files can use it
export default config;
