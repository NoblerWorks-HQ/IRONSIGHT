import { useState, useEffect, useCallback, useRef } from 'react';

export function useDataFeed<T>(url: string, interval: number = 60000, initialData: T | null = null) {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Cache-bust to ensure fresh data on each poll
      const bustUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
      const res = await fetch(bustUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, interval);
    return () => clearInterval(id);
  }, [fetchData, interval]);

  return { data, loading, error, lastUpdated, refetch: fetchData };
}

/** Forces a re-render every `ms` milliseconds so relative timestamps stay fresh. */
export function useTick(ms: number = 15000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

export function timeAgo(date: string | Date): string {
  if (!date) return '';
  const now = new Date();
  const then = new Date(date);

  // Invalid date
  if (isNaN(then.getTime())) return '';

  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  const abs = Math.abs(seconds);

  if (abs < 60) return 'just now';
  if (abs < 3600) return `${Math.floor(abs / 60)}m ago`;
  if (abs < 86400) return `${Math.floor(abs / 3600)}h ago`;
  return `${Math.floor(abs / 86400)}d ago`;
}

export function formatPrice(price: number, decimals: number = 2): string {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatChange(change: number, percent: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
}
