function buildRecommendationPrompt(criteria, candidates) {
  const candidateRows = candidates.map((item, index) => ({
    rank_hint: index + 1,
    restaurantId: item.restaurantId,
    name: item.name,
    city: item.city,
    locality: item.locality,
    cuisine: item.cuisine,
    rating: item.rating,
    estimatedCost: item.estimatedCost,
    costBucket: item.costBucket,
    votes: item.votes,
  }));

  const systemPrompt = [
    "You are a restaurant recommendation ranking assistant.",
    "You must only rank restaurants from the provided candidate list.",
    "Never invent restaurant IDs or names.",
    "Return only valid JSON with this schema:",
    '{"recommendations":[{"restaurantId":"string","explanation":"string"}]}',
    "Each explanation must be 1-2 sentences and personalized to user preferences.",
  ].join(" ");

  const userPrompt = JSON.stringify(
    {
      task: "Rank the best restaurants for this user.",
      userPreferences: {
        location: criteria.location,
        budget: criteria.budget,
        cuisine: criteria.cuisine,
        minRating: criteria.minRating,
        preferences: criteria.preferences,
      },
      candidates: candidateRows,
      constraints: [
        "Only use candidate restaurantId values.",
        "Prioritize matching location and minRating, then budget and cuisine fit.",
      ],
    },
    null,
    2
  );

  return {
    systemPrompt,
    userPrompt,
  };
}

module.exports = {
  buildRecommendationPrompt,
};
