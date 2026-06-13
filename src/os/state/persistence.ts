import type { AppWindow, FsState } from '../types';

const STORAGE_KEY = 'neon-os-state-v1';
const STORAGE_VERSION = 1;

export interface PersistedRoot {
  readonly version: number;
  readonly fs: FsState;
  readonly windows: ReadonlyArray<AppWindow>;
  readonly focusedWindowId: string | null;
  readonly nextZIndex: number;
  readonly nextWindowNumber: number;
  readonly wallpaper: string;
}

const isFsState = (v: unknown): v is FsState => {
  if (!v || typeof v !== 'object') return false;
  const fs = v as { rootId?: unknown; nodes?: unknown };
  if (typeof fs.rootId !== 'string') return false;
  if (!fs.nodes || typeof fs.nodes !== 'object') return false;
  return true;
};

const isAppWindow = (v: unknown): v is AppWindow => {
  if (!v || typeof v !== 'object') return false;
  const w = v as { id?: unknown; appId?: unknown; title?: unknown; position?: unknown; size?: unknown; zIndex?: unknown; minimized?: unknown; maximized?: unknown };
  if (typeof w.id !== 'string') return false;
  if (typeof w.appId !== 'string') return false;
  if (typeof w.title !== 'string') return false;
  if (typeof w.zIndex !== 'number') return false;
  if (typeof w.minimized !== 'boolean') return false;
  if (typeof w.maximized !== 'boolean') return false;
  if (!w.position || typeof w.position !== 'object') return false;
  if (!w.size || typeof w.size !== 'object') return false;
  const p = w.position as { x?: unknown; y?: unknown };
  const s = w.size as { width?: unknown; height?: unknown };
  if (typeof p.x !== 'number' || typeof p.y !== 'number') return false;
  if (typeof s.width !== 'number' || typeof s.height !== 'number') return false;
  return true;
};

const isString = (v: unknown): v is string => typeof v === 'string';

export const loadPersisted = (): PersistedRoot | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const p = parsed as Partial<PersistedRoot> & { version?: unknown };
    if (p.version !== STORAGE_VERSION) return null;
    if (!isFsState(p.fs)) return null;
    if (!Array.isArray(p.windows)) return null;
    const windows: AppWindow[] = [];
    for (const w of p.windows) {
      if (isAppWindow(w)) windows.push(w);
    }
    const wallpaper: string = isString(p.wallpaper) ? p.wallpaper : 'aurora';
    return {
      version: STORAGE_VERSION,
      fs: p.fs,
      windows,
      focusedWindowId: isString(p.focusedWindowId) ? p.focusedWindowId : null,
      nextZIndex: typeof p.nextZIndex === 'number' ? p.nextZIndex : 10,
      nextWindowNumber: typeof p.nextWindowNumber === 'number' ? p.nextWindowNumber : 1,
      wallpaper,
    };
  } catch {
    return null;
  }
};

export const savePersisted = (root: PersistedRoot): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
  } catch {
    // Quota exceeded or storage disabled - silently ignore.
  }
};
