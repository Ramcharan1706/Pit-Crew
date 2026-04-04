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
    "triggeredAt" DATETIME,
    "triggerPrice" REAL,
    "executedAt" DATETIME,
    "executionTxId" TEXT,
    "expirationAt" DATETIME,
    "cancelledAt" DATETIME,
    "cancelReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
