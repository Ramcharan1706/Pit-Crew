-- CreateTable
CREATE TABLE "profile_settings" (
    "walletAddress" TEXT NOT NULL PRIMARY KEY,
    "defaultExpiryMinutes" INTEGER NOT NULL DEFAULT 60,
    "notificationsInApp" BOOLEAN NOT NULL DEFAULT true,
    "notificationsTrigger" BOOLEAN NOT NULL DEFAULT true,
    "notificationsExecution" BOOLEAN NOT NULL DEFAULT true,
    "notificationsPrice" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
