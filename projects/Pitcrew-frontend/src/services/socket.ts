import io from 'socket.io-client';
import { Intent } from '../types/intent';

type IntentEvent = 'intent_created' | 'intent_triggered' | 'intent_executed' | 'intent_cancelled';
type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';
type PriceSnapshot = { usd: number; observedAt?: string };
type IntentListener = (intent: Intent) => void;
type ConnectionListener = (state: ConnectionState) => void;
type PriceListener = (snapshot: PriceSnapshot) => void;

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'https://pit-crew.onrender.com';
const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});

const intentListeners: Record<IntentEvent, Set<IntentListener>> = {
  intent_created: new Set(),
  intent_triggered: new Set(),
  intent_executed: new Set(),
  intent_cancelled: new Set(),
};

const connectionListeners = new Set<ConnectionListener>();
const priceListeners = new Set<PriceListener>();

const wireIntentEvent = (event: IntentEvent) => {
  socket.on(event, (intent: Intent) => {
    intentListeners[event].forEach((callback) => callback(intent));
  });
};

wireIntentEvent('intent_created');
wireIntentEvent('intent_triggered');
wireIntentEvent('intent_executed');
wireIntentEvent('intent_cancelled');

socket.on('price_update', (snapshot: PriceSnapshot) => {
  priceListeners.forEach((callback) => callback(snapshot));
});

socket.on('connect', () => {
  connectionListeners.forEach((callback) => callback('connected'));
});

socket.on('disconnect', () => {
  connectionListeners.forEach((callback) => callback('disconnected'));
});

socket.on('reconnect_attempt', () => {
  connectionListeners.forEach((callback) => callback('reconnecting'));
});

export const socketService = {
  joinUser: (userAddress: string) => {
    socket.emit('join_user', userAddress);
  },

  leaveUser: (userAddress: string) => {
    socket.emit('leave_user', userAddress);
  },

  subscribe: (event: IntentEvent, callback: IntentListener) => {
    intentListeners[event].add(callback);
    return () => {
      intentListeners[event].delete(callback);
    };
  },

  subscribePrice: (callback: PriceListener) => {
    priceListeners.add(callback);
    return () => {
      priceListeners.delete(callback);
    };
  },

  unsubscribe: (event: IntentEvent) => {
    intentListeners[event].clear();
  },

  onConnectionState: (callback: ConnectionListener) => {
    connectionListeners.add(callback);
    callback(socket.connected ? 'connected' : 'disconnected');
    return () => {
      connectionListeners.delete(callback);
    };
  },

  reconnect: () => {
    socket.connect();
  },
};

export default socket;
