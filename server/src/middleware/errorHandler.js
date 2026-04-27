const env = require("../config/env");

function notFoundHandler(req, res) {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500
      ? "Internal server error"
      : err.message || "Request failed";

  if (env.NODE_ENV !== "production") {
    // Keep this log in dev to speed up debugging.
    console.error(err);
  }

  res.status(statusCode).json({
    message,
    requestId: req.requestId || null,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
