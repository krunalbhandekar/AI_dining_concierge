const express = require("express");

const {
  startIngestion,
  getIngestionStatus,
} = require("../controllers/ingestion.controller");

const router = express.Router();

router.post("/start", startIngestion);
router.get("/status", getIngestionStatus);

module.exports = router;
