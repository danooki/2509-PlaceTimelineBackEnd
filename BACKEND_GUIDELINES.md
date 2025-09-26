# Backend Development Guidelines

Development standards and best practices for the Place Timeline backend.

## Architecture

```
Backend Structure:
├── services/          # External API integrations
├── routes/            # API endpoints
├── controllers/       # Request/response handling logic
├── middleware/        # Cross-cutting concerns
├── utils/             # Configuration and utilities
└── index.js          # Main server file
```

## ES6+ Modern JavaScript Standards

### 1. Prefer Functional Programming over Classes

```javascript
// ✅ Good: Functional approach with configuration
const config = {
  baseUrl: "https://en.wikipedia.org/api/rest_v1",
  timeout: 5000,
};

export const searchArticle = async (query) => {
  const summaryUrl = `${config.baseUrl}/page/summary/${encodeURIComponent(
    query
  )}`;
  const response = await axios.get(summaryUrl, { timeout: config.timeout });
  return response.data;
};

// ❌ Avoid: Class-based approach with this.property
class WikiService {
  constructor() {
    this.baseUrl = "...";
    this.timeout = 5000;
  }
  async searchArticle(query) {
    const url = `${this.baseUrl}/...`;
  }
}
```

### 2. Use Configuration Objects

```javascript
// ✅ Good: Separate configuration from logic
export const API_CONFIG = {
  wikipedia: {
    baseUrl: "https://en.wikipedia.org/api/rest_v1",
    timeout: 5000,
    userAgent: "PlaceTimeline/1.0",
  },
  openai: {
    model: "gpt-3.5-turbo",
    timeout: 10000,
  },
};

// ✅ Good: Use configuration in functions
export const searchWikipedia = async (query) => {
  const response = await axios.get(
    `${API_CONFIG.wikipedia.baseUrl}/page/summary/${query}`,
    {
      timeout: API_CONFIG.wikipedia.timeout,
      headers: { "User-Agent": API_CONFIG.wikipedia.userAgent },
    }
  );
  return response.data;
};
```

### 3. Export Functions Directly

```javascript
// ✅ Good: Direct function exports
export const searchSuggestions = async (query) => {
  /* ... */
};
export const searchArticle = async (query) => {
  /* ... */
};

// ❌ Avoid: Singleton class instances
export default new WikiService();
```

### 4. Use Modern Error Handling

```javascript
// ✅ Good: Specific error types
export class WikiApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = "WikiApiError";
    this.code = code;
    this.status = status;
  }
}

// ✅ Good: Use custom errors
if (error.response?.status === 404) {
  throw new WikiApiError(`No article found for "${query}"`, "NOT_FOUND", 404);
}
```

## Code Organization Principles

- **File Size**: Keep files under 200 lines of code
- **Modularity**: Maintain clear separation of concerns between services, controllers, routes, and middleware
- **Simplicity**: Prioritize simple, readable code over complex optimizations
- **Avoid Redundancy**: Don't repeat code - extract common functionality into utilities or services

## Development Standards

### 1. Error Handling

```javascript
// Good: Specific error messages
throw new Error(`No Wikipedia article found for "${query}"`);

// Good: Try-catch with specific error responses
try {
  const result = await wikiService.searchArticle(query);
  res.json(result);
} catch (error) {
  if (error.message.includes("not found")) {
    return res.status(404).json({ error: error.message });
  }
  res.status(500).json({ error: "Internal server error" });
}
```

### 2. API Response Format

```javascript
// Success Response
{
  "success": true,
  "data": {
    "name": "Eiffel Tower",
    "country": "France",
    "city": "Paris",
    "timeline": [...]
  }
}

// Error Response
{
  "success": false,
  "error": "No Wikipedia article found for 'xyz'",
  "code": "NOT_FOUND"
}
```

### 3. Input Validation

```javascript
// Good: Validate input early
if (!query || typeof query !== "string" || query.trim().length === 0) {
  return res.status(400).json({
    error: "Invalid search query",
    code: "INVALID_INPUT",
  });
}
```

### 4. Timeout Handling

```javascript
// Good: Set appropriate timeouts
const response = await axios.get(url, {
  timeout: 5000, // 5 seconds
  headers: { "User-Agent": "PlaceTimeline/1.0" },
});
```

## Performance Standards

### Response Time Targets

- **Wikipedia API calls**: < 3 seconds
- **OpenAI API calls**: < 5 seconds
- **Total endpoint response**: < 10 seconds
- **Fallback operations**: < 2 seconds

### Optimization Strategies

1. **Parallel API calls** when possible
2. **Timeout configuration** for all external APIs
3. **Error handling** that doesn't block the main flow
4. **Clean text extraction** to reduce AI processing time

## Security Guidelines

### 1. Input Sanitization

```javascript
// Good: Clean and validate input
const cleanQuery = query.trim().substring(0, 100);

// Bad: Direct use of user input
const url = `https://api.com/search?q=${query}`;
```

## Code Style

### 1. Function Structure

```javascript
// Good: Clear function structure
async function searchArticle(query) {
  // 1. Input validation
  if (!query) throw new Error("Query required");

  // 2. Main logic
  const result = await performSearch(query);

  // 3. Response formatting
  return formatResponse(result);
}
```

## API Integration Patterns

### 1. Wikipedia API

```javascript
async searchWikipedia(query) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    return processResponse(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`No article found for "${query}"`);
    }
    throw new Error(`Wikipedia API error: ${error.message}`);
  }
}
```

### 2. OpenAI API

```javascript
async extractDates(text) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      timeout: 10000
    });
    return parseResponse(response.choices[0].message.content);
  } catch (error) {
    throw new Error(`OpenAI processing failed: ${error.message}`);
  }
}
```

## Monitoring & Logging

```javascript
// Good: Structured logging
console.log(`Searching Wikipedia for: "${query}"`);
console.error(`Wikipedia API failed: ${error.message}`);

// Bad: Unclear logging
console.log("API call");
console.error("Error");
```

## Common Pitfalls

### Avoid These Patterns

```javascript
// Bad: No error handling
const result = await api.call();

// Bad: Generic error messages
catch (error) {
  throw new Error('Something went wrong');
}

// Bad: No timeout configuration
const response = await axios.get(url);
```

### Best Practices

```javascript
// Good: Comprehensive error handling
try {
  const result = await api.call();
  return result;
} catch (error) {
  if (error.code === "TIMEOUT") {
    throw new Error("API timeout - please try again");
  }
  throw new Error(`API failed: ${error.message}`);
}
```

## Deployment Checklist

Before deploying:

- [ ] All environment variables configured
- [ ] Error handling tested
- [ ] Performance targets met
- [ ] Security measures in place
- [ ] Logging configured
- [ ] Rate limiting active

---

**Remember**: These guidelines ensure consistency, maintainability, and reliability across the backend codebase.
