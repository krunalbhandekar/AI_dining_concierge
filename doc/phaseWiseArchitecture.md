# Phase-Wise Architecture

This document defines a phase-wise architecture for the AI-powered restaurant recommendation system described in `doc/problemStatement.md`.

## Architecture Overview

The system follows a pipeline approach:

1. Data ingestion and preparation
2. User preference capture and validation
3. Candidate filtering with structured logic
4. LLM-based ranking and explanation generation
5. Response formatting and presentation
6. Monitoring and continuous improvement

---

## Phase 1: Data Ingestion and Preparation

### Goal
Build a reliable and query-ready restaurant dataset from the Zomato source.

### Inputs
- Hugging Face dataset
- Raw restaurant fields (name, location, cuisine, cost, rating, metadata)

### Core Components
- **Dataset Loader**: Fetches data from source
- **Preprocessor**: Cleans nulls, inconsistent labels, and duplicates
- **Schema Mapper**: Converts raw fields into a standardized schema
- **Storage Layer**: Saves normalized data (CSV/SQLite/PostgreSQL)

### Processing Steps
- Ingest dataset
- Normalize fields (city names, cuisine labels, cost buckets)
- Compute helper attributes (cost range bucket, quality score)
- Store cleaned data in serving format

### Output
- Structured restaurant catalog ready for filtering and retrieval

---

## Phase 2: User Preference Collection

### Goal
Capture and sanitize user requirements before recommendation.

### Inputs
- User-entered preferences:
  - Location
  - Budget
  - Cuisine
  - Minimum rating
  - Optional constraints (family-friendly, quick service, etc.)

### Core Components
- **Input Interface**: CLI/Web/API input form
- **Validator**: Checks required fields and value ranges
- **Preference Parser**: Converts text inputs into machine-friendly filters

### Processing Steps
- Capture user preferences
- Validate and normalize values
- Build a preference object

### Output
- Validated preference profile for recommendation logic

---

## Phase 3: Candidate Retrieval (Rule-Based Filtering)

### Goal
Narrow the full catalog to relevant candidate restaurants.

### Inputs
- Validated user preference profile
- Structured restaurant catalog

### Core Components
- **Filter Engine**: Applies location, budget, cuisine, and rating constraints
- **Fallback Handler**: Loosens strict constraints when no results are found
- **Candidate Scorer (Optional)**: Lightweight heuristic pre-ranking

### Processing Steps
- Apply hard filters first (location, min rating)
- Apply preference filters (budget, cuisine, extras)
- Handle low-result cases with controlled fallback

### Output
- Shortlisted candidate set (top N records) for LLM reasoning

---

## Phase 4: LLM-Based Recommendation and Ranking

### Goal
Generate personalized ranking with natural-language explanations.

### Inputs
- User preference profile
- Candidate set (structured)

### Core Components
- **Prompt Builder**: Creates a stable instruction template
- **LLM Connector**: Calls selected model API
- **Response Parser**: Extracts ranked items and justifications
- **Guardrails**: Prevents hallucinated restaurants not present in candidates

### Processing Steps
- Format candidate records into compact prompt context
- Ask LLM to rank and explain fit
- Parse and validate model output against candidate IDs

### Output
- Ranked recommendation list with explanation text

---

## Phase 5: Presentation Layer

### Goal
Return recommendations in a clear, user-friendly format.

### Inputs
- Ranked recommendations with explanations

### Core Components
- **Formatter**: Converts output to UI/API structure
- **Renderer**: Displays name, cuisine, rating, estimated cost, and explanation
- **Summary Generator (Optional)**: Shows best-for-budget / best-overall labels

### Processing Steps
- Merge structured fields + LLM explanation
- Apply display rules and ordering
- Return response to frontend/CLI

### Output
- Final recommendation response shown to user

---

## Phase 6: Monitoring, Feedback, and Improvement

### Goal
Improve recommendation quality over time.

### Inputs
- User interactions (clicks, selections, rejections)
- Runtime metrics (latency, error rates, no-result frequency)

### Core Components
- **Logging Layer**: Stores requests and outputs
- **Evaluation Module**: Tracks relevance and acceptance metrics
- **Prompt Tuning Loop**: Refines prompts and fallback strategy

### Processing Steps
- Log recommendation sessions
- Measure quality and system health
- Update filtering thresholds and prompt templates

### Output
- Continuous performance and quality improvements

---

## Cross-Cutting Concerns

- **Scalability**: Cache frequent queries and popular city filters
- **Reliability**: Add retries/timeouts for LLM calls
- **Security**: Validate and sanitize all user inputs
- **Cost Control**: Restrict candidate size sent to LLM
- **Explainability**: Keep recommendation reasons traceable to user preferences

---

## End-to-End Data Flow

1. Ingest and normalize Zomato dataset  
2. Capture and validate user preferences  
3. Filter catalog to candidate restaurants  
4. Send candidates + preferences to LLM  
5. Parse and verify ranked recommendations  
6. Render results and collect feedback  

