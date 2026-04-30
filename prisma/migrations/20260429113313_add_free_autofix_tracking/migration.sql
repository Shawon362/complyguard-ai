-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Scan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "grade" TEXT,
    "score" INTEGER,
    "totalProducts" INTEGER NOT NULL DEFAULT 0,
    "totalImages" INTEGER NOT NULL DEFAULT 0,
    "totalPages" INTEGER NOT NULL DEFAULT 0,
    "criticalCount" INTEGER NOT NULL DEFAULT 0,
    "highCount" INTEGER NOT NULL DEFAULT 0,
    "mediumCount" INTEGER NOT NULL DEFAULT 0,
    "lowCount" INTEGER NOT NULL DEFAULT 0,
    "currentPhase" TEXT NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "imagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "imagesTotal" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "freeAutoFixesUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);
INSERT INTO "new_Scan" ("completedAt", "createdAt", "criticalCount", "currentPhase", "errorMessage", "grade", "highCount", "id", "imagesProcessed", "imagesTotal", "lowCount", "mediumCount", "progress", "score", "shop", "status", "totalImages", "totalPages", "totalProducts") SELECT "completedAt", "createdAt", "criticalCount", "currentPhase", "errorMessage", "grade", "highCount", "id", "imagesProcessed", "imagesTotal", "lowCount", "mediumCount", "progress", "score", "shop", "status", "totalImages", "totalPages", "totalProducts" FROM "Scan";
DROP TABLE "Scan";
ALTER TABLE "new_Scan" RENAME TO "Scan";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
