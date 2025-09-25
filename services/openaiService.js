import OpenAI from "openai";

// ─────────────────────────────────────────────────────────────
//  OpenAIService - Handles AI-powered date extraction
// Extracts construction dates from Wikipedia summaries with precision levels
// ─────────────────────────────────────────────────────────────

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.timeout = 10000; // 10 seconds timeout for OpenAI API
    this.model = "gpt-3.5-turbo"; // Cost-effective model
  }

  // ─────────────────────────────────────────────────────────────
  // Extract construction dates from Wikipedia summary
  //  @param {string} summary - Wikipedia article summary text
  //  @param {string} placeName - Name of the place/building
  //  @returns {Promise<Object>} - Structured date information
  // ─────────────────────────────────────────────────────────────
  async extractDates(summary, placeName) {
    try {
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

      const prompt = this.createDateExtractionPrompt(summary, placeName);

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.1, // Low temperature for consistent results
        timeout: this.timeout,
      });

      const extractedData = this.parseAIResponse(
        response.choices[0].message.content
      );
      return this.validateAndFormatDates(extractedData, placeName);
    } catch (error) {
      if (error.code === "ECONNABORTED") {
        throw new Error("OpenAI API timeout - please try again");
      }

      if (error.code === "insufficient_quota") {
        throw new Error(
          "OpenAI API quota exceeded - please check your account"
        );
      }

      if (error.code === "invalid_api_key") {
        throw new Error(
          "OpenAI API key is invalid - please check your configuration"
        );
      }

      throw new Error(`OpenAI processing failed: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Create optimized prompt for date extraction
  //  @param {string} summary - Wikipedia summary text
  //  @param {string} placeName - Name of the place/building
  //  @returns {string} - Formatted prompt for OpenAI
  // ─────────────────────────────────────────────────────────────
  createDateExtractionPrompt(summary, placeName) {
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
  }

  // ─────────────────────────────────────────────────────────────
  // Parse AI response and extract JSON data
  //  @param {string} aiResponse - Raw response from OpenAI
  //  @returns {Object} - Parsed JSON data
  // ─────────────────────────────────────────────────────────────
  parseAIResponse(aiResponse) {
    try {
      // Extract JSON from response (remove any extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (
        !parsedData.hasOwnProperty("construction_start") ||
        !parsedData.hasOwnProperty("construction_end") ||
        !parsedData.hasOwnProperty("date_precision") ||
        !parsedData.hasOwnProperty("status")
      ) {
        throw new Error("Missing required fields in AI response");
      }

      return parsedData;
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Validate and format extracted dates
  //  @param {Object} extractedData - Raw extracted data from AI
  //  @param {string} placeName - Name of the place for context
  //  @returns {Object} - Validated and formatted date data
  // ─────────────────────────────────────────────────────────────
  validateAndFormatDates(extractedData, placeName) {
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
    const formattedStart = this.formatDate(construction_start);
    const formattedEnd = this.formatDate(construction_end);

    return {
      place_name: placeName,
      construction_start: formattedStart,
      construction_end: formattedEnd,
      date_precision: date_precision,
      status: status,
      extracted_at: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Format date string for consistency
  //  @param {string|null} date - Raw date string
  //  @returns {string|null} - Formatted date or null
  // ─────────────────────────────────────────────────────────────
  formatDate(date) {
    if (!date || date === "null" || date === null) {
      return null;
    }

    // Clean and normalize the date string
    return date.toString().trim();
  }
}

export default new OpenAIService();
