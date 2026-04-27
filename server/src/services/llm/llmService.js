const axios = require("axios");

const env = require("../../config/env");

function extractJsonObject(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    throw new Error("LLM returned empty response");
  }

  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  const rawJson = fenced ? fenced[1] : trimmed;
  const firstBrace = rawJson.indexOf("{");
  const lastBrace = rawJson.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("LLM response did not contain a JSON object");
  }

  const jsonString = rawJson.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonString);
}

async function callGroq({
  systemPrompt,
  userPrompt,
  maxRetries = env.LLM_MAX_RETRIES,
}) {
  if (!env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY");
  }

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const response = await axios.post(
        `${env.GROQ_BASE_URL}/chat/completions`,
        {
          model: env.GROQ_MODEL,
          temperature: 0.2,

          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        },
        {
          timeout: env.LLM_TIMEOUT_MS,
          headers: {
            Authorization: `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      const content = response.data?.choices?.[0]?.message?.content || "";
      const parsed = extractJsonObject(content);
      const usage = response.data?.usage || {};
      return {
        parsed,
        usage: {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
        },
      };
    } catch (error) {
      const status = error.response?.status;
      const isRetryable = !status || status >= 500 || status === 429;
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }

  throw new Error("Groq call failed unexpectedly");
}

module.exports = {
  callGroq,
  extractJsonObject,
};
