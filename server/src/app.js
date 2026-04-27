const express = require("express");
const cors = require("cors");

const env = require("./config/env");
const healthRoutes = require("./routes/health.routes");
const ingestionRoutes = require("./routes/ingestion.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const metricsRoutes = require("./routes/metrics.routes");
const { requestLogger } = require("./middleware/requestLogger");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
  }),
);
app.use(express.json());
app.use(requestLogger);

app.get("/", (req, res) => {
  res.json({
    message: "Restaurant recommendation API is running",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/ingest", ingestionRoutes);
app.use("/api/recommend", recommendationRoutes);
app.use("/api/metrics", metricsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
