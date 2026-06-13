import { useMemo, useState, type JSX } from 'react';
import { useOsStore } from '../state/osStore';
import { WALLPAPERS, findWallpaper } from '../styles/wallpapers';
import type { AppHostProps } from './registry';

export const SettingsApp = (_props: AppHostProps): JSX.Element => {
  const wallpaper = useOsStore((s) => s.wallpaper);
  const setWallpaper = useOsStore((s) => s.setWallpaper);
  const resetFs = useOsStore((s) => s.resetFs);
  const fs = useOsStore((s) => s.fs);
  const [confirming, setConfirming] = useState<boolean>(false);

  const current = useMemo(() => findWallpaper(wallpaper), [wallpaper]);
  const fileCount = useMemo(() => Object.keys(fs.nodes).length, [fs.nodes]);

  return (
    <div className="settings" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>Wallpaper</h2>
        <p style={{ margin: 0, color: 'var(--neon-muted)', fontSize: 12 }}>
          Pick a background for your Neon OS desktop. Your choice is saved automatically.
        </p>
      </div>

      <div
        style={{
          width: '100%',
          height: 120,
          borderRadius: 12,
          border: '1px solid var(--neon-border)',
          background: current.css.replace(/\s+/g, ' ').trim(),
        }}
        aria-label="Current wallpaper preview"
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
        }}
      >
        {WALLPAPERS.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setWallpaper(w.id)}
            style={{
              cursor: 'pointer',
              padding: 0,
              border: w.id === wallpaper
                ? '2px solid var(--neon-accent)'
                : '1px solid var(--neon-border)',
              borderRadius: 10,
              overflow: 'hidden',
              background: 'transparent',
            }}
            aria-label={`Wallpaper ${w.label}`}
            aria-pressed={w.id === wallpaper}
          >
            <div
              style={{
                width: '100%',
                height: 70,
                background: w.preview,
              }}
            />
            <div
              style={{
                padding: '6px 8px',
                fontSize: 12,
                color: 'var(--neon-text)',
                background: 'rgba(0,0,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{w.label}</span>
              {w.id === wallpaper && <span style={{ color: 'var(--neon-accent)' }}>?</span>}
            </div>
          </button>
        ))}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--neon-border)' }} />

      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>System</h2>
        <p style={{ margin: 0, color: 'var(--neon-muted)', fontSize: 12 }}>
          File system holds {fileCount} items. Reset clears all open windows and restores the default files.
        </p>
      </div>

      <div>
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              background: 'rgba(248, 113, 113, 0.15)',
              border: '1px solid rgba(248, 113, 113, 0.4)',
              color: 'var(--neon-red)',
              fontSize: 12,
            }}
          >
            Reset Neon OS state...
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--neon-muted)' }}>Are you sure?</span>
            <button
              type="button"
              onClick={() => {
                resetFs();
                setConfirming(false);
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(248, 113, 113, 0.4)',
                border: '1px solid rgba(248, 113, 113, 0.6)',
                color: 'white',
                fontSize: 12,
              }}
            >
              Yes, reset
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--neon-border)',
                color: 'var(--neon-text)',
                fontSize: 12,
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
