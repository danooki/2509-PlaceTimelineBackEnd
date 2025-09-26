# Place Timeline Backend

Express.js API server that searches Wikipedia for places/buildings and uses OpenAI to extract key dates (construction, opening, etc.) for timeline generation.

**Key Features:**

- Wikipedia integration for article content
- AI-powered date extraction (construction, opening dates, key events)
- Fast processing (under 10 seconds total)
- Comprehensive error handling and timeouts

**Architecture:** `Client → Express.js API → Wikipedia API + OpenAI API`

## 🛠️ Tech Stack

- **Node.js** with Express.js
- **Wikipedia API** for article content
- **OpenAI API** for date extraction
- **Axios** for HTTP requests
- **CORS, Rate Limiting, Error Handling** middleware

## 🚦 Getting Started

```bash
npm install
npm run dev
```

## 📁 Project Structure

```
2509-PlaceTimelineBackEnd/
├── services/          # External API integrations
│   └── wikiService.js # Wikipedia API service
├── routes/            # API endpoints
│   └── health.js      # Health check endpoint
├── controllers/       # Request/response handling logic
├── middleware/        # Cross-cutting concerns
│   ├── cors.js        # CORS configuration
│   ├── rateLimiter.js # Rate limiting
│   └── errorHandler.js # Error handling
├── utils/             # Configuration and utilities
│   └── config.js      # Environment configuration
└── index.js          # Main server file
```

## 🔧 API Endpoints

### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2025-01-18T10:30:00.000Z"
}
```

### `POST /api/timeline` (Coming Soon)

Search for a place and extract timeline data.

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
    "country": "France",
    "city": "Paris",
    "construction_start": "January 1887",
    "construction_end": "March 1889",
    "opening_date": "March 1889"
  }
}
```

## 📊 Performance Targets

- **Wikipedia API calls**: < 3 seconds
- **OpenAI API calls**: < 5 seconds
- **Total endpoint response**: < 10 seconds
- **Fallback operations**: < 2 seconds

## 🚨 Error Handling

- **404**: No Wikipedia article found
- **422**: Article found but no dates extracted
- **500**: Server/API errors
- **400**: Invalid search query
- **429**: Rate limit exceeded

## 📝 Development Guidelines

See [Backend Guidelines](BACKEND_GUIDELINES.md) for detailed development standards and practices.

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test timeline endpoint (when implemented)
curl -X POST http://localhost:3001/api/timeline \
  -H "Content-Type: application/json" \
  -d '{"query": "Eiffel Tower"}'
```

## 📋 Development Roadmap

### ✅ Phase 1: Backend Foundation

- [x] WikiService - Wikipedia API integration
- [x] AIMLAPIService - Date extraction (via AI/ML API)
- [ ] Timeline Route - Main API endpoint

### 🔄 Phase 2: Testing & Optimization

- [ ] Unit tests for services
- [ ] Integration tests for endpoints
- [ ] Performance optimization
- [ ] Error scenario testing

## 🔄 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Error handling tested
- [ ] Performance targets met
- [ ] Security measures in place
- [ ] Logging configured
- [ ] Rate limiting active
