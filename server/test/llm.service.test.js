const test = require("node:test");
const assert = require("node:assert/strict");

const { extractJsonObject } = require("../src/services/llm/llmService");

test("extractJsonObject parses fenced json response", () => {
  const input = "```json\n{\"recommendations\":[{\"restaurantId\":\"r1\",\"explanation\":\"Good fit\"}]}\n```";
  const parsed = extractJsonObject(input);
  assert.equal(parsed.recommendations[0].restaurantId, "r1");
});

test("extractJsonObject throws for invalid payload", () => {
  assert.throws(() => extractJsonObject("not-json-response"), /JSON object/);
});

