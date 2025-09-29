# Place Timeline Backend

Express.js API server that searches Wikipedia for places/buildings, extracts key dates, and finds related historical events for comprehensive timeline generation.

**Key Features:**

- **Smart Place Filtering**: Only returns buildings, cities, landmarks, and places (filters out people, concepts, etc.)
- **Fuzzy Search**: Handles misspellings and returns 3 best suggestions with confidence scores
- **Wikipedia Integration**: Fast article content retrieval with place-specific filtering
- **AI-Powered Date Extraction**: Extracts construction/foundation dates with precision levels
- **Related Historical Events**: Finds contextual events from the same time period and region
- **Comprehensive Error Handling**: Robust timeout and error management
- **Rate Limiting**: 10 AI requests/hour, 100 web requests/15min

**Architecture:** `Client → Express.js API → Wikipedia API + Google AI API`

## 🛠️ Tech Stack

- **Node.js** with Express.js
- **Wikipedia API** for article content and search
- **Google AI API (Gemini)** for date extraction and related events
- **Axios** for HTTP requests
- **CORS, Rate Limiting, Error Handling** middleware
- **Place Detection & Filtering** algorithms

## 🚦 Getting Started

```bash
npm install
npm run dev
```

## 📁 Project Structure

```
2509-PlaceTimelineBackEnd/
├── services/                    # External API integrations
│   ├── wikiService.js          # Wikipedia API service with place filtering
│   ├── genaiService.js         # Google AI date extraction
│   ├── relatedEventsService.js # Related historical events service
│   ├── wikiTextProcessor.js    # Text processing utilities
│   └── wikiErrors.js           # Custom error classes
├── routes/                     # API endpoints
│   ├── healthRoute.js          # Health check endpoint
│   ├── searchSuggestionsRoute.js # Fuzzy search with place filtering
│   ├── timelineCreatorRoute.js # Timeline creation with date extraction
│   └── relatedEventsRoute.js   # Related historical events
├── middleware/                 # Cross-cutting concerns
│   ├── cors.js                 # CORS configuration
│   ├── webRateLimiter.js       # Web request rate limiting
│   ├── aiRateLimiter.js        # AI request rate limiting
│   └── errorHandler.js         # Error handling
├── utils/                      # Configuration and utilities
│   ├── config.js               # Environment configuration
│   └── wiki/                   # Wikipedia processing utilities
│       ├── countryExtraction.js
│       ├── confidenceScoring.js
│       ├── placeDetection.js
│       └── textNormalization.js
└── index.js                    # Main server file
```

## 🔧 API Endpoints

### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "success": true,
  "message": "Timeline Generator API is running",
  "timestamp": "2025-01-18T10:30:00.000Z"
}
```

### `POST /api/search/suggestions`

Get fuzzy search suggestions for places/buildings with smart filtering.

**Request:**

```json
{ "query": "eifel tower" }
```

**Response:**

```json
{
  "success": true,
  "data": {
    "query": "eifel tower",
    "suggestions": [
      {
        "title": "Eiffel Tower",
        "snippet": "The Eiffel Tower is a wrought-iron lattice tower...",
        "confidence": 0.61,
        "placeType": "building",
        "placeConfidence": 0.3,
        "thumbnail": "https://upload.wikimedia.org/...",
        "country": "France",
        "size": 92930,
        "timestamp": "2025-09-15T06:23:16Z"
      }
    ],
    "total_found": 1,
    "timestamp": "2025-01-18T10:30:00.000Z"
  }
}
```

### `POST /api/timeline`

Create timeline data for a confirmed place with date extraction.

**Request:**

```json
{ "query": "Eiffel Tower" }
```

**Response:**

```json
{
  "success": true,
  "data": {
    "name": "Eiffel Tower",
    "summary": "The Eiffel Tower is a wrought-iron lattice tower...",
    "thumbnail": "https://upload.wikimedia.org/...",
    "url": "https://en.wikipedia.org/wiki/Eiffel_Tower",
    "coordinates": { "lat": 48.85822222, "lon": 2.2945 },
    "type": "standard",
    "country": "France",
    "construction_start": "1887",
    "construction_end": "1889",
    "date_precision": "year",
    "status": "completed",
    "extracted_at": "2025-01-18T10:30:00.000Z"
  }
}
```

### `POST /api/related-events`

Find related historical events for a place's timeline.

**Request:**

```json
{
  "placeData": {
    "name": "Eiffel Tower",
    "construction_start": "1887",
    "construction_end": "1889",
    "country": "France",
    "date_precision": "year"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "place_name": "Eiffel Tower",
    "place_dates": {
      "construction_start": "1887",
      "construction_end": "1889",
      "country": "France"
    },
    "related_events": {
      "cultural_events": [
        {
          "event": "The Exposition Universelle (World's Fair) of 1889...",
          "date": "1887-1889",
          "location": "Paris, France",
          "significance": "The Eiffel Tower was specifically built for this event..."
        }
      ],
      "scientific_discoveries": [...],
      "political_events": [...],
      "artistic_achievements": [...],
      "regional_events": [...]
    },
    "total_events": 8,
    "generated_at": "2025-01-18T10:30:00.000Z"
  }
}
```

## 📊 Performance Targets

- **Wikipedia API calls**: < 3 seconds
- **Google AI API calls**: < 5 seconds
- **Search suggestions**: < 2 seconds
- **Timeline creation**: < 8 seconds
- **Related events**: < 10 seconds
- **Total endpoint response**: < 10 seconds

## 🚨 Error Handling

- **400**: Invalid search query or place data
- **404**: No Wikipedia article found
- **408**: Request timeout
- **429**: Rate limit exceeded
- **503**: Service temporarily unavailable (API quota, service down)
- **500**: Internal server error

## 🔄 Complete User Flow

The backend supports a comprehensive 3-step user journey:

### 1. **Fuzzy Search with Place Filtering**

```
User types: "eifel tower" (misspelled)
→ POST /api/search/suggestions
→ Returns: 3 place suggestions with confidence scores
→ Filters out non-places (people, concepts, etc.)
```

### 2. **Place Confirmation & Timeline Creation**

```
User selects: "Eiffel Tower"
→ POST /api/timeline
→ Returns: Basic place data + extracted dates
→ AI extracts construction/foundation dates with precision
```

### 3. **Related Historical Events Discovery**

```
System uses: Place data + dates
→ POST /api/related-events
→ Returns: 5 categories of related events
→ Provides historical context from same time period/region
```

**Example Flow:**

- Search: "eifel tower" → Find "Eiffel Tower" (building, 1887-1889, France)
- Timeline: Extract construction dates (1887-1889)
- Related Events: Find Exposition Universelle 1889, Boulanger Affair, Post-Impressionism, etc.

## 📝 Development Guidelines

See [Backend Guidelines](BACKEND_GUIDELINES.md) for detailed development standards and practices.

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:10002/health

# Test search suggestions with place filtering
curl -X POST http://localhost:10002/api/search/suggestions \
  -H "Content-Type: application/json" \
  -d '{"query": "eifel tower"}'

# Test timeline creation
curl -X POST http://localhost:10002/api/timeline \
  -H "Content-Type: application/json" \
  -d '{"query": "Eiffel Tower"}'

# Test related events
curl -X POST http://localhost:10002/api/related-events \
  -H "Content-Type: application/json" \
  -d '{"placeData": {"name": "Eiffel Tower", "construction_start": "1887", "construction_end": "1889", "country": "France", "date_precision": "year"}}'
```

## 📋 Development Roadmap

### ✅ Phase 1: Backend Foundation (COMPLETED)

- [x] WikiService - Wikipedia API integration with place filtering
- [x] GenAIService - Date extraction via Google AI API
- [x] RelatedEventsService - Historical events discovery
- [x] Search Suggestions Route - Fuzzy search with place filtering
- [x] Timeline Creator Route - Timeline creation with date extraction
- [x] Related Events Route - Historical context discovery
- [x] Place Detection & Filtering - Smart place identification
- [x] Rate Limiting - AI and web request management

### 🔄 Phase 2: Testing & Optimization

- [ ] Unit tests for services
- [ ] Integration tests for endpoints
- [ ] Performance optimization
- [ ] Error scenario testing
- [ ] Frontend integration testing

## 🔄 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Error handling tested
- [ ] Performance targets met
- [ ] Security measures in place
- [ ] Logging configured
- [ ] Rate limiting active
