const test = require("node:test");
const assert = require("node:assert/strict");

const { parseRecommendationRequest } = require("../src/validators/recommendation.validator");

test("parseRecommendationRequest normalizes valid payload", () => {
  const result = parseRecommendationRequest({
    location: " Bangalore ",
    area: " Koramangala ",
    budget: "medium",
    cuisine: "Italian, Chinese",
    minRating: 4.2,
    preferences: ["quick service"],
  });

  assert.deepEqual(result, {
    location: "bangalore",
    area: "koramangala",
    budget: "medium",
    cuisine: ["italian", "chinese"],
    minRating: 4.2,
    preferences: ["quick service"],
  });
});

test("parseRecommendationRequest throws on missing location", () => {
  assert.throws(
    () =>
      parseRecommendationRequest({
        budget: "low",
      }),
    /Invalid request/
  );
});

