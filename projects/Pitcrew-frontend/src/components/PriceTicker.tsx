import React from 'react';

interface PriceTickerProps {
  price: number | null;
}

const PriceTicker: React.FC<PriceTickerProps> = ({ price }) => {
  return (
    <div className="price-ticker" aria-live="polite">
      <span className="price-ticker-label">ALGO / USD</span>
      <span className="price-ticker-value">{price ? `$${price.toFixed(4)}` : 'Loading...'}</span>
    </div>
  );
};

export default PriceTicker;
