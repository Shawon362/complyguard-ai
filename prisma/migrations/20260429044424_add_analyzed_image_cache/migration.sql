-- CreateTable
CREATE TABLE "AnalyzedImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isAI" BOOLEAN NOT NULL,
    "confidence" REAL NOT NULL,
    "reasoning" TEXT,
    "hasPeople" BOOLEAN NOT NULL DEFAULT false,
    "hasText" BOOLEAN NOT NULL DEFAULT false,
    "hasAISigns" BOOLEAN NOT NULL DEFAULT false,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AnalyzedImage_shop_idx" ON "AnalyzedImage"("shop");

-- CreateIndex
CREATE INDEX "AnalyzedImage_analyzedAt_idx" ON "AnalyzedImage"("analyzedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyzedImage_shop_imageUrl_key" ON "AnalyzedImage"("shop", "imageUrl");
