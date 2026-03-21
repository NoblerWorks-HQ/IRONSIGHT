'use client';

import { useDataFeed, formatPrice } from '@/lib/hooks';

interface OilData {
  type: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function MetricsBar() {
  const { data: oilData } = useDataFeed<OilData[]>('/api/oil', 300000);

  const wti = oilData?.find(o => o.type === 'crude_wti');
  const brent = oilData?.find(o => o.type === 'crude_brent');
  const natGas = oilData?.find(o => o.type === 'natural_gas');

  const metrics = [
    {
      label: 'WTI CRUDE',
      value: wti ? `$${formatPrice(wti.price)}` : '---',
      change: wti?.changePercent || 0,
    },
    {
      label: 'BRENT',
      value: brent ? `$${formatPrice(brent.price)}` : '---',
      change: brent?.changePercent || 0,
    },
    {
      label: 'NAT GAS',
      value: natGas ? `$${formatPrice(natGas.price)}` : '---',
      change: natGas?.changePercent || 0,
    },
    {
      label: 'THREAT LEVEL',
      value: 'ELEVATED',
      change: 0,
      isThreat: true,
      threatClass: 'threat-elevated',
    },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1">
      {metrics.map((m, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-2 border-r border-[var(--border-color)] last:border-r-0 whitespace-nowrap"
        >
          <span className="text-[10px] text-[var(--text-secondary)] tracking-wider">
            {m.label}
          </span>
          <span
            className={`text-sm font-bold ${
              m.isThreat
                ? m.threatClass
                : m.change > 0
                ? 'value-up'
                : m.change < 0
                ? 'value-down'
                : 'text-[var(--text-primary)]'
            }`}
          >
            {m.value}
          </span>
          {!m.isThreat && m.change !== 0 && (
            <span
              className={`text-[10px] ${
                m.change > 0 ? 'value-up' : 'value-down'
              }`}
            >
              {m.change > 0 ? '+' : ''}
              {m.change.toFixed(2)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
