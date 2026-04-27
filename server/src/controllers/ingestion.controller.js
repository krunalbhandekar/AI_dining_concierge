const { downloadCSV } = require("../services/ingestion/downloadCsv");
const { ingestDataset } = require("../services/ingestion/ingestionService");
const {
  startJob,
  completeJob,
  failJob,
  getJob,
} = require("../utils/jobManager");

async function startIngestion(req, res) {
  try {
    startJob();

    // Run in background (IMPORTANT)
    setImmediate(async () => {
      try {
        await downloadCSV();

        await ingestDataset();
        completeJob();
      } catch (err) {
        failJob(err);
      }
    });

    res.json({
      message: "Ingestion started",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

function getIngestionStatus(req, res) {
  res.json(getJob());
}

module.exports = {
  startIngestion,
  getIngestionStatus,
};
