import axios from 'axios';
import { CreateIntentDto, Intent } from '../types/intent';
import { analyticsService } from './analyticsService';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'https://pit-crew.onrender.com';
const api = axios.create({ baseURL: API_BASE, timeout: 12000 });
const AUTH_TOKEN_KEY = 'pitcrew_auth_token';

const getStoredAuthToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

const setStoredAuthToken = (token: string | null): void => {
  try {
    if (!token) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return;
    }

    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // ignore storage errors and continue with in-memory usage
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

export interface HealthResponse {
  ok: boolean;
  db: 'up' | 'down';
  price?: number;
  observedAt?: string;
}

export interface AuthChallengeResponse {
  address: string;
  message: string;
  expiresAt: string;
}

export interface AuthSessionResponse {
  token?: string;
  address: string;
  expiresAt: string;
}

type ConfirmExecutionResponse = Intent | { status: 'pending'; message: string };

export const intentApi = {
  setAuthToken: (token: string | null): void => {
    setStoredAuthToken(token);
  },
  getAuthToken: (): string | null => getStoredAuthToken(),
  requestAuthChallenge: async (address: string): Promise<AuthChallengeResponse> => {
    try {
      const response = await api.post('/auth/challenge', { address });
      return response.data as AuthChallengeResponse;
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  verifyAuthChallenge: async (address: string, signature: string): Promise<AuthSessionResponse> => {
    try {
      const response = await api.post('/auth/verify', { address, signature });
      const session = response.data as AuthSessionResponse;
      if (session.token) {
        setStoredAuthToken(session.token);
      }

      return session;
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  getAuthSession: async (): Promise<AuthSessionResponse> => {
    try {
      const response = await api.get('/auth/session');
      return response.data as AuthSessionResponse;
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  create: async (intent: CreateIntentDto): Promise<Intent> => {
    try {
      const response = await api.post('/intents', intent);
      return response.data as Intent;
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  list: async (userAddress: string): Promise<Intent[]> => {
    try {
      const response = await api.get(`/intents/${userAddress}`);
      return response.data as Intent[];
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  getById: async (id: string): Promise<Intent> => {
    try {
      const response = await api.get(`/intent/${id}`);
      return response.data as Intent;
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  updateStatus: async (id: string, status: Intent['status']): Promise<Intent> => {
    try {
      const response = await api.patch(`/intents/${id}/status`, { status });
      return response.data as Intent;
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  confirmExecution: async (id: string, txnId: string): Promise<ConfirmExecutionResponse> => {
    try {
      const response = await api.post(`/intents/${id}/confirm-execution`, { txnId });
      return response.data as ConfirmExecutionResponse;
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  cancel: async (id: string, userAddress: string, reason?: string): Promise<Intent> => {
    try {
      const response = await api.post(`/intents/${id}/cancel`, { userAddress, reason });
      return response.data as Intent;
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  health: async (): Promise<HealthResponse> => {
    try {
      const response = await api.get('/health');
      return response.data as HealthResponse;
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  searchIntents: async (
    userAddress: string,
    params: {
      q?: string;
      status?: string;
      condition?: string;
      amount_min?: number;
      amount_max?: number;
      limit?: number;
      offset?: number;
      sort_by?: string;
      sort_order?: string;
    } = {}
  ): Promise<{ data: Intent[]; total: number; limit: number; offset: number; hasMore: boolean }> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.q) queryParams.append('q', params.q);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.condition && params.condition !== 'all') queryParams.append('condition', params.condition);
      if (params.amount_min !== undefined && params.amount_min > 0) queryParams.append('amount_min', String(params.amount_min));
      if (params.amount_max !== undefined && isFinite(params.amount_max)) queryParams.append('amount_max', String(params.amount_max));
      if (params.limit) queryParams.append('limit', String(params.limit));
      if (params.offset) queryParams.append('offset', String(params.offset));
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);

      const response = await api.get(`/intents/${userAddress}/search?${queryParams.toString()}`);
      return response.data as { data: Intent[]; total: number; limit: number; offset: number; hasMore: boolean };
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  /**
   * Get multi-asset support status
   */
  getAssetStatus: async (): Promise<{ supportedAssets: string[] }> => {
    try {
      const response = await api.get('/assets');
      return response.data as { supportedAssets: string[] };
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  /**
   * Get historical intents with filters
   */
  getHistory: async (
    userAddress: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      status?: string;
      condition?: string;
    }
  ): Promise<Intent[]> => {
    try {
      const intents = await intentApi.list(userAddress);

      return intents.filter((intent) => {
        if (filters?.status && intent.status !== filters.status) {
          return false;
        }

        if (filters?.condition && intent.condition !== filters.condition) {
          return false;
        }

        if (filters?.startDate) {
          const startDate = new Date(filters.startDate);
          if (new Date(intent.createdAt) < startDate) {
            return false;
          }
        }

        if (filters?.endDate) {
          const endDate = new Date(filters.endDate);
          if (new Date(intent.createdAt) > endDate) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  /**
   * Get analytics metrics
   */
  getAnalytics: async (userAddress: string): Promise<any> => {
    try {
      const intents = await intentApi.list(userAddress);
      return analyticsService.calculateMetrics(intents);
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  /**
   * Convenience methods for components
   */
  createIntent: async (dto: CreateIntentDto): Promise<Intent> => {
    return intentApi.create(dto);
  },
  getIntentById: async (id: string): Promise<Intent> => {
    return intentApi.getById(id);
  },
  cancelIntent: async (id: string, reason?: string): Promise<Intent> => {
    // Extract userAddress from localStorage or session
    const address = localStorage.getItem('currentUserAddress') || '';
    return intentApi.cancel(id, address, reason);
  },
};
