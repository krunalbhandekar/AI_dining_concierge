const {
  parseRecommendationRequest,
} = require("../validators/recommendation.validator");
const {
  generateRecommendations,
} = require("../services/llm/recommendationOrchestratorService");

async function recommendRestaurants(req, res, next) {
  try {
    const criteria = parseRecommendationRequest(req.body || {});

    const result = await generateRecommendations(criteria);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  recommendRestaurants,
};
