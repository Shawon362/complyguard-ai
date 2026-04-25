// ============================================================
// scan-runner.server.js
// Background scan runner — scan চলে background-এ
// Frontend poll করে result নেয়
// ============================================================

// In-memory store for active scans
// Production-এ Redis ব্যবহার করবেন
const activeScans = new Map();

export function startBackgroundScan(scanId, scanFunction) {
  activeScans.set(scanId, { status: "running", progress: 0 });

  // Run scan in background (don't await)
  scanFunction()
    .then(() => {
      activeScans.set(scanId, { status: "completed", progress: 100 });
    })
    .catch((error) => {
      console.error("Background scan failed:", error.message);
      activeScans.set(scanId, { status: "failed", progress: 0, error: error.message });
    });
}

export function getScanStatus(scanId) {
  return activeScans.get(scanId) || { status: "not_found" };
}

export function updateScanProgress(scanId, progress) {
  const current = activeScans.get(scanId);
  if (current) {
    activeScans.set(scanId, { ...current, progress });
  }
}

export function removeScan(scanId) {
  activeScans.delete(scanId);
}