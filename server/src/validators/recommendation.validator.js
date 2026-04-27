const { z } = require("zod");

const budgetEnum = z.enum(["low", "medium", "high"]);

const recommendationRequestSchema = z.object({
  location: z.string().trim().min(1, "location is required"),
  area: z.string().trim().min(1).optional(),
  budget: budgetEnum.optional(),
  cuisine: z.union([z.string(), z.array(z.string())]).optional(),
  minRating: z.number().min(0).max(5).optional(),
  preferences: z.array(z.string()).optional().default([]),
});

function normalizeCuisine(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : value.split(",");
  return list
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);
}

function parseRecommendationRequest(payload) {
  const parsed = recommendationRequestSchema.safeParse(payload);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join(", ");
    const error = new Error(`Invalid request: ${message}`);
    error.statusCode = 400;
    throw error;
  }

  const value = parsed.data;
  return {
    location: value.location.trim().toLowerCase(),
    area: value.area ? value.area.trim().toLowerCase() : null,
    budget: value.budget || null,
    cuisine: normalizeCuisine(value.cuisine),
    minRating: value.minRating ?? null,
    preferences: value.preferences || [],
  };
}

module.exports = {
  parseRecommendationRequest,
};
