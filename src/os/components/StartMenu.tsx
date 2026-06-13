import { useMemo, useState, type JSX } from 'react';
import { useOsStore } from '../state/osStore';
import { APP_REGISTRY } from '../apps/registry';
import type { AppId } from '../types';

export const StartMenu = (): JSX.Element | null => {
  const open = useOsStore((s) => s.startMenuOpen);
  const openApp = useOsStore((s) => s.openApp);
  const setStartMenu = useOsStore((s) => s.setStartMenu);
  const [query, setQuery] = useState<string>('');

  const tiles = useMemo<ReadonlyArray<{ id: AppId; name: string; icon: string }>>(() => {
    const all = Object.values(APP_REGISTRY).map((a) => ({ id: a.id, name: a.name, icon: a.icon }));
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter((a) => a.name.toLowerCase().includes(q));
  }, [query]);

  if (!open) return null;

  return (
    <div className="start-menu" role="menu" aria-label="Start menu">
      <input
        className="search"
        placeholder="Search apps..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      <div className="section-label">Apps</div>
      <div className="apps">
        {tiles.map((t) => (
          <button
            key={t.id}
            type="button"
            className="app-tile"
            role="menuitem"
            onClick={() => {
              openApp(t.id);
              setStartMenu(false);
            }}
          >
            <span className="glyph" aria-hidden>{t.icon}</span>
            <span>{t.name}</span>
          </button>
        ))}
        {tiles.length === 0 && (
          <div style={{ gridColumn: '1 / -1', color: 'var(--neon-muted)', fontSize: 12, padding: 6 }}>
            No matches
          </div>
        )}
      </div>
      <div className="footer">
        <button
          type="button"
          onClick={() => {
            openApp('settings');
            setStartMenu(false);
          }}
        >
          Settings
        </button>
        <button
          type="button"
          onClick={() => {
            openApp('about');
            setStartMenu(false);
          }}
        >
          About
        </button>
      </div>
    </div>
  );
};
