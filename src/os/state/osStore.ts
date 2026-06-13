import { create } from 'zustand';
import type {
  AppId,
  AppWindow,
  FileKind,
  FsNode,
  FsState,
  WindowPosition,
  WindowSize,
} from '../types';
import { loadPersisted, savePersisted, type PersistedRoot } from './persistence';

interface OpenOptions {
  readonly position?: WindowPosition;
  readonly size?: WindowSize;
  readonly title?: string;
}

interface OsState {
  readonly windows: ReadonlyArray<AppWindow>;
  readonly focusedWindowId: string | null;
  readonly startMenuOpen: boolean;
  readonly fs: FsState;
  readonly nextZIndex: number;
  readonly nextWindowNumber: number;
  readonly wallpaper: string;
}

interface OsActions {
  openApp: (appId: AppId, options?: OpenOptions) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  moveWindow: (id: string, position: WindowPosition) => void;
  resizeWindow: (id: string, size: WindowSize) => void;
  setStartMenu: (open: boolean) => void;
  toggleStartMenu: () => void;
  createFile: (parentId: string, name: string, kind: FileKind, appId?: AppId) => string;
  createFolder: (parentId: string, name: string) => string;
  deleteNode: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  renameNode: (id: string, name: string) => void;
  setWallpaper: (id: string) => void;
  resetFs: () => void;
}

export type OsStore = OsState & OsActions;

const newId = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const makeInitialFs = (): FsState => {
  const now = Date.now();
  const rootId = 'root';
  const documentsId = 'doc_folder';
  const picturesId = 'pic_folder';
  const projectsId = 'prj_folder';
  const welcomeId = 'welcome_text';
  const readmeId = 'readme_text';
  const paletteId = 'palette_config';
  const notesId = 'notes_text';
  const logoId = 'logo_image';

  const root: FsNode = {
    id: rootId,
    name: 'NeonDrive',
    kind: 'folder',
    parentId: null,
    children: [documentsId, picturesId, projectsId, welcomeId, readmeId, paletteId, notesId, logoId],
    createdAt: now,
    updatedAt: now,
    size: 0,
  };

  const documents: FsNode = {
    id: documentsId,
    name: 'Documents',
    kind: 'folder',
    parentId: rootId,
    children: [],
    createdAt: now,
    updatedAt: now,
    size: 0,
  };

  const pictures: FsNode = {
    id: picturesId,
    name: 'Pictures',
    kind: 'folder',
    parentId: rootId,
    children: [logoId],
    createdAt: now,
    updatedAt: now,
    size: 0,
  };

  const projects: FsNode = {
    id: projectsId,
    name: 'Projects',
    kind: 'folder',
    parentId: rootId,
    children: [],
    createdAt: now,
    updatedAt: now,
    size: 0,
  };

  const welcome: FsNode = {
    id: welcomeId,
    name: 'Welcome.txt',
    kind: 'text',
    parentId: rootId,
    createdAt: now,
    updatedAt: now,
    size: 0,
    content:
      'Welcome to Neon OS!\r\n\r\nThis is a fully in-browser desktop environment.\r\nTry the Start menu, open Notepad, Paint, Calculator, Files, the Browser, the Terminal, Settings, or the System Monitor.\r\n\r\nUse the Terminal `help` command for guidance. Your files and windows are auto-saved.',
    appId: 'notepad',
  };

  const readme: FsNode = {
    id: readmeId,
    name: 'README.md',
    kind: 'text',
    parentId: rootId,
    createdAt: now,
    updatedAt: now,
    size: 0,
    content:
      '# Neon OS\r\n\r\nA tiny desktop environment built with React, TypeScript, and Vite.\r\nNo backend — everything runs in your browser, and state persists via localStorage.',
    appId: 'notepad',
  };

  const palette: FsNode = {
    id: paletteId,
    name: 'palette.cfg',
    kind: 'config',
    parentId: rootId,
    createdAt: now,
    updatedAt: now,
    size: 0,
    content: 'theme=neon\r\naccent=#22d3ee\r\nbackground=#0b1020\r\n',
  };

  const notes: FsNode = {
    id: notesId,
    name: 'Quick Notes.txt',
    kind: 'text',
    parentId: rootId,
    createdAt: now,
    updatedAt: now,
    size: 0,
    content: 'Shopping list:\r\n- Coffee\r\n- LEDs\r\n- More neon',
    appId: 'notepad',
  };

  const logo: FsNode = {
    id: logoId,
    name: 'logo.png',
    kind: 'image',
    parentId: picturesId,
    createdAt: now,
    updatedAt: now,
    size: 4096,
    appId: 'paint',
  };

  return {
    rootId,
    nodes: {
      [rootId]: root,
      [documentsId]: documents,
      [picturesId]: pictures,
      [projectsId]: projects,
      [welcomeId]: welcome,
      [readmeId]: readme,
      [paletteId]: palette,
      [notesId]: notes,
      [logoId]: logo,
    },
  };
};

