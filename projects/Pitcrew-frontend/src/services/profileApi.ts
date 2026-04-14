import axios from 'axios';
import { ProfileSettings, UpdateProfileSettingsDto } from '../types/profile';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const api = axios.create({ baseURL: API_BASE, timeout: 12000 });
const AUTH_TOKEN_KEY = 'pitcrew_auth_token';

const getStoredAuthToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const toFriendlyError = (error: unknown): Error => {
  const maybeAxiosError = error as { isAxiosError?: boolean; response?: { data?: { error?: string; message?: string } }; message?: string };

  if (maybeAxiosError?.isAxiosError) {
    if (!maybeAxiosError.response) {
      return new Error(`Cannot reach backend at ${API_BASE}. Make sure backend is running.`);
    }

    const responseMessage = maybeAxiosError.response.data?.error
      || maybeAxiosError.response.data?.message
      || maybeAxiosError.message;

    return new Error(responseMessage || 'Request failed');
  }

  return error instanceof Error ? error : new Error('Unexpected network failure');
};

export const profileApi = {
  getSettings: async (walletAddress: string): Promise<ProfileSettings> => {
    try {
      const response = await api.get(`/profile/settings/${walletAddress}`);
      return response.data as ProfileSettings;
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  updateSettings: async (walletAddress: string, payload: UpdateProfileSettingsDto): Promise<ProfileSettings> => {
    try {
      const response = await api.put(`/profile/settings/${walletAddress}`, payload);
      return response.data as ProfileSettings;
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
};
