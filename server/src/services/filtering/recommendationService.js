const path = require("path");

const env = require("../../config/env");
const { readJson } = require("../../utils/jsonStore");

const restaurantsFile = path.resolve(
  process.cwd(),
  env.DATA_DIR,
  "restaurants.json",
);

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function byHardFilters(restaurants, criteria) {
  return restaurants.filter((item) => {
    const cityMatch = normalizeText(item.city) === criteria.area;
    // const areaMatch =
    //   !criteria.area || normalizeText(item.locality) === criteria.area;
    const ratingMatch =
      criteria.minRating === null ||
      (item.rating !== null && item.rating >= criteria.minRating);
    // return cityMatch && areaMatch && ratingMatch;
    return cityMatch && ratingMatch;
  });
}

function bySoftFilters(restaurants, criteria) {
  return restaurants.filter((item) => {
    const budgetMatch =
      !criteria.budget || item.cost_bucket === criteria.budget;
    const cuisines = (item.cuisines || []).map((cuisine) =>
      normalizeText(cuisine),
    );
    const cuisineMatch =
      criteria.cuisine.length === 0 ||
      criteria.cuisine.some((requested) => cuisines.includes(requested));
    return budgetMatch && cuisineMatch;
  });
}

function scoreRestaurant(item, criteria) {
  let score = 0;
  if (item.rating) score += item.rating * 10;
  if (criteria.budget && item.cost_bucket === criteria.budget) score += 15;

  const cuisines = (item.cuisines || []).map((cuisine) =>
    normalizeText(cuisine),
  );
  for (const requested of criteria.cuisine) {
    if (cuisines.includes(requested)) score += 12;
  }

  if (item.votes) {
    score += Math.min(10, Math.log10(item.votes + 1) * 3);
  }

  return score;
}

function formatCandidate(item, score) {
  return {
    restaurantId: item.id,
    name: item.name,
    city: item.city,
    locality: item.locality,
    cuisine: item.cuisines,
    rating: item.rating,
    estimatedCost: item.avg_cost_for_two,
    costBucket: item.cost_bucket,
    votes: item.votes,
    score: Number(score.toFixed(2)),
  };
}

function diversifyRanked(candidates, limit = 20) {
  const selected = [];
  const seenCuisine = new Set();
  const seenLocality = new Set();
  const remaining = [...candidates];

  while (remaining.length && selected.length < limit) {
    let pickedIndex = remaining.findIndex((item) => {
      const primaryCuisine = normalizeText((item.cuisine || [])[0] || "");
      const locality = normalizeText(item.locality || "");
      return !seenCuisine.has(primaryCuisine) || !seenLocality.has(locality);
    });

    if (pickedIndex === -1) {
      pickedIndex = 0;
    }

    const picked = remaining.splice(pickedIndex, 1)[0];
    selected.push(picked);
    seenCuisine.add(normalizeText((picked.cuisine || [])[0] || ""));
    seenLocality.add(normalizeText(picked.locality || ""));
  }

  return selected;
}

async function getRecommendations(criteria) {
  const allRestaurants = (await readJson(restaurantsFile, [])) || [];

  if (!allRestaurants.length) {
    return {
      meta: {
        candidateCount: 0,
        usedFallback: false,
        appliedConstraints: [],
        constraintsRelaxed: ["dataset-empty"],
      },
      recommendations: [],
    };
  }

  const hardFiltered = byHardFilters(allRestaurants, criteria);
  let selected = bySoftFilters(hardFiltered, criteria);
  let usedFallback = false;
  const constraintsRelaxed = [];

  if (!selected.length && criteria.budget) {
    selected = bySoftFilters(hardFiltered, {
      ...criteria,
      budget: null,
    });
    if (selected.length) {
      usedFallback = true;
      constraintsRelaxed.push("budget");
    }
  }

  if (!selected.length && criteria.cuisine.length) {
    selected = bySoftFilters(hardFiltered, {
      ...criteria,
      cuisine: [],
    });
    if (selected.length) {
      usedFallback = true;
      constraintsRelaxed.push("cuisine");
    }
  }

  if (!selected.length && criteria.minRating !== null) {
    selected = byHardFilters(allRestaurants, {
      ...criteria,
      minRating: null,
    });
    selected = bySoftFilters(selected, {
      ...criteria,
      minRating: null,
      budget: null,
      cuisine: [],
    });
    if (selected.length) {
      usedFallback = true;
      constraintsRelaxed.push("minRating", "budget", "cuisine");
    }
  }

  const ranked = selected
    .map((item) => {
      const score = scoreRestaurant(item, criteria);
      return formatCandidate(item, score);
    })
    .sort((a, b) => b.score - a.score || (b.rating || 0) - (a.rating || 0));

  const diversified = diversifyRanked(ranked, 20);

  return {
    meta: {
      candidateCount: diversified.length,
      usedFallback,
      appliedConstraints: ["location", "minRating", "budget", "cuisine"],
      constraintsRelaxed,
      diversityApplied: true,
      filters: {
        location: criteria.location,
        area: criteria.area,
        budget: criteria.budget,
        cuisine: criteria.cuisine,
        minRating: criteria.minRating,
      },
    },
    recommendations: diversified,
  };
}

module.exports = {
  getRecommendations,
  byHardFilters,
  bySoftFilters,
  scoreRestaurant,
};
