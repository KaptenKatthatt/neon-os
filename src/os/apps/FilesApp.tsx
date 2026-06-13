import { useMemo, useState, type JSX } from 'react';
import { useOsStore } from '../state/osStore';
import { Icon, type IconName } from '../components/Icon';
import type { AppHostProps } from './registry';
import type { FsNode, FileKind } from '../types';

const buildQuick = (
  rootId: string,
  docsId: string,
  picsId: string,
  projectsId: string,
): ReadonlyArray<{ id: string; label: string; iconName: IconName }> => [
  { id: rootId, label: 'NeonDrive', iconName: 'memory' },
  { id: docsId, label: 'Documents', iconName: 'folder' },
  { id: picsId, label: 'Pictures', iconName: 'file-image' },
  { id: projectsId, label: 'Projects', iconName: 'folder' },
];

const glyphFor = (node: FsNode): IconName => {
  if (node.kind === 'folder') return 'folder';
  if (node.kind === 'image') return 'file-image';
  if (node.kind === 'config') return 'file-config';
  if (node.kind === 'app') return 'file-app';
  return 'file-text';
};

const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

export const FilesApp = (_props: AppHostProps): JSX.Element => {
  const fs = useOsStore((s) => s.fs);
  const rootId = fs.rootId;
  const docsId = useMemo(() => Object.values(fs.nodes).find((n) => n.name === 'Documents')?.id ?? rootId, [fs.nodes, rootId]);
  const picsId = useMemo(() => Object.values(fs.nodes).find((n) => n.name === 'Pictures')?.id ?? rootId, [fs.nodes, rootId]);
  const projectsId = useMemo(() => Object.values(fs.nodes).find((n) => n.name === 'Projects')?.id ?? rootId, [fs.nodes, rootId]);
  const quick = buildQuick(rootId, docsId, picsId, projectsId);

  const openApp = useOsStore((s) => s.openApp);
  const createFile = useOsStore((s) => s.createFile);
  const createFolder = useOsStore((s) => s.createFolder);
  const deleteNode = useOsStore((s) => s.deleteNode);
  const renameNode = useOsStore((s) => s.renameNode);

  const [cwdId, setCwdId] = useState<string>(rootId);
  const cwd = fs.nodes[cwdId];
  const children: ReadonlyArray<FsNode> = (cwd?.children ?? [])
    .map((c): FsNode | null => fs.nodes[c] ?? null)
    .filter((n): n is FsNode => n !== null);

  const path = ((): string => {
    if (!cwd) return '/';
    const chain: string[] = [];
    let cur: string | null = cwd.id;
    while (cur) {
      const nodeCur: FsNode | undefined = fs.nodes[cur];
      if (!nodeCur) break;
      chain.unshift(nodeCur.name);
      cur = nodeCur.parentId;
    }
    if (chain[0] === fs.nodes[rootId]?.name) chain.shift();
    return '/' + chain.join('/');
  })();

  const onOpen = (n: FsNode): void => {
    if (n.kind === 'folder') {
      setCwdId(n.id);
    } else if (n.kind === 'text' || n.kind === 'config') {
      openApp('notepad');
    } else if (n.kind === 'image') {
      openApp('paint');
    } else if (n.kind === 'app') {
      if (n.appId) openApp(n.appId);
    }
  };

  const newTextFile = (): void => {
    if (!cwd) return;
    createFile(cwd.id, `Untitled-${Date.now()}.txt`, 'text', 'notepad');
  };

  const newFolder = (): void => {
    if (!cwd) return;
    createFolder(cwd.id, `New Folder ${Date.now()}`);
  };

  const goUp = (): void => {
    if (cwd && cwd.parentId) setCwdId(cwd.parentId);
  };

  return (
    <div className="files">
      <aside className="sidebar">
        <h4>Quick access</h4>
        {quick.map((q) => (
          <div
            key={q.id}
            className={`item${cwdId === q.id ? ' active' : ''}`}
            onClick={() => setCwdId(q.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setCwdId(q.id); }}
          >
            <Icon name={q.iconName} size={14} />
            <span>{q.label}</span>
          </div>
        ))}
        <h4 style={{ marginTop: 12 }}>Stats</h4>
        <div style={{ color: 'var(--neon-muted)', fontSize: 11, padding: '4px 6px' }}>
          {Object.keys(fs.nodes).length} items
        </div>
      </aside>
      <main className="main">
        <div className="toolbar">
          <button type="button" onClick={goUp} disabled={!cwd?.parentId} title="Up">
            <Icon name="arrow-up" size={12} /> Up
          </button>
          <button type="button" onClick={newTextFile}>
            <Icon name="plus" size={12} /> File
          </button>
          <button type="button" onClick={newFolder}>
            <Icon name="folder" size={12} /> Folder
          </button>
          <span className="path">{path}</span>
        </div>
        <div className="grid">
          {children.length === 0 && (
            <div style={{ color: 'var(--neon-muted)', fontSize: 12, padding: 12 }}>This folder is empty.</div>
          )}
          {children.map((n) => {
            const kind: FileKind = n.kind;
            return (
              <div
                key={n.id}
                className="item-card"
                onDoubleClick={() => onOpen(n)}
                onKeyDown={(e) => { if (e.key === 'Enter') onOpen(n); }}
                role="button"
                tabIndex={0}
              >
                <span className="glyph" aria-hidden>
                  <Icon name={glyphFor(n)} size={22} />
                </span>
                <div className="name" title={n.name}>{n.name}</div>
                <div className="meta">
                  {kind}
                  {n.kind !== 'folder' ? ` � ${formatBytes(n.size)}` : ''}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const name = window.prompt('Rename to:', n.name);
                      if (name && name.trim()) renameNode(n.id, name.trim());
                    }}
                    style={{ fontSize: 10, padding: '2px 6px' }}
                  >
                    Rename
                  </button>
                  {n.id !== rootId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${n.name}"?`)) {
                          if (cwdId === n.id) setCwdId(rootId);
                          deleteNode(n.id);
                        }
                      }}
                      style={{ fontSize: 10, padding: '2px 6px' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
