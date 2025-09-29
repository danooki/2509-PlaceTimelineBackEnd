import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

// ─────────────────────────────────────────────────────────────
//  Google AI Service - Handles AI-powered date extraction
// Extracts construction dates from Wikipedia summaries with precision levels
// ─────────────────────────────────────────────────────────────

// Configuration object following backend guidelines
const GENAI_CONFIG = {
  baseUrl: "https://generativelanguage.googleapis.com/v1beta",
  timeout: 10000,
  model: "gemini-2.0-flash-exp",
  maxTokens: 500,
  temperature: 0.1,
};

// ─────────────────────────────────────────────────────────────
// Extract construction dates from Wikipedia summary
//  @param {string} summary - Wikipedia article summary text
//  @param {string} placeName - Name of the place/building
//  @returns {Promise<Object>} - Structured date information
// ─────────────────────────────────────────────────────────────
export const extractDates = async (summary, placeName) => {
  try {
    // 1. Input validation
    if (
      !summary ||
      typeof summary !== "string" ||
      summary.trim().length === 0
    ) {
      throw new Error("Invalid summary text provided");
    }

    if (
      !placeName ||
      typeof placeName !== "string" ||
      placeName.trim().length === 0
    ) {
      throw new Error("Invalid place name provided");
    }

    // 2. Create prompt
    const prompt = createDateExtractionPrompt(summary, placeName);

    // 3. Make API request
    const response = await makeGoogleAIRequest(prompt);

    // 4. Parse and validate response
    const extractedData = parseAIResponse(response);
    return validateAndFormatDates(extractedData, placeName);
  } catch (error) {
    // Log full error details for debugging
    console.error("Google AI API Error Details:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
    });

    // Handle specific error types
    if (error.code === "ECONNABORTED") {
      throw new Error("Google AI API timeout - please try again");
    }

    if (error.response?.status === 401) {
      throw new Error(
        "Google AI API key is invalid - please check your configuration"
      );
    }

    if (error.response?.status === 429) {
      throw new Error(
        "Google AI API quota exceeded - please check your account"
      );
    }

    if (error.response?.status >= 500) {
      throw new Error("Google AI API service temporarily unavailable");
    }

    throw new Error(`Google AI API processing failed: ${error.message}`);
  }
};

// ─────────────────────────────────────────────────────────────
// Make HTTP request to Google AI API
//  @param {string} prompt - Formatted prompt for AI
//  @returns {Promise<string>} - AI response content
// ─────────────────────────────────────────────────────────────
const makeGoogleAIRequest = async (prompt) => {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("Google AI API key not configured");
  }

  console.log(
    `Making Google AI API request with key: ${apiKey.substring(0, 8)}...`
  );

  const requestData = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: GENAI_CONFIG.maxTokens,
      temperature: GENAI_CONFIG.temperature,
    },
  };

  const response = await axios.post(
    `${GENAI_CONFIG.baseUrl}/models/${GENAI_CONFIG.model}:generateContent?key=${apiKey}`,
    requestData,
    {
      timeout: GENAI_CONFIG.timeout,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "PlaceTimeline/1.0",
      },
    }
  );

  if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("Invalid response format from Google AI API");
  }

  return response.data.candidates[0].content.parts[0].text;
};

// ─────────────────────────────────────────────────────────────
// Create optimized prompt for date extraction
//  @param {string} summary - Wikipedia summary text
//  @param {string} placeName - Name of the place/building
//  @returns {string} - Formatted prompt for Google AI API
// ─────────────────────────────────────────────────────────────
const createDateExtractionPrompt = (summary, placeName) => {
  return `Extract construction dates for "${placeName}" from this Wikipedia summary. 

Return ONLY a JSON object with this exact structure:
{
  "construction_start": "date or null",
  "construction_end": "date or null", 
  "date_precision": "month_year|year|decade|century|unknown",
  "status": "completed|ongoing|unknown"
}

Date format priority:
1. "Month Year" (e.g., "January 1887") - if month is known
2. "Year" (e.g., "1887") - if only year is known
3. "Decade" (e.g., "1880s") - if only decade is known  
4. "Century" (e.g., "19th century") - if only century is known
5. "null" - if no date found

Wikipedia summary:
${summary}

Extract dates for: ${placeName}`;
};

// ─────────────────────────────────────────────────────────────
// Parse AI response and extract JSON data
//  @param {string} aiResponse - Raw response from Google AI API
//  @returns {Object} - Parsed JSON data
// ─────────────────────────────────────────────────────────────
const parseAIResponse = (aiResponse) => {
  try {
    // Extract JSON from response (remove any extra text)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Validate required fields
    const requiredFields = [
      "construction_start",
      "construction_end",
      "date_precision",
      "status",
    ];
    const missingFields = requiredFields.filter(
      (field) => !parsedData.hasOwnProperty(field)
    );

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required fields in AI response: ${missingFields.join(", ")}`
      );
    }

    return parsedData;
  } catch (error) {
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
};

// ─────────────────────────────────────────────────────────────
// Validate and format extracted dates
//  @param {Object} extractedData - Raw extracted data from AI
//  @param {string} placeName - Name of the place for context
//  @returns {Object} - Validated and formatted date data
// ─────────────────────────────────────────────────────────────
const validateAndFormatDates = (extractedData, placeName) => {
  const { construction_start, construction_end, date_precision, status } =
    extractedData;

  // Validate date precision values
  const validPrecisions = [
    "month_year",
    "year",
    "decade",
    "century",
    "unknown",
  ];
  if (!validPrecisions.includes(date_precision)) {
    throw new Error(`Invalid date precision: ${date_precision}`);
  }

  // Validate status values
  const validStatuses = ["completed", "ongoing", "unknown"];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  // Format and validate dates
  const formattedStart = formatDate(construction_start);
  const formattedEnd = formatDate(construction_end);

  return {
    place_name: placeName,
    construction_start: formattedStart,
    construction_end: formattedEnd,
    date_precision: date_precision,
    status: status,
    extracted_at: new Date().toISOString(),
  };
};

// ─────────────────────────────────────────────────────────────
// Format date string for consistency
//  @param {string|null} date - Raw date string
//  @returns {string|null} - Formatted date or null
// ─────────────────────────────────────────────────────────────
const formatDate = (date) => {
  if (!date || date === "null" || date === null) {
    return null;
  }

  // Clean and normalize the date string
  return date.toString().trim();
};
