'use client';

import { useDataFeed, formatPrice, formatChange } from '@/lib/hooks';

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  error?: boolean;
}

export default function MarketsPanel() {
  const { data: markets, loading } = useDataFeed<MarketItem[]>('/api/markets', 300000);

  const indices = markets?.filter(m =>
    ['^DJI', '^GSPC', '^VIX', 'GC=F', 'DX-Y.NYB'].includes(m.symbol)
  );
  const defense = markets?.filter(m =>
    !(['^DJI', '^GSPC', '^VIX', 'GC=F', 'DX-Y.NYB'].includes(m.symbol))
  );

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" />
        DEFENSE & MARKETS
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="loading-shimmer h-8 rounded" />
            ))}
          </div>
        ) : (
          <>
            <div className="px-3 pt-2 pb-1">
              <span className="text-[9px] text-[var(--text-accent)] tracking-widest">INDICES</span>
            </div>
            {indices?.map((item, i) => (
              <div key={i} className="data-row flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-medium">{item.name}</span>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className="text-[11px] font-bold">
                    {item.error ? 'N/A' : `$${formatPrice(item.price)}`}
                  </span>
                  {!item.error && (
                    <span className={`text-[9px] w-16 text-right ${item.change >= 0 ? 'value-up' : 'value-down'}`}>
                      {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            ))}

            <div className="px-3 pt-3 pb-1">
              <span className="text-[9px] text-[var(--text-accent)] tracking-widest">DEFENSE CONTRACTORS</span>
            </div>
            {defense?.map((item, i) => (
              <div key={i} className="data-row flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-[var(--text-secondary)] font-mono w-8">{item.symbol}</span>
                  <span className="text-[10px] font-medium">{item.name}</span>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className="text-[11px] font-bold">
                    {item.error ? 'N/A' : `$${formatPrice(item.price)}`}
                  </span>
                  {!item.error && (
                    <span className={`text-[9px] w-16 text-right ${item.change >= 0 ? 'value-up' : 'value-down'}`}>
                      {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
