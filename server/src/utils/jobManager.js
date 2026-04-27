let jobState = {
  status: "idle", // idle | running | completed | failed
  startedAt: null,
  completedAt: null,
  progress: {
    processed: 0,
    inserted: 0,
    failed: 0,
  },
  error: null,
};

function startJob() {
  if (jobState.status === "running") {
    throw new Error("Job already running");
  }

  jobState = {
    status: "running",
    startedAt: new Date().toISOString(),
    completedAt: null,
    progress: {
      processed: 0,
      inserted: 0,
      failed: 0,
    },
    error: null,
  };
}

function updateProgress(update) {
  jobState.progress = {
    ...jobState.progress,
    ...update,
  };
}

function completeJob() {
  jobState.status = "completed";
  jobState.completedAt = new Date().toISOString();
}

function failJob(error) {
  jobState.status = "failed";
  jobState.error = error.message;
  jobState.completedAt = new Date().toISOString();
}

function getJob() {
  return jobState;
}

module.exports = {
  startJob,
  updateProgress,
  completeJob,
  failJob,
  getJob,
};
