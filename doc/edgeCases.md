# Detailed Edge Cases

This document lists detailed edge cases for the AI-powered restaurant recommendation system, mapped to the phases defined in `doc/phaseWiseArchitecture.md`.

Use this as a quality checklist for implementation, testing, and production hardening.

---

## Phase 1: Data Ingestion and Preparation

### 1. Source availability and schema issues
- Dataset URL is unavailable, rate-limited, or returns partial data.
- Dataset schema changes unexpectedly (renamed columns, removed fields, changed data types).
- Required columns such as `location`, `cuisine`, or `rating` are missing.
- Same column appears with multiple spellings (for example, `cost_for_two` vs `average_cost_for_two`).

**Expected handling**
- Fail fast with a clear ingestion error and retry policy.
- Add schema version checks and fallback mappings.
- Block downstream serving if critical columns are missing.

### 2. Data quality anomalies
- Ratings outside valid range (negative, greater than max scale, string values like `"N/A"`).
- Costs stored in mixed formats (`"500"`, `"₹500 for two"`, `"~700"`).
- Cuisine in free-text mixed formats (`"North Indian, Chinese"`, typos, extra spaces).
- Duplicate restaurants with slight name variations.
- Same restaurant appears multiple times with conflicting rating/cost values.

**Expected handling**
- Strong normalization/parsing rules with rejected-row logging.
- Deduplication based on composite keys (`name + location + address`).
- Conflict resolution policy (latest record, median cost, highest confidence source).

### 3. Geographic normalization edge cases
- City aliases and misspellings (`Bengaluru` vs `Bangalore`, `Bombay` vs `Mumbai`).
- Mixed granularity locations (city-level vs locality-level).
- Location field contains landmarks instead of city names.
- Non-English or transliterated location text.

**Expected handling**
- Canonical city dictionary with alias mapping.
- Hierarchical location model (city, zone, locality).
- Unknown locations routed to a review bucket.

### 4. Storage and indexing failures
- Ingestion succeeds but storage write fails midway.
- Partial writes create inconsistent catalog snapshots.
- Index creation fails, causing slow queries at runtime.

**Expected handling**
- Atomic dataset versioning (write to staging, then promote).
- Rollback incomplete snapshots.
- Health checks before making new dataset version active.

---

## Phase 2: User Preference Collection

### 1. Invalid or ambiguous user input
- Empty location, budget, or cuisine when required.
- Budget provided as free text (`"not too expensive"`) not mapped to buckets.
- Invalid rating input (`6`, `-1`, `"good"`).
- Multiple cuisines with contradictory separators or typos.
- Inputs with only whitespace or emojis.

**Expected handling**
- Strict validation with user-friendly correction prompts.
- NLP normalization for budget and cuisine aliases.
- Default fallback values only when explicitly allowed.

### 2. Conflicting constraints
- Very low budget with very high minimum rating in expensive locations.
- Rare cuisine + strict rating + strict budget leading to zero candidates.
- Additional preferences that conflict (`quiet place` and `live music`).

**Expected handling**
- Detect over-constrained requests.
- Ask for constraint relaxation or auto-relax based on policy.
- Explain which condition caused low/zero results.

### 3. Malicious or unsafe input
- Prompt injection attempts in optional preference fields.
- SQL/script payloads embedded in input text.
- Extremely long text causing memory/prompt overflow.

**Expected handling**
- Sanitize and escape all user input.
- Enforce input length limits and block suspicious patterns.
- Keep user text isolated from system prompt instructions.

### 4. Language and accessibility
- User inputs mixed language text (for example, Hindi + English).
- Transliteration differences (`Paneer` vs `Panneer`).
- Misspelled cuisines and city names.

**Expected handling**
- Fuzzy matching and multilingual alias dictionaries.
- Present interpretation confirmation when confidence is low.

---

## Phase 3: Candidate Retrieval (Rule-Based Filtering)

### 1. Zero or near-zero candidate sets
- No restaurant matches all hard constraints.
- Only one candidate remains, reducing ranking usefulness.
- Candidate set is too small for meaningful LLM comparison.

**Expected handling**
- Controlled fallback ladder (relax one constraint at a time).
- Return transparent reason and revised criteria used.

### 2. Overly broad candidate sets
- Very broad input returns thousands of records.
- Candidate list too large for LLM token budget.

**Expected handling**
- Pre-rank with heuristic score and cap candidates (`top N`).
- Ensure diversity sampling by cuisine/area/cost before LLM step.

### 3. Filter logic correctness
- Boundary bugs (`rating >= min_rating` vs `>`).
- Budget range overlap or gaps between low/medium/high buckets.
- Multi-cuisine restaurants excluded incorrectly due to exact-match logic.

**Expected handling**
- Unit tests for all boundary and bucket conditions.
- Tokenized cuisine matching with partial and synonym support.

### 4. Bias introduced by filtering
- Popular localities dominate results, starving less represented areas.
- High-rating bias pushes out affordable but unrated options.

**Expected handling**
- Add balance constraints (area diversity, budget diversity).
- Keep optional exploration slots in candidate pool.

---

## Phase 4: LLM-Based Recommendation and Ranking

### 1. Hallucination and faithfulness
- LLM recommends restaurants not present in candidate set.
- LLM invents attributes (rating, cost, features) not in source data.
- Explanations contradict structured fields.

