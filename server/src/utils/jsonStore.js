const fs = require("fs/promises");
const path = require("path");

async function ensureParentDir(filePath) {
  const parentDir = path.dirname(filePath);
  await fs.mkdir(parentDir, { recursive: true });
}

async function readJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(filePath, value) {
  // await ensureParentDir(filePath);
  // await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf-8");

  const tempPath = filePath + ".tmp";

  await fs.mkdir(path.dirname(filePath), { recursive: true });

  // write to temp file first
  await fs.writeFile(tempPath, JSON.stringify(value, null, 2), "utf-8");

  // then rename (atomic)
  await fs.rename(tempPath, filePath);
}

module.exports = {
  readJson,
  writeJson,
};
