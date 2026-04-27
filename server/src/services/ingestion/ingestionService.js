const path = require("path");

const env = require("../../config/env");
const { readJson, writeJson } = require("../../utils/jsonStore");
const { loadDataset } = require("./loadDataset");
const { normalizeRestaurant } = require("./normalizeRestaurant");
const { updateProgress } = require("../../utils/jobManager");

const restaurantsFile = path.resolve(
  process.cwd(),
  env.DATA_DIR,
  "restaurants.json",
);
const ingestionLogFile = path.resolve(
  process.cwd(),
  env.DATA_DIR,
  "ingestion-log.json",
);

function createRestaurantKey(item) {
  const locality = item.locality || "";
  return `${item.name.toLowerCase()}|${item.city.toLowerCase()}|${locality.toLowerCase()}`;
}

async function ingestDataset() {
  const startedAt = new Date().toISOString();
  const datasetVersion = `${env.HF_DATASET}@${startedAt}`;
  const summary = {
    startedAt,
    sourceUrl: env.DATASET_URL,
    requested: env.INGEST_MAX_ROWS,
    processed: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    datasetVersion,
  };

  const rawRecords = await loadDataset();

  const existing = (await readJson(restaurantsFile, [])) || [];
  const keyToIndex = new Map(
    existing.map((item, index) => [createRestaurantKey(item), index]),
  );

  for (const raw of rawRecords) {
    summary.processed += 1;
    try {
      const normalized = normalizeRestaurant(raw, datasetVersion);
      if (!normalized) {
        summary.skipped += 1;
        continue;
      }

      const key = createRestaurantKey(normalized);
      // if (keyToIndex.has(key)) {
      //   const existingIndex = keyToIndex.get(key);
      //   existing[existingIndex] = {
      //     ...existing[existingIndex],
      //     ...normalized,
      //     id: existing[existingIndex].id,
      //     created_at: existing[existingIndex].created_at,
      //   };
      //   summary.updated += 1;
      // } else {
      normalized.id = `res_${existing.length + 1}`;
      normalized.created_at = new Date().toISOString();
      existing.push(normalized);
      // keyToIndex.set(key, existing.length - 1);
      summary.inserted += 1;
      // }
    } catch (error) {
      summary.failed += 1;
    }

    // Update every 100 records (avoid too frequent updates)
    if (summary.processed % 100 === 0) {
      updateProgress({
        processed: summary.processed,
        inserted: summary.inserted,
        failed: summary.failed,
      });
    }
  }

  summary.completedAt = new Date().toISOString();
  await writeJson(restaurantsFile, existing);

  const previousLogs = (await readJson(ingestionLogFile, [])) || [];
  previousLogs.push(summary);
  await writeJson(ingestionLogFile, previousLogs);

  return {
    summary,
    totalRestaurants: existing.length,
    dataPath: restaurantsFile,
  };
}

module.exports = {
  ingestDataset,
};
