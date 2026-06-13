import type { JSX } from 'react';
import { useOsStore } from '../state/osStore';
import { APP_REGISTRY } from '../apps/registry';
import type { AppId } from '../types';

interface QuickApp {
  readonly id: AppId;
  readonly label: string;
}

const QUICK: ReadonlyArray<QuickApp> = [
  { id: 'files', label: 'Files' },
  { id: 'notepad', label: 'Notepad' },
  { id: 'paint', label: 'Paint' },
  { id: 'calculator', label: 'Calculator' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'browser', label: 'Browser' },
];

export const DesktopIcons = (): JSX.Element => {
  const openApp = useOsStore((s) => s.openApp);
  return (
    <div className="desktop-icons" role="grid" aria-label="Desktop icons">
      {QUICK.map((q) => {
        const def = APP_REGISTRY[q.id];
        return (
          <button
            key={q.id}
            type="button"
            role="gridcell"
            className="desktop-icon"
            onDoubleClick={() => openApp(q.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openApp(q.id);
              }
            }}
            title={`Open ${def.name}`}
          >
            <span className="glyph" aria-hidden>{def.icon}</span>
            <span className="label">{q.label}</span>
          </button>
        );
      })}
    </div>
  );
};
