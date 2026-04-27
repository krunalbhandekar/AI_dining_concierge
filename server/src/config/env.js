const dotenv = require("dotenv");

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development", // production
  PORT: Number(process.env.PORT || 5001),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  DATA_DIR: "data",
  HF_DATASET: "ManikaSaini/zomato-restaurant-recommendation",
  HF_CONFIG: "default",
  HF_SPLIT: "train",
  INGEST_BATCH_SIZE: 100,
  INGEST_MAX_ROWS: 60000,
  DATASET_URL: "./data/zomato.csv",
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  GROQ_MODEL: "llama-3.1-8b-instant",
  GROQ_BASE_URL: "https://api.groq.com/openai/v1",
  LLM_TIMEOUT_MS: 15000,
  LLM_MAX_CANDIDATES: 10,
  LLM_MAX_RETRIES: 2,
  CACHE_TTL_MS: 120000,
  CACHE_MAX_ITEMS: 200,
};

module.exports = env;
