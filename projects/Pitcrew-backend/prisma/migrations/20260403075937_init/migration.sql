-- CreateTable
CREATE TABLE "intents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userAddress" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "amountAlgo" REAL NOT NULL,
    "recipient" TEXT NOT NULL,
    "initialPrice" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "triggeredAt" TIMESTAMP(3),
    "triggerPrice" REAL,
    "executedAt" TIMESTAMP(3),
    "executionTxId" TEXT,
    "expirationAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "intents_userAddress_idx" ON "intents"("userAddress");

-- CreateIndex
CREATE INDEX "intents_status_idx" ON "intents"("status");

-- CreateIndex
CREATE INDEX "intents_expirationAt_idx" ON "intents"("expirationAt");

-- CreateIndex
CREATE INDEX "intents_createdAt_idx" ON "intents"("createdAt");
