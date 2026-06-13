import { useEffect, useState, type JSX } from 'react';
import { useOsStore } from '../state/osStore';
import { APP_REGISTRY } from '../apps/registry';
import { Icon } from './Icon';

const formatTime = (d: Date): string =>
  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

const formatDate = (d: Date): string =>
  d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

const useOnline = (): boolean => {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  useEffect(() => {
    const goOnline = (): void => setOnline(true);
    const goOffline = (): void => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  return online;
};

const useBattery = (): { level: number | null; charging: boolean | null } => {
  const [state, setState] = useState<{ level: number | null; charging: boolean | null }>({
    level: null,
    charging: null,
  });
  useEffect(() => {
    let cancelled = false;
    type BatteryAPI = {
      level: number;
      charging: boolean;
      addEventListener: (t: string, l: () => void) => void;
      removeEventListener: (t: string, l: () => void) => void;
    };
    type NavWithBattery = Navigator & { getBattery?: () => Promise<BatteryAPI> };
    const nav = navigator as NavWithBattery;
    if (typeof nav.getBattery !== 'function') {
      return (): void => {
        cancelled = true;
      };
    }
    nav
      .getBattery()
      .then((b) => {
        if (cancelled) return;
        const update = (): void =>
          setState({ level: Math.round(b.level * 100), charging: b.charging });
        update();
        b.addEventListener('levelchange', update);
        b.addEventListener('chargingchange', update);
      })
      .catch(() => undefined);
    return (): void => {
      cancelled = true;
    };
  }, []);
  return state;
};

export const Taskbar = (): JSX.Element => {
  const windows = useOsStore((s) => s.windows);
  const focusedId = useOsStore((s) => s.focusedWindowId);
  const startOpen = useOsStore((s) => s.startMenuOpen);
  const toggle = useOsStore((s) => s.toggleStartMenu);
  const focusWindow = useOsStore((s) => s.focusWindow);
  const minimizeWindow = useOsStore((s) => s.minimizeWindow);
  const setStartMenu = useOsStore((s) => s.setStartMenu);
  const openApp = useOsStore((s) => s.openApp);

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!startOpen) return;
    const onDoc = (ev: MouseEvent): void => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('.start-menu') || target.closest('.start-button')) return;
      setStartMenu(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [startOpen, setStartMenu]);

  const online = useOnline();
  const battery = useBattery();

  return (
    <div className="taskbar" role="toolbar" aria-label="Taskbar">
      <button
        type="button"
        className={`start-button${startOpen ? ' active' : ''}`}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={startOpen}
        title="Start"
      >
        <Icon name="start" size={16} title="" />
        <span>Start</span>
      </button>

      <div className="taskbar-windows" role="list">
        {windows.map((w) => {
          const def = APP_REGISTRY[w.appId];
          return (
            <button
              key={w.id}
              type="button"
              role="listitem"
              className={`taskbar-item${focusedId === w.id ? ' focused' : ''}`}
              title={w.title}
              onClick={() => {
                if (focusedId === w.id && !w.minimized) {
                  minimizeWindow(w.id);
                } else {
                  focusWindow(w.id);
                }
              }}
            >
              <Icon name={def?.iconName ?? 'globe'} size={14} />
              <span>{w.title}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="taskbar-tray"
        onClick={() => openApp('settings')}
        title="Open settings"
        aria-label="Open settings"
      >
        <Icon name={online ? 'tray-online' : 'tray-offline'} size={12} />
        <span className="label" style={{ marginRight: 6 }}>{online ? 'Online' : 'Offline'}</span>
        {battery.level !== null && (
          <span className="label" style={{ marginLeft: 6 }}>
            <Icon name="battery" size={12} /> {battery.level}%{battery.charging ? ' ?' : ''}
          </span>
        )}
      </button>

      <div className="taskbar-clock" aria-live="polite">
        <div className="time">{formatTime(now)}</div>
        <div className="date">{formatDate(now)}</div>
      </div>
    </div>
  );
};
