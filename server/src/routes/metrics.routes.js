const express = require("express");

const { snapshotMetrics } = require("../services/telemetry/metricsStore");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json(snapshotMetrics());
});

module.exports = router;
