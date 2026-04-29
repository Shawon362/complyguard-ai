// ============================================================
// scan-runner.server.js
// ============================================================

const activeScans = new Map();

// Mark a scan as running
export function markScanRunning(scanId) {
  activeScans.set(scanId, {
    status: "running",
    startedAt: Date.now(),
  });
}

// Mark a scan as completed
export function markScanCompleted(scanId) {
  activeScans.set(scanId, {
    status: "completed",
    completedAt: Date.now(),
  });

  setTimeout(() => activeScans.delete(scanId), 5 * 60 * 1000);
}

// Mark a scan as failed
export function markScanFailed(scanId, error) {
  activeScans.set(scanId, {
    status: "failed",
    error: error?.message || "Unknown error",
    failedAt: Date.now(),
  });

  setTimeout(() => activeScans.delete(scanId), 5 * 60 * 1000);
}

export function getScanRunningStatus(scanId) {
  return activeScans.get(scanId) || { status: "not_tracked" };
}

// Check if scan is currently running
export function isScanRunning(scanId) {
  const scan = activeScans.get(scanId);
  return scan?.status === "running";
}