import cors from "cors";

// CORS configuration - Brings the 2 allowed frontends to communicate with backend
const allowedOrigins = process.env.FRONTEND_URL.split(",");

const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in our allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(
        new Error(
          `Origin ${origin} not allowed by CORS. You have to use the allowed websites babe.`
        )
      );
    }
  },
  credentials: true,
});

export default corsMiddleware;
