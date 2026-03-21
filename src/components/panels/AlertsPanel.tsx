'use client';

import { useEffect, useRef, useState } from 'react';
import { useDataFeed } from '@/lib/hooks';
import { playAlertSound } from '@/lib/generateAlert';

interface AlertData {
  status: 'ACTIVE' | 'CLEAR';
  activeCount: number;
  alerts: {
    id: string;
    time: string;
    type: string;
    threat: string;
    locations: string[];
    source: string;
    active: boolean;
  }[];
  lastChecked: string;
}

const TYPE_ICONS: Record<string, string> = {
  MISSILE: '🚀',
  ROCKET: '🎯',
  DRONE: '✈',
  MORTAR: '💣',
  INFILTRATION: '⚠',
  ALERT: '🔴',
};

export default function AlertsPanel() {
  const { data, loading } = useDataFeed<AlertData>('/api/alerts', 5000);
  const prevStatus = useRef<string>('CLEAR');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Enable audio context after first user interaction (browser requirement)
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Play sound when status changes to ACTIVE
  useEffect(() => {
    if (!data) return;

    if (data.status === 'ACTIVE' && prevStatus.current === 'CLEAR' && soundEnabled && hasInteracted) {
      // Play urgent sound for new alerts
      playAlertSound('urgent');

      // Also send browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification('IRONSIGHT ALERT', {
          body: `${data.activeCount} active alert(s) - ${data.alerts[0]?.type}: ${data.alerts[0]?.threat}`,
          icon: '/favicon.ico',
          tag: 'ironsight-alert',
        });
      }
    }

    prevStatus.current = data.status;
  }, [data, soundEnabled, hasInteracted]);

  // Request notification permission
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const isActive = data?.status === 'ACTIVE';

  return (
    <div
      className="panel h-full flex flex-col"
      style={isActive ? { borderColor: 'var(--red)', boxShadow: '0 0 20px rgba(255, 51, 102, 0.3)' } : {}}
    >
      <div className="panel-header">
        <span
          className="status-dot"
          style={{
            background: isActive ? 'var(--red)' : 'var(--green)',
            animation: isActive ? 'pulse-dot 0.5s ease-in-out infinite' : undefined,
          }}
        />
        ISRAEL ALERT STATUS
        <div className="ml-auto flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled && hasInteracted) {
                playAlertSound('ping'); // Preview sound when enabling
              }
            }}
            className="text-[9px] px-1.5 py-0.5 rounded border transition-colors"
            style={{
              color: soundEnabled ? 'var(--cyan)' : 'var(--text-secondary)',
              borderColor: soundEnabled ? 'var(--cyan)' : 'var(--border-color)',
              background: soundEnabled ? 'rgba(0,212,255,0.1)' : 'transparent',
            }}
            title={soundEnabled ? 'Sound alerts ON' : 'Sound alerts OFF'}
          >
            {soundEnabled ? '🔔' : '🔕'}
          </button>
          <span className="text-[9px] font-normal normal-case tracking-normal"
            style={{ color: isActive ? 'var(--red)' : 'var(--green)' }}
          >
            {isActive ? `${data?.activeCount} ACTIVE` : 'ALL CLEAR'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3">
            <div className="loading-shimmer h-20 rounded" />
          </div>
        ) : isActive ? (
          <>
            {/* Active alert banner */}
            <div className="px-3 py-2 bg-red-900/30 border-b border-red-800/50 alert-flash">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚨</span>
                <div>
                  <div className="text-xs font-bold text-[var(--red)]">
                    INCOMING THREAT DETECTED
                  </div>
                  <div className="text-[9px] text-[var(--text-secondary)]">
                    Pikud HaOref sirens activated
                  </div>
                </div>
              </div>
            </div>

            {data?.alerts.map((alert, i) => (
              <div key={i} className="data-row">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{TYPE_ICONS[alert.type] || '🔴'}</span>
                  <span className="text-[10px] font-bold text-[var(--red)]">
                    {alert.type}
                  </span>
                  <span className="text-[9px] text-[var(--text-secondary)]">
                    {new Date(alert.time).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-primary)]">
                  {alert.threat}
                </div>
                <div className="text-[9px] text-[var(--text-secondary)] mt-0.5">
                  {alert.locations.join(', ')}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="relative w-16 h-16 mb-3">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="var(--green)" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(0,255,136,0.1)" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-sm font-bold text-[var(--green)] mb-1">ALL CLEAR</div>
            <div className="text-[9px] text-[var(--text-secondary)] text-center">
              No active alerts from Pikud HaOref
            </div>
            <div className="text-[8px] text-[var(--text-secondary)] mt-2">
              Polling every 5s • Last: {data?.lastChecked ? new Date(data.lastChecked).toLocaleTimeString() : '...'}
            </div>
            <div className="text-[8px] mt-1" style={{ color: soundEnabled ? 'var(--cyan)' : 'var(--text-secondary)' }}>
              Sound: {soundEnabled ? 'ON' : 'OFF'} {!hasInteracted && soundEnabled ? '(click anywhere to enable)' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
