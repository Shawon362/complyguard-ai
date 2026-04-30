-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "fixAvailable" BOOLEAN NOT NULL DEFAULT false,
    "fixAction" TEXT,
    "suggestedFix" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "fixedAt" DATETIME,
    "fixDetails" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanId" TEXT NOT NULL,
    CONSTRAINT "Issue_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Issue" ("article", "category", "createdAt", "description", "evidence", "fixAction", "fixAvailable", "id", "scanId", "severity", "shop", "status", "suggestedFix", "title") SELECT "article", "category", "createdAt", "description", "evidence", "fixAction", "fixAvailable", "id", "scanId", "severity", "shop", "status", "suggestedFix", "title" FROM "Issue";
DROP TABLE "Issue";
ALTER TABLE "new_Issue" RENAME TO "Issue";
CREATE INDEX "Issue_scanId_idx" ON "Issue"("scanId");
CREATE INDEX "Issue_shop_idx" ON "Issue"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
