const metrics = {
  startedAt: new Date().toISOString(),
  requestCount: 0,
  errorCount: 0,
  routeStats: {},
  recentLatencyMs: [],
};

function recordRequest({ method, route, statusCode, latencyMs }) {
  metrics.requestCount += 1;
  if (statusCode >= 400) {
    metrics.errorCount += 1;
  }

  const key = `${method} ${route}`;
  if (!metrics.routeStats[key]) {
    metrics.routeStats[key] = {
      count: 0,
      errors: 0,
      avgLatencyMs: 0,
      lastStatusCode: 200,
    };
  }

  const stat = metrics.routeStats[key];
  stat.count += 1;
  if (statusCode >= 400) stat.errors += 1;
  stat.lastStatusCode = statusCode;
  stat.avgLatencyMs = Number((((stat.avgLatencyMs * (stat.count - 1)) + latencyMs) / stat.count).toFixed(2));

  metrics.recentLatencyMs.push(latencyMs);
  if (metrics.recentLatencyMs.length > 1000) {
    metrics.recentLatencyMs.shift();
  }
}

function snapshotMetrics() {
  const latencies = [...metrics.recentLatencyMs].sort((a, b) => a - b);
  const getPercentile = (p) => {
    if (!latencies.length) return 0;
    const idx = Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length));
    return latencies[idx];
  };

  return {
    startedAt: metrics.startedAt,
    requestCount: metrics.requestCount,
    errorCount: metrics.errorCount,
    errorRate: metrics.requestCount ? Number((metrics.errorCount / metrics.requestCount).toFixed(4)) : 0,
    latencyMs: {
      p50: getPercentile(50),
      p95: getPercentile(95),
      p99: getPercentile(99),
    },
    routes: metrics.routeStats,
  };
}

module.exports = {
  recordRequest,
  snapshotMetrics,
};
