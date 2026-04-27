const test = require("node:test");
const assert = require("node:assert/strict");

const {
  byHardFilters,
  bySoftFilters,
  scoreRestaurant,
} = require("../src/services/filtering/recommendationService");

const sample = [
  {
    id: "r1",
    city: "Bangalore",
    rating: 4.5,
    cost_bucket: "medium",
    cuisines: ["Italian", "Chinese"],
    votes: 1000,
  },
  {
    id: "r2",
    city: "Bangalore",
    rating: 3.8,
    cost_bucket: "low",
    cuisines: ["South Indian"],
    votes: 120,
  },
];

test("hard filters enforce location and minRating", () => {
  const filtered = byHardFilters(sample, {
    location: "bangalore",
    minRating: 4,
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "r1");
});

test("soft filters enforce budget and cuisine", () => {
  const filtered = bySoftFilters(sample, {
    budget: "medium",
    cuisine: ["italian"],
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "r1");
});

test("scoreRestaurant rewards rating and match quality", () => {
  const highScore = scoreRestaurant(sample[0], {
    budget: "medium",
    cuisine: ["italian"],
  });
  const lowScore = scoreRestaurant(sample[1], {
    budget: "medium",
    cuisine: ["italian"],
  });
  assert.ok(highScore > lowScore);
});

