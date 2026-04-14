import { PriceData, AssetSymbol, Asset } from '../types/asset';
import { SUPPORTED_ASSETS, ACTIVE_ASSETS } from '../constants/assets';

export const assetService = {
  /**
   * Get all supported assets
   */
  getSupportedAssets: (): Record<AssetSymbol, Asset> => {
    return SUPPORTED_ASSETS;
  },

  /**
   * Get only active assets
   */
  getActiveAssets: (): AssetSymbol[] => {
    return ACTIVE_ASSETS;
  },

  /**
   * Get asset by symbol
   */
  getAsset: (symbol: AssetSymbol): Asset | null => {
    return SUPPORTED_ASSETS[symbol] || null;
  },

  /**
   * Validate if asset is supported
   */
  isValidAsset: (symbol: string): symbol is AssetSymbol => {
    return symbol in SUPPORTED_ASSETS;
  },

  /**
   * Format price by asset decimals
   */
  formatPriceByAsset: (price: number, symbol: AssetSymbol): number => {
    const asset = SUPPORTED_ASSETS[symbol];
    if (!asset) return price;
    const divisor = Math.pow(10, asset.decimals);
    return price / divisor;
  },

  /**
   * Convert micro units to display units
   */
  microToDisplay: (micro: number, decimals: number): number => {
    return micro / Math.pow(10, decimals);
  },

  /**
   * Convert display units to micro units
   */
  displayToMicro: (display: number, decimals: number): number => {
    return display * Math.pow(10, decimals);
  },
};
