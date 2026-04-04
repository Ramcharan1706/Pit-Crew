import axios from 'axios';
import { CreateIntentDto, Intent } from '../types/intent';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const api = axios.create({ baseURL: API_BASE, timeout: 12000 });

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

type ConfirmExecutionResponse = Intent | { status: 'pending'; message: string };

export const intentApi = {
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
  }
};
