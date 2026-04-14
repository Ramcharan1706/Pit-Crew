export type AssetSymbol = 'ALGO' | 'USDC' | 'GOFX' | 'goBTC' | 'goETH';

export interface Asset {
  symbol: AssetSymbol;
  name: string;
  decimals: number;
  icon?: string;
  active: boolean;
}

export interface PriceData {
  symbol: AssetSymbol;
  price: number;
  change24h: number;
  change7d?: number;
  circulating?: number;
  market_cap?: number;
  last_updated?: string;
}
