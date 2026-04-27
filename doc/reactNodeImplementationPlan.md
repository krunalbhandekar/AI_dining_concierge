# React + Node.js Implementation Plan

This plan shows how to implement the restaurant recommendation problem statement using:

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (recommended) or SQLite (for local prototype)
- **LLM Provider:** OpenAI-compatible API (pluggable)

---

## 1) High-Level System Design

### Frontend (React)
- Collect user preferences (location, budget, cuisine, min rating, extras)
- Call backend recommendation API
- Render ranked recommendations and explanation cards
- Handle empty state, loading state, and error state

### Backend (Node.js + Express)
- Ingest and normalize Zomato dataset
- Validate user input
- Filter candidates with rule-based logic
- Call LLM for ranking/explanations
- Return structured response to frontend

### Database
- Store normalized restaurants
- Store ingestion metadata/version
- Optionally store request/response logs for analysis

---

## 2) Suggested Folder Structure

```text
milestone1/
  client/                         # React app
    src/
      components/
      pages/
      services/
      types/
      App.jsx
  server/                         # Node.js app
    src/
      config/
      controllers/
      services/
        ingestion/
        filtering/
        llm/
      routes/
      validators/
      db/
      utils/
      app.js
      server.js
    scripts/
      ingestDataset.js
  doc/
```

---

## 3) Data Model (Backend)

Use one main table first:

### `restaurants`
- `id` (PK)
- `name`
- `city`
- `locality`
- `cuisines` (text array or comma-separated text)
- `avg_cost_for_two`
- `cost_bucket` (`low | medium | high`)
- `rating`
- `votes` (optional)
- `source_dataset_version`
- `created_at`, `updated_at`

Optional analytics table:

### `recommendation_logs`
- `id`
- `request_payload`
- `candidate_count`
- `response_payload`
- `latency_ms`
- `created_at`

---

## 4) API Design (Express)

### Health
- `GET /api/health`

### Ingestion
- `POST /api/ingest`  
  Loads dataset, preprocesses, and stores normalized records.

### Recommendations
- `POST /api/recommend`

Request body:

```json
{
  "location": "Bangalore",
  "budget": "medium",
  "cuisine": ["Italian", "Chinese"],
  "minRating": 4.0,
  "preferences": ["family-friendly", "quick service"]
}
```

Response body:

```json
{
  "meta": {
    "candidateCount": 42,
    "usedFallback": false
  },
  "recommendations": [
    {
      "restaurantId": "123",
      "name": "Example Bistro",
      "cuisine": "Italian",
      "rating": 4.3,
      "estimatedCost": 1200,
      "explanation": "Matches your medium budget and preferred cuisine in Bangalore."
    }
  ]
}
```

---

## 5) Phase-Wise Build Plan

## Phase A: Project Setup
- Create `client` with React + Vite
- Create `server` with Express
- Add shared env configuration
- Add CORS and basic error middleware

Deliverable: frontend and backend run locally.

## Phase B: Data Ingestion Pipeline
- Add ingestion script to fetch/load dataset
- Normalize city, cuisine, cost, and rating fields
- Upsert into database
- Add ingestion summary logs (processed, failed, skipped)

Deliverable: database populated with clean restaurant records.

## Phase C: Preference Validation + Filtering
- Add request validation (Zod or Joi)
- Implement filtering service:
  - hard filters: location, minRating
  - soft filters: budget, cuisine, extras
- Add fallback logic when zero results

Deliverable: `POST /api/recommend` returns structured candidate list without LLM.

## Phase D: LLM Ranking Integration
- Build prompt template using user preferences + top candidates
- Call LLM API and request strict JSON output
- Validate and ground response against candidate IDs
- Add fallback to rule-based ranking on LLM failure

Deliverable: ranked recommendations with explanations.

## Phase E: React UI
- Build preference form
- Connect to backend with loading/error handling
- Build recommendation cards
- Show fallback/empty states clearly

Deliverable: end-to-end working UI for recommendations.

## Phase F: Monitoring + Hardening
- Add request logging and latency metrics
- Add retry/timeouts for LLM API
- Add caching for repeated queries
- Add test coverage for critical edge cases

Deliverable: stable and production-ready MVP.

---

## 6) Core Backend Services

### `filteringService`
- Build SQL query (or query builder) from validated preference object
- Return top N candidates for LLM
- Emit metadata (count, fallback used, constraints relaxed)

### `promptBuilderService`
- Convert candidates to compact context format
- Add non-negotiable system instructions:
  - do not invent restaurants
  - only use candidate list
  - return strict JSON format

### `llmService`
- Handles API call, retries, timeout, and JSON parsing
- Returns validated ranking output

### `recommendationService` (orchestrator)
- Validate input -> filter -> call LLM -> post-validate -> return response

---

## 7) Frontend Pages and Components

### Pages
- `HomePage`: form + results

### Components
- `PreferenceForm`
- `RecommendationList`
- `RecommendationCard`
- `EmptyState`
- `ErrorBanner`
- `LoadingSkeleton`

### Client Services
- `apiClient.js` for Axios/fetch wrapper
- `recommendationApi.js` for `/api/recommend`

---

## 8) Environment Variables

### Backend (`server/.env`)
- `PORT=5000`
- `DATABASE_URL=...`
- `LLM_API_KEY=...`
- `LLM_MODEL=...`
- `LLM_BASE_URL=...` (optional if provider-compatible)

### Frontend (`client/.env`)
- `VITE_API_BASE_URL=http://localhost:5000`

---

## 9) Testing Strategy

### Backend
- Unit tests:
  - validators
  - filter boundaries (budget/rating edges)
  - fallback behavior
- Integration tests:
  - `/api/recommend` happy and edge paths
  - LLM failure fallback path

### Frontend
- Component tests for form validation and rendering
- API mock tests for loading/error/empty/results states

---

## 10) Recommended Milestone Order (Fastest Path)

1. Backend setup + ingestion + DB
2. Filtering endpoint (without LLM)
3. React form + results UI (with mock or rule-based backend)
4. LLM integration
5. Hardening (timeouts, retries, logs, tests)

This sequence gives you a usable product early, then adds AI ranking on top.

