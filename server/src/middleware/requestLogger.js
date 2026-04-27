const { recordRequest } = require("../services/telemetry/metricsStore");

let requestSequence = 0;

function requestLogger(req, res, next) {
  const startedAt = Date.now();
  requestSequence += 1;
  const requestId = `req_${requestSequence}`;
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const latencyMs = Date.now() - startedAt;
    const route = req.originalUrl.split("?")[0];
    recordRequest({
      method: req.method,
      route,
      statusCode: res.statusCode,
      latencyMs,
    });

    const logEvent = {
      level: res.statusCode >= 500 ? "error" : "info",
      requestId,
      method: req.method,
      route,
      statusCode: res.statusCode,
      latencyMs,
      timestamp: new Date().toISOString(),
    };
    console.log(JSON.stringify(logEvent));
  });

  next();
}

module.exports = {
  requestLogger,
};
