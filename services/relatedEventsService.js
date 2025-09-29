import axios from "axios";

// ─────────────────────────────────────────────────────────────
//  Related Events Service - Finds historical events related to a place's timeline
//  Uses AI to search for and categorize related historical events from the same time period
// ─────────────────────────────────────────────────────────────

// Configuration object following backend guidelines
const GENAI_CONFIG = {
  baseUrl: "https://generativelanguage.googleapis.com/v1beta",
  timeout: 15000,
  model: "gemini-2.0-flash-exp",
  maxTokens: 1000,
  temperature: 0.2,
};

// ─────────────────────────────────────────────────────────────
// Find related historical events for a place's timeline
//  @param {Object} placeData - Place information with dates and location
//  @returns {Promise<Object>} - Related historical events organized by category
// ─────────────────────────────────────────────────────────────
export const findRelatedEvents = async (placeData) => {
  try {
    // Input validation
    if (!placeData || !placeData.name) {
      throw new Error("Invalid place data provided");
    }

    const {
      name,
      construction_start,
      construction_end,
      country,
      date_precision,
    } = placeData;

    // Create prompt for finding related events
    const prompt = createRelatedEventsPrompt(placeData);

    // Make API request to Google AI
    const response = await makeGoogleAIRequest(prompt);

    // Parse and validate response
    const relatedEvents = parseRelatedEventsResponse(response);

    return validateAndFormatRelatedEvents(relatedEvents, placeData);
  } catch (error) {
    console.error("Related Events Service Error Details:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    // Handle specific error types
    if (error.code === "ECONNABORTED") {
      throw new Error("Related events search timeout - please try again");
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

    throw new Error(`Related events search failed: ${error.message}`);
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
    `Making Google AI request for related events with key: ${apiKey.substring(
      0,
      8
    )}...`
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
// Create optimized prompt for finding related historical events
//  @param {Object} placeData - Place information
//  @returns {string} - Formatted prompt for Google AI API
// ─────────────────────────────────────────────────────────────
const createRelatedEventsPrompt = (placeData) => {
  const {
    name,
    construction_start,
    construction_end,
    country,
    date_precision,
  } = placeData;

  // Determine time period for search
  let timeContext = "";
  if (construction_start && construction_end) {
    timeContext = `from ${construction_start} to ${construction_end}`;
  } else if (construction_start) {
    timeContext = `around ${construction_start}`;
  } else if (construction_end) {
    timeContext = `around ${construction_end}`;
  } else {
    timeContext = "during the same historical period";
  }

  // Determine geographic context
  let geoContext = "";
  if (country) {
    geoContext = `in ${country} and globally`;
  } else {
    geoContext = "globally";
  }

  return `Find related historical events for "${name}" ${timeContext} ${geoContext}.

Return ONLY a JSON object with this exact structure:
{
  "cultural_events": [
    {
      "event": "Brief description of the event",
      "date": "Date or time period",
      "location": "Where it happened",
      "significance": "Why it's relevant to the timeline"
    }
  ],
  "scientific_discoveries": [
    {
      "event": "Brief description of the discovery/invention",
      "date": "Date or time period", 
      "location": "Where it happened",
      "significance": "Why it's relevant to the timeline"
    }
  ],
  "political_events": [
    {
      "event": "Brief description of the political event",
      "date": "Date or time period",
      "location": "Where it happened", 
      "significance": "Why it's relevant to the timeline"
    }
  ],
  "artistic_achievements": [
    {
      "event": "Brief description of the artistic work/achievement",
      "date": "Date or time period",
      "location": "Where it happened",
      "significance": "Why it's relevant to the timeline"
    }
  ],
  "regional_events": [
    {
      "event": "Brief description of regional/local events",
      "date": "Date or time period",
      "location": "Where it happened",
      "significance": "Why it's relevant to the timeline"
    }
  ]
}

Focus on:
1. Events that happened in the same time period (${timeContext})
2. Events in the same region/country (${country || "global"})
3. Events that provide historical context for understanding the place's significance
4. Cultural, scientific, political, and artistic developments of that era
5. Regional events that might have influenced the place's construction or significance

Keep each event description concise (1-2 sentences) and focus on the most significant events.
Limit to 3-5 events per category maximum.

Place: ${name}
Time period: ${timeContext}
Location: ${country || "Global"}
Date precision: ${date_precision || "unknown"}`;
};

// ─────────────────────────────────────────────────────────────
// Parse AI response and extract JSON data
//  @param {string} aiResponse - Raw response from Google AI API
//  @returns {Object} - Parsed JSON data
// ─────────────────────────────────────────────────────────────
const parseRelatedEventsResponse = (aiResponse) => {
  try {
    // Extract JSON from response (remove any extra text)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Validate required categories
    const requiredCategories = [
      "cultural_events",
      "scientific_discoveries",
      "political_events",
      "artistic_achievements",
      "regional_events",
    ];

    const missingCategories = requiredCategories.filter(
      (category) => !parsedData.hasOwnProperty(category)
    );

    if (missingCategories.length > 0) {
      throw new Error(
        `Missing required categories in AI response: ${missingCategories.join(
          ", "
        )}`
      );
    }

    return parsedData;
  } catch (error) {
    throw new Error(
      `Failed to parse related events response: ${error.message}`
    );
  }
};

// ─────────────────────────────────────────────────────────────
// Validate and format related events data
//  @param {Object} eventsData - Raw events data from AI
//  @param {Object} placeData - Original place data for context
//  @returns {Object} - Validated and formatted events data
// ─────────────────────────────────────────────────────────────
const validateAndFormatRelatedEvents = (eventsData, placeData) => {
  const { name, construction_start, construction_end, country } = placeData;

  // Validate and format each category
  const categories = [
    "cultural_events",
    "scientific_discoveries",
    "political_events",
    "artistic_achievements",
    "regional_events",
  ];

  const formattedEvents = {};

  categories.forEach((category) => {
    const events = eventsData[category];

    if (!Array.isArray(events)) {
      formattedEvents[category] = [];
      return;
    }

    // Validate and format each event
    formattedEvents[category] = events
      .filter((event) => event && typeof event === "object")
      .map((event) => ({
        event: event.event || "Unknown event",
        date: event.date || "Unknown date",
        location: event.location || "Unknown location",
        significance: event.significance || "Historical significance",
      }))
      .slice(0, 5); // Limit to 5 events per category
  });

  return {
    place_name: name,
    place_dates: {
      construction_start: construction_start,
      construction_end: construction_end,
      country: country,
    },
    related_events: formattedEvents,
    total_events: Object.values(formattedEvents).reduce(
      (sum, events) => sum + events.length,
      0
    ),
    generated_at: new Date().toISOString(),
  };
};
