export interface NotificationPreferences {
  inApp: boolean;
  triggerAlerts: boolean;
  executionAlerts: boolean;
  priceAlerts: boolean;
}

export interface ProfileSettings {
  walletAddress: string;
  defaultExpiryMinutes: number;
  notificationPreferences: NotificationPreferences;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileSettingsDto {
  defaultExpiryMinutes: number;
  notificationPreferences: NotificationPreferences;
}
