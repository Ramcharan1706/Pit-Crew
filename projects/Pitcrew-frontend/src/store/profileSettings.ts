import { ProfileSettings, UpdateProfileSettingsDto } from '../types/profile';
import { profileApi } from '../services/profileApi';

const PROFILE_CACHE_PREFIX = 'pitcrew_profile_settings_';

const getCacheKey = (walletAddress: string) => `${PROFILE_CACHE_PREFIX}${walletAddress.toLowerCase()}`;

export const defaultProfileSettings = (walletAddress: string): ProfileSettings => ({
  walletAddress,
  defaultExpiryMinutes: 60,
  notificationPreferences: {
    inApp: true,
    triggerAlerts: true,
    executionAlerts: true,
    priceAlerts: false,
  },
});

export const profileSettingsStore = {
  loadCached: (walletAddress: string): ProfileSettings | null => {
    try {
      const raw = localStorage.getItem(getCacheKey(walletAddress));
      return raw ? (JSON.parse(raw) as ProfileSettings) : null;
    } catch {
      return null;
    }
  },
  saveCached: (settings: ProfileSettings): void => {
    try {
      localStorage.setItem(getCacheKey(settings.walletAddress), JSON.stringify(settings));
    } catch {
      // Ignore cache failures.
    }
  },
  fetch: async (walletAddress: string): Promise<ProfileSettings> => {
    try {
      const settings = await profileApi.getSettings(walletAddress);
      profileSettingsStore.saveCached(settings);
      return settings;
    } catch {
      const cached = profileSettingsStore.loadCached(walletAddress);
      if (cached) {
        return cached;
      }

      return defaultProfileSettings(walletAddress);
    }
  },
  update: async (walletAddress: string, payload: UpdateProfileSettingsDto): Promise<ProfileSettings> => {
    const settings = await profileApi.updateSettings(walletAddress, payload);
    profileSettingsStore.saveCached(settings);
    return settings;
  },
};
