import config from "../utils/config.js";

// Global error handler
const errorHandler = (error, req, res, next) => {
  console.error("❌ Global error handler:", error);

  // Don't leak error details in production
  const isDevelopment = config.server.nodeEnv === "development";

  res.status(error.status || 500).json({
    error: "Internal server error",
    message: isDevelopment ? error.message : "Something went wrong",
    ...(isDevelopment && { stack: error.stack }),
  });
};

export default errorHandler;
