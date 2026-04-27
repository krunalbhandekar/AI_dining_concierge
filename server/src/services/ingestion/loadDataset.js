const axios = require("axios");
const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path");
const { parse } = require("csv-parse");

const env = require("../../config/env");

function toArrayPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.rows))
    return payload.rows.map((row) => row.row || row);
  return [];
}

async function loadFromUrl() {
  const dataSetUrl = env.DATASET_URL;

  const looksLikeLocalPath =
    dataSetUrl.startsWith("./") ||
    dataSetUrl.startsWith("/") ||
    dataSetUrl.endsWith(".json") ||
    dataSetUrl.endsWith(".csv");

  if (looksLikeLocalPath) {
    const absolutePath = path.isAbsolute(dataSetUrl)
      ? dataSetUrl
      : path.resolve(process.cwd(), dataSetUrl);

    if (absolutePath.toLowerCase().endsWith(".csv")) {
      return new Promise((resolve, reject) => {
        const records = [];

        fs.createReadStream(absolutePath)
          .pipe(
            parse({
              columns: true,
              skip_empty_lines: true,
              trim: true,
            }),
          )
          .on("data", (row) => {
            records.push(row);
          })
          .on("end", () => {
            console.log("CSV loaded:", records.length);
            resolve(records);
          })
          .on("error", reject);
      });
    }

    const fileData = await fsPromises.readFile(absolutePath, "utf-8");
    return toArrayPayload(JSON.parse(fileData));
  }

  const response = await axios.get(dataSetUrl, { timeout: 30000 });
  const contentType = response.headers["content-type"] || "";

  if (
    contentType.includes("text/csv") ||
    dataSetUrl.toLowerCase().endsWith(".csv")
  ) {
    return parse(response.data, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  }

  return toArrayPayload(response.data);
}

// function sleep(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// async function loadFromHuggingFaceRows(maxRows) {
//   const rows = [];
//   let offset = 0;
//   const batchSize = env.INGEST_BATCH_SIZE;
//   const encodedDataset = encodeURIComponent(env.HF_DATASET);
//   const encodedConfig = encodeURIComponent(env.HF_CONFIG);
//   const encodedSplit = encodeURIComponent(env.HF_SPLIT);

//   while (rows.length < maxRows) {
//     try {
//       const requestLength = Math.min(batchSize, maxRows - rows.length);

//       const url = `https://datasets-server.huggingface.co/rows?dataset=${encodedDataset}&config=${encodedConfig}&split=${encodedSplit}&offset=${offset}&length=${requestLength}`;
//       const response = await axios.get(url, { timeout: 30000 });
//       const batch = toArrayPayload(response.data);

//       if (!batch.length) break;

//       rows.push(...batch);
//       offset += batch.length;
//       if (batch.length < requestLength) break;

//       await sleep(500); // IMPORTANT (avoid rate limit)
//     } catch (err) {
//       if (err.response?.status === 429) {
//         console.log("Rate limited... retrying");
//         await sleep(2000); // backoff
//         continue;
//       }
//       throw err;
//     }
//   }

//   return rows;
// }

async function loadDataset() {
  if (env.DATASET_URL) {
    const records = await loadFromUrl();
    return records.slice(0, env.INGEST_MAX_ROWS);
  }

  return [];

  // return loadFromHuggingFaceRows(maxRows);
}

module.exports = {
  loadDataset,
};