const computeSize = (content: string | undefined): number =>
  typeof content === 'string' ? content.length : 0;

const buildFsNode = (
  id: string,
  name: string,
  kind: FileKind,
  parentId: string,
  appId: AppId | undefined,
  now: number,
): FsNode => {
  const base = {
    id,
    name,
    kind,
    parentId,
    createdAt: now,
    updatedAt: now,
    size: 0,
  } as const;
  if (kind === 'folder') {
    return appId !== undefined
      ? { ...base, kind, children: [], appId }
      : { ...base, kind, children: [] };
  }
  const textLike = kind === 'text' || kind === 'config';
  if (textLike && appId !== undefined) {
    return { ...base, kind, content: '', appId };
  }
  if (textLike) {
    return { ...base, kind, content: '' };
  }
  if (appId !== undefined) {
    return { ...base, kind, appId };
  }
  return { ...base, kind };
};

const persist = (state: OsState): void => {
  const root: PersistedRoot = {
    version: 1,
    fs: state.fs,
    windows: state.windows,
    focusedWindowId: state.focusedWindowId,
    nextZIndex: state.nextZIndex,
    nextWindowNumber: state.nextWindowNumber,
    wallpaper: state.wallpaper,
  };
  savePersisted(root);
};

const initialState: OsState = ((): OsState => {
  const persisted = loadPersisted();
  if (persisted) {
    return {
      windows: persisted.windows,
      focusedWindowId: persisted.focusedWindowId,
      startMenuOpen: false,
      fs: persisted.fs,
      nextZIndex: persisted.nextZIndex,
      nextWindowNumber: persisted.nextWindowNumber,
      wallpaper: persisted.wallpaper,
    };
  }
  return {
    windows: [],
    focusedWindowId: null,
    startMenuOpen: false,
    fs: makeInitialFs(),
    nextZIndex: 10,
    nextWindowNumber: 1,
    wallpaper: 'aurora',
  };
})();