**Expected handling**
- Enforce candidate ID grounding and strict response schema.
- Post-validate all attributes against catalog before display.
- Regenerate or fallback to rule-based output on mismatch.

### 2. Prompt and token constraints
- Prompt exceeds model token limit due to large candidate context.
- Long explanations cause truncated output.
- Important instruction dropped due to prompt compression.

**Expected handling**
- Candidate compression, field pruning, and deterministic template.
- Max-token controls and retry with shorter context.

### 3. Ranking instability
- Same input yields materially different rankings across runs.
- Tie cases produce arbitrary ordering.
- Model overweights wording instead of user constraints.

**Expected handling**
- Low-temperature configuration for ranking tasks.
- Deterministic tie-breakers (rating, distance proxy, cost fit).
- A/B test prompt versions for ranking consistency.

### 4. Safety and abuse
- User asks for discriminatory filtering.
- Prompt injection attempts to override recommendation policy.
- User requests hidden system instructions.

**Expected handling**
- Safety policy filters before LLM call.
- Instruction hierarchy with non-overridable system constraints.
- Refusal and safe alternative recommendations where needed.

### 5. Model/API operational failures
- LLM API timeout, 429 rate limits, or transient 5xx errors.
- JSON output malformed and parser fails.
- Provider outage in production.

**Expected handling**
- Retries with exponential backoff and circuit breaker.
- Strict JSON schema + repair attempt once.
- Graceful fallback to non-LLM ranking mode.

---

## Phase 5: Presentation Layer

### 1. Display/data mismatch
- UI shows cost/rating values that differ from backend payload.
- Currency symbol missing or inconsistent.
- Rounded ratings displayed incorrectly.

**Expected handling**
- Contract tests between API and UI model.
- Centralized formatting utilities for currency and rating.

### 2. Empty and degraded states
- No recommendations available after fallback attempts.
- LLM explanation missing while structured ranking exists.
- Partial response due to timeout mid-render.

**Expected handling**
- Clear empty-state messaging with actionable next steps.
- Show structured recommendation even if explanation fails.
- Progressive rendering with partial-result indicators.

### 3. Duplicate or low-diversity output
- Top results contain near-identical options from same chain/locality.
- Same cuisine repeated despite broad user request.

**Expected handling**
- Diversity constraints in final output assembly.
- Duplicate suppression on normalized restaurant identity.

### 4. Localization and readability
- Very long restaurant names break layout.
- Unsupported characters render incorrectly.
- Explanations too long for mobile views.

**Expected handling**
- Responsive truncation with expand/collapse.
- UTF-safe rendering and font fallback.
- Explanation length limits and summary mode.

---

## Phase 6: Monitoring, Feedback, and Improvement

### 1. Logging and observability gaps
- Requests are served but key events are not logged.
- Logs miss correlation IDs, making incidents hard to debug.
- PII accidentally logged in plaintext.

**Expected handling**
- Mandatory structured logs with request/session IDs.
- PII masking and retention policies.

### 2. Feedback quality issues
- Sparse user feedback (few clicks/ratings).
- Feedback loops biased toward frequently shown restaurants.
- Bot-like traffic distorts acceptance metrics.

**Expected handling**
- Weighted metrics and traffic quality filters.
- Exploration strategy to reduce exposure bias.

### 3. Drift and regression
- Dataset updates silently degrade recommendation quality.
- Prompt changes improve one segment but hurt another.
- Model provider upgrade changes behavior unexpectedly.

**Expected handling**
- Versioned experiments and regression test suite.
- Offline benchmark set per city/budget/cuisine segment.
- Canary rollout with rollback triggers.

### 4. Cost and latency creep
- LLM token costs increase with traffic growth.
- p95 latency becomes unacceptable during peak hours.
- Retry storms amplify API usage and cost.

**Expected handling**
- Cost budgets and token caps per request.
- Cache repeated query signatures.
- Backpressure, queueing, and retry guards.

---

## Cross-Phase Critical Edge Cases

### 1. End-to-end consistency
- Phase 3 candidate IDs do not map to Phase 5 display records.
- Schema mismatch between ingestion output and prompt builder input.

**Mitigation**
- Shared typed schema contracts and integration tests.

### 2. Stale data and cache invalidation
- New ingestion version is live, but old cache still serves outdated restaurants.

**Mitigation**
- Dataset version tags in cache keys and response payloads.

### 3. Race conditions
- Concurrent requests mutate shared fallback configuration.
- Mid-request dataset refresh causes mixed snapshot reads.

**Mitigation**
- Immutable request context and snapshot-based reads.

### 4. Fairness and ethical behavior
- Recommendations disproportionately favor premium areas.
- Minority cuisines never appear due to historical sparsity.

**Mitigation**
- Fairness audits by segment; controlled diversity inclusion.

### 5. Disaster recovery
- Upstream dataset source and LLM provider are both down.

**Mitigation**
- Last-known-good dataset snapshot + deterministic fallback ranking.

---

## Suggested Test Matrix

- **Input validation tests**: null, malformed, out-of-range, multilingual, malicious input
- **Filter tests**: boundary ratings, budget bucket edges, zero-result and large-result flows
- **LLM contract tests**: schema validity, hallucination checks, retry/fallback behavior
- **UI tests**: empty states, partial states, duplicate suppression, formatting correctness
- **Observability tests**: log completeness, PII masking, metric integrity
- **Performance tests**: high concurrency, p95 latency, cost-per-request limits

