import { Asset, AssetSymbol } from '../types/asset';

export const SUPPORTED_ASSETS: Record<AssetSymbol, Asset> = {
  ALGO: {
    symbol: 'ALGO',
    name: 'Algorand',
    decimals: 6,
    active: true,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    active: true,
  },
  GOFX: {
    symbol: 'GOFX',
    name: 'GoFX Token',
    decimals: 6,
    active: false,
  },
  goBTC: {
    symbol: 'goBTC',
    name: 'Algorand BTC',
    decimals: 8,
    active: false,
  },
  goETH: {
    symbol: 'goETH',
    name: 'Algorand ETH',
    decimals: 8,
    active: false,
  },
};

export const ACTIVE_ASSETS: AssetSymbol[] = Object.entries(SUPPORTED_ASSETS)
  .filter(([_, v]) => v.active)
  .map(([k]) => k as AssetSymbol);
