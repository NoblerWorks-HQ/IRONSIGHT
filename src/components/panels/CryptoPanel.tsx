'use client';

import { useDataFeed } from '@/lib/hooks';

interface CryptoData {
  name: string;
  symbol: string;
  price: number;
  changePercent: number;
  error?: boolean;
}

const SYMBOL_COLORS: Record<string, string> = {
  BTC: '#f7931a',
  ETH: '#627eea',
  SOL: '#9945ff',
  BNB: '#f3ba2f',
};

export default function CryptoPanel() {
  const { data: prices, loading } = useDataFeed<CryptoData[]>('/api/crypto', 300000);

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" style={{ background: '#f7931a' }} />
        CRYPTO MARKETS
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="loading-shimmer h-10 rounded" />
            ))}
          </div>
        ) : (
          prices?.map((item, i) => (
            <div key={i} className="data-row flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-[var(--text-primary)]">
                  {item.name}
                </div>
                <div className="text-[9px] font-bold" style={{ color: SYMBOL_COLORS[item.symbol] || 'var(--text-secondary)' }}>
                  {item.symbol}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${item.error ? 'text-[var(--text-secondary)]' : ''}`}>
                  {item.error ? 'N/A' : `$${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
                {!item.error && (
                  <div className={`text-[10px] ${item.changePercent >= 0 ? 'value-up' : 'value-down'}`}>
                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent}%
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
