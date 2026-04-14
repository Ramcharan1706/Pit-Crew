import { AssetSymbol } from '../types/asset';

export function formatCurrency(value: number, decimals = 6): string {
  if (!Number.isFinite(value) || value === 0) return '0.00';
  if (Math.abs(value) < 0.000001) return '<0.000001';
  return value.toFixed(decimals);
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeRemaining(expiryDate: string | null): string | null {
  if (!expiryDate) return null;

  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export function formatTxId(txId: string, length = 8): string {
  if (txId.length <= length * 2) return txId;
  return `${txId.substring(0, length)}...${txId.substring(txId.length - length)}`;
}

export function formatAssetSymbol(symbol: string): string {
  return symbol.toUpperCase();
}

export function ellipseAddress(address: string, length = 6): string {
  if (address.length <= length * 2) return address;
  return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
}
