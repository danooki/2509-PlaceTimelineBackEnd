import express from "express";
import config from "../utils/config.js";

const router = express.Router();

// Endpoint to test if the backend is running. No need to be authenticated.
router.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Timeline Generator API is running",
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
  });
});

export default router;
