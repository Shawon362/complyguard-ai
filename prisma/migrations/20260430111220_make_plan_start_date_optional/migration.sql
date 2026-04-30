-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Merchant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "storeName" TEXT,
    "storeUrl" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "planStartDate" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Merchant" ("createdAt", "id", "onboardingDone", "onboardingStep", "plan", "planStartDate", "shop", "storeName", "storeUrl", "updatedAt") SELECT "createdAt", "id", "onboardingDone", "onboardingStep", "plan", "planStartDate", "shop", "storeName", "storeUrl", "updatedAt" FROM "Merchant";
DROP TABLE "Merchant";
ALTER TABLE "new_Merchant" RENAME TO "Merchant";
CREATE UNIQUE INDEX "Merchant_shop_key" ON "Merchant"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