export const useOsStore = create<OsStore>((set, get) => ({
  ...initialState,

  openApp: (appId, options) => {
    const id = `win_${appId}_${get().nextWindowNumber}`;
    const num = get().nextWindowNumber + 1;
    const z = get().nextZIndex + 1;
    const def = getAppDefinition(appId);
    const existing = get().windows.find(
      (w) => w.appId === appId && w.title === (options?.title ?? def.name),
    );
    if (existing) {
      set((s) => ({
        windows: s.windows.map((w) =>
          w.id === existing.id
            ? { ...w, minimized: false, zIndex: s.nextZIndex + 1 }
            : w,
        ),
        focusedWindowId: existing.id,
        nextZIndex: s.nextZIndex + 1,
        startMenuOpen: false,
      }));
      persist(get());
      return existing.id;
    }
    const position: WindowPosition = options?.position ?? {
      x: 80 + ((get().nextWindowNumber * 24) % 200),
      y: 60 + ((get().nextWindowNumber * 24) % 160),
    };
    const size: WindowSize = options?.size ?? def.defaultSize;
    const win: AppWindow = {
      id,
      appId,
      title: options?.title ?? def.name,
      position,
      size,
      zIndex: z,
      minimized: false,
      maximized: false,
    };
    set((s) => ({
      windows: [...s.windows, win],
      focusedWindowId: id,
      nextZIndex: z,
      nextWindowNumber: num,
      startMenuOpen: false,
    }));
    persist(get());
    return id;
  },

  closeWindow: (id) => {
    set((s) => {
      const remaining = s.windows.filter((w) => w.id !== id);
      const last = remaining[remaining.length - 1];
      return {
        windows: remaining,
        focusedWindowId: s.focusedWindowId === id ? (last?.id ?? null) : s.focusedWindowId,
      };
    });
    persist(get());
  },

  focusWindow: (id) => {
    const z = get().nextZIndex + 1;
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, zIndex: z, minimized: false } : w)),
      focusedWindowId: id,
      nextZIndex: z,
    }));
    persist(get());
  },

  minimizeWindow: (id) => {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
      focusedWindowId: s.focusedWindowId === id ? null : s.focusedWindowId,
    }));
    persist(get());
  },

  toggleMaximize: (id) => {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)),
      focusedWindowId: id,
    }));
    persist(get());
  },

  moveWindow: (id, position) => {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, position } : w)),
    }));
    persist(get());
  },

  resizeWindow: (id, size) => {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, size } : w)),
    }));
    persist(get());
  },

  setStartMenu: (open) => set({ startMenuOpen: open }),
  toggleStartMenu: () => set((s) => ({ startMenuOpen: !s.startMenuOpen })),

  createFile: (parentId, name, kind, appId) => {
    const id = newId(kind);
    const now = Date.now();
    const node = buildFsNode(id, name, kind, parentId, appId, now);
    set((s) => {
      const parent = s.fs.nodes[parentId];
      if (!parent || parent.kind !== 'folder') return s;
      const updatedParent: FsNode = {
        ...parent,
        children: [...(parent.children ?? []), id],
        updatedAt: now,
      };
      return {
        fs: {
          ...s.fs,
          nodes: { ...s.fs.nodes, [id]: node, [parentId]: updatedParent },
        },
      };
    });
    persist(get());
    return id;
  },

  createFolder: (parentId, name) => {
    const id = newId('folder');
    const now = Date.now();
    const node: FsNode = {
      id,
      name,
      kind: 'folder',
      parentId,
      children: [],
      createdAt: now,
      updatedAt: now,
      size: 0,
    };
    set((s) => {
      const parent = s.fs.nodes[parentId];
      if (!parent || parent.kind !== 'folder') return s;
      const updatedParent: FsNode = {
        ...parent,
        children: [...(parent.children ?? []), id],
        updatedAt: now,
      };
      return {
        fs: {
          ...s.fs,
          nodes: { ...s.fs.nodes, [id]: node, [parentId]: updatedParent },
        },
      };
    });
    persist(get());
    return id;
  },

  deleteNode: (id) => {
    set((s) => {
      if (id === s.fs.rootId) return s;
      const target = s.fs.nodes[id];
      if (!target) return s;
      const toDelete = new Set<string>();
      const collect = (n: FsNode): void => {
        toDelete.add(n.id);
        if (n.kind === 'folder') {
          for (const childId of n.children ?? []) {
            const c = s.fs.nodes[childId];
            if (c) collect(c);
          }
        }
      };
      collect(target);
      const nextNodes: Record<string, FsNode> = {};
      for (const [k, v] of Object.entries(s.fs.nodes)) {
        if (!toDelete.has(k)) nextNodes[k] = v;
      }
      const parent = target.parentId ? nextNodes[target.parentId] : undefined;
      if (parent && parent.kind === 'folder') {
        nextNodes[parent.id] = {
          ...parent,
          children: (parent.children ?? []).filter((c) => !toDelete.has(c)),
          updatedAt: Date.now(),
        };
      }
      return { fs: { ...s.fs, nodes: nextNodes } };
    });
    persist(get());
  },

  updateFileContent: (id, content) => {
    set((s) => {
      const node = s.fs.nodes[id];
      if (!node) return s;
      const updated: FsNode = {
        ...node,
        content,
        size: computeSize(content),
        updatedAt: Date.now(),
      };
      return { fs: { ...s.fs, nodes: { ...s.fs.nodes, [id]: updated } } };
    });
    persist(get());
  },

  renameNode: (id, name) => {
    set((s) => {
      const node = s.fs.nodes[id];
      if (!node) return s;
      const updated: FsNode = { ...node, name, updatedAt: Date.now() };
      return { fs: { ...s.fs, nodes: { ...s.fs.nodes, [id]: updated } } };
    });
    persist(get());
  },

  setWallpaper: (id) => {
    set({ wallpaper: id });
    persist(get());
  },

  resetFs: () => {
    set({
      windows: [],
      focusedWindowId: null,
      startMenuOpen: false,
      fs: makeInitialFs(),
      nextZIndex: 10,
      nextWindowNumber: 1,
    });
    persist(get());
  },
}));

export const getAppDefinition = (id: AppId): {
  name: string;
  defaultSize: WindowSize;
  resizable: boolean;
} => {
  switch (id) {
    case 'notepad':
      return { name: 'Notepad', defaultSize: { width: 520, height: 380 }, resizable: true };
    case 'paint':
      return { name: 'Paint', defaultSize: { width: 720, height: 520 }, resizable: true };
    case 'calculator':
      return { name: 'Calculator', defaultSize: { width: 280, height: 380 }, resizable: false };
    case 'terminal':
      return { name: 'Terminal', defaultSize: { width: 640, height: 400 }, resizable: true };
    case 'files':
      return { name: 'Files', defaultSize: { width: 640, height: 420 }, resizable: true };
    case 'browser':
      return { name: 'Neon Browser', defaultSize: { width: 820, height: 560 }, resizable: true };
    case 'about':
      return { name: 'About Neon OS', defaultSize: { width: 360, height: 260 }, resizable: false };
    case 'settings':
      return { name: 'Settings', defaultSize: { width: 460, height: 480 }, resizable: false };
    case 'sysmon':
      return { name: 'System Monitor', defaultSize: { width: 520, height: 600 }, resizable: true };
  }
};
