function getFirstPresent(record, keys) {
  for (const key of keys) {
    if (
      record[key] !== undefined &&
      record[key] !== null &&
      String(record[key]).trim() !== ""
    ) {
      return record[key];
    }
  }
  return null;
}

function normalizeCity(city) {
  if (!city) return null;
  const raw = String(city).trim().toLowerCase();
  const aliasMap = {
    bengaluru: "Bangalore",
    bangalore: "Bangalore",
    bombay: "Mumbai",
    mumbai: "Mumbai",
    delhi: "Delhi",
    new_delhi: "Delhi",
    "new delhi": "Delhi",
  };
  return aliasMap[raw] || raw.charAt(0).toUpperCase() + raw.slice(1);
}

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value)
    .replace(/[^\d.]/g, "")
    .trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCuisines(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/\s+/g, " "))
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase());
}

function getCostBucket(avgCostForTwo) {
  if (avgCostForTwo === null) return "unknown";
  if (avgCostForTwo <= 600) return "low";
  if (avgCostForTwo <= 1400) return "medium";
  return "high";
}

function clampRating(rating) {
  if (rating === null) return null;
  if (rating < 0) return null;
  if (rating > 5) return 5;
  return Number(rating.toFixed(1));
}

function normalizeRestaurant(raw, datasetVersion) {
  const name = getFirstPresent(raw, [
    "name",
    "restaurant_name",
    "Restaurant Name",
  ]);
  const city = normalizeCity(
    getFirstPresent(raw, ["city", "location", "City"]),
  );
  const locality = getFirstPresent(raw, ["locality", "address", "Address"]);
  const cuisines = normalizeCuisines(
    getFirstPresent(raw, ["cuisines", "cuisine", "Cuisine"]),
  );
  const avgCostForTwo = parseNumber(
    getFirstPresent(raw, [
      "approx_cost(for two people)",
      "average_cost_for_two",
      "avg_cost_for_two",
      "cost",
      "Average Cost for two",
    ]),
  );
  const rating = clampRating(
    parseNumber(
      getFirstPresent(raw, [
        "rate",
        "Rate",
        "rating",
        "aggregate_rating",
        "Rating",
      ]),
    ),
  );
  const votes = parseNumber(
    getFirstPresent(raw, ["votes", "Votes", "vote_count"]),
  );

  if (!name || !city) {
    return null;
  }

  return {
    id: null,
    name: String(name).trim(),
    city,
    locality: locality ? String(locality).trim() : null,
    cuisines,
    avg_cost_for_two: avgCostForTwo,
    cost_bucket: getCostBucket(avgCostForTwo),
    rating: rating || 3.5,
    votes,
    source_dataset_version: datasetVersion,
    updated_at: new Date().toISOString(),
  };
}

module.exports = {
  normalizeRestaurant,
};
