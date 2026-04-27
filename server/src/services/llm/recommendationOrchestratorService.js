const env = require("../../config/env");
const { getRecommendations } = require("../filtering/recommendationService");
const { buildRecommendationPrompt } = require("./promptBuilderService");
const { callGroq } = require("./llmService");
const {
  createKey,
  getCached,
  setCached,
  cacheStats,
} = require("../cache/recommendationCache");

function createFallbackExplanation(item, criteria) {
  const cuisineHint = criteria.cuisine.length
    ? `It offers ${item.cuisine.join(", ")} which aligns with your cuisine preference.`
    : "It aligns well with your requested location and overall constraints.";
  const budgetHint = criteria.budget
    ? `This option is in the ${item.costBucket} budget segment.`
    : "Budget was kept flexible to maximize relevant choices.";
  return `${cuisineHint} ${budgetHint}`.trim();
}

function mergeLlmResult(candidates, llmPayload, criteria) {
  const candidateMap = new Map(
    candidates.map((item) => [item.restaurantId, item]),
  );
  const llmRecommendations = Array.isArray(llmPayload?.recommendations)
    ? llmPayload.recommendations
    : [];

  const merged = [];
  const usedIds = new Set();

  for (const entry of llmRecommendations) {
    const candidate = candidateMap.get(entry.restaurantId);
    if (!candidate || usedIds.has(candidate.restaurantId)) {
      continue;
    }
    merged.push({
      ...candidate,
      explanation:
        String(entry.explanation || "").trim() ||
        createFallbackExplanation(candidate, criteria),
    });
    usedIds.add(candidate.restaurantId);
  }

  for (const candidate of candidates) {
    if (usedIds.has(candidate.restaurantId)) continue;
    merged.push({
      ...candidate,
      explanation: createFallbackExplanation(candidate, criteria),
    });
  }

  return merged;
}

async function generateRecommendations(criteria) {
  const cacheKey = createKey(criteria);
  const cached = getCached(cacheKey);

  if (cached) {
    return {
      ...cached,
      meta: {
        ...cached.meta,
        cacheHit: true,
      },
    };
  }

  const base = await getRecommendations(criteria);
  const candidates = base.recommendations.slice(0, env.LLM_MAX_CANDIDATES);

  if (!candidates.length) {
    return {
      ...base,
      meta: {
        ...base.meta,
        llmUsed: false,
        llmFallbackReason: "no-candidates",
        cacheHit: false,
        cache: cacheStats(),
      },
    };
  }

  try {
    const { systemPrompt, userPrompt } = buildRecommendationPrompt(
      criteria,
      candidates,
    );

    const llmResponse = await callGroq({ systemPrompt, userPrompt });
    const rankedWithExplanations = mergeLlmResult(
      candidates,
      llmResponse.parsed,
      criteria,
    );

    const result = {
      meta: {
        ...base.meta,
        candidateCount: rankedWithExplanations.length,
        llmUsed: true,
        llmModel: env.GROQ_MODEL,
        cacheHit: false,
        cache: cacheStats(),
        llmUsage: llmResponse.usage,
      },
      recommendations: rankedWithExplanations,
    };

    setCached(cacheKey, result);
    return result;
  } catch (error) {
    const fallback = candidates.map((item) => ({
      ...item,
      explanation: createFallbackExplanation(item, criteria),
    }));

    const result = {
      meta: {
        ...base.meta,
        candidateCount: fallback.length,
        llmUsed: false,
        llmFallbackReason: error.message,
        cacheHit: false,
        cache: cacheStats(),
      },
      recommendations: fallback,
    };
    setCached(cacheKey, result);
    return result;
  }
}

module.exports = {
  generateRecommendations,
};
