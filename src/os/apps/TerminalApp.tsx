import { useEffect, useMemo, useRef, useState, type ChangeEvent, type JSX, type KeyboardEvent } from 'react';
import { useOsStore } from '../state/osStore';
import type { AppHostProps } from './registry';
import type { FsNode, AppId } from '../types';

interface Line {
  readonly id: number;
  readonly kind: 'out' | 'in' | 'err' | 'info';
  readonly text: string;
}

const HELP = [
  'Neon OS Terminal — built-in commands:',
  '  help                  Show this help',
  '  about                 About Neon OS',
  '  clear                 Clear the screen',
  '  date                  Show current date/time',
  '  echo <text>           Print text',
  '  ls [path]             List files (default: .)',
  '  cd <path>             Change directory (.. to go up)',
  '  pwd                   Print current directory',
  '  cat <name>            Print contents of a text file',
  '  write <name> <text>   Create a text file in current dir',
  '  mkdir <name>          Create a folder',
  '  rm <name>             Delete a file or folder',
  '  open <app>            Open an app (notepad|paint|calc|files|browser|terminal|about)',
].join('\n');

const BUILTINS = new Set<string>([
  'help', 'about', 'clear', 'date', 'echo', 'ls', 'cd', 'pwd', 'cat', 'write', 'mkdir', 'rm', 'open',
]);

const findNodeByPath = (
  nodes: Readonly<Record<string, FsNode>>,
  rootId: string,
  cwdId: string,
  rawPath: string,
): FsNode | null => {
  const parts = rawPath.split('/').filter((p) => p.length > 0);
  let id: string = cwdId;
  if (rawPath.startsWith('/')) id = rootId;
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      const n = nodes[id];
      if (!n || !n.parentId) return null;
      id = n.parentId;
      continue;
    }
    const n = nodes[id];
    if (!n || n.kind !== 'folder') return null;
    let found: FsNode | undefined;
    for (const c of n.children ?? []) {
      const child = nodes[c];
      if (child && child.name === part) {
        found = child;
        break;
      }
    }
    if (!found) return null;
    id = found.id;
  }
  return nodes[id] ?? null;
};

const resolveToCwd = (
  nodes: Readonly<Record<string, FsNode>>,
  rootId: string,
  cwdId: string,
  rawPath: string,
): string | null => {
  const node = findNodeByPath(nodes, rootId, cwdId, rawPath);
  if (!node) return null;
  if (node.kind !== 'folder') return null;
  return node.id;
};

const buildPath = (
  nodes: Readonly<Record<string, FsNode>>,
  rootId: string,
  cwdId: string,
): string => {
  const chain: string[] = [];
  let cur: string | null = cwdId;
  while (cur) {
    const nodeCur: FsNode | undefined = nodes[cur];
    if (!nodeCur) break;
    chain.unshift(nodeCur.name);
    cur = nodeCur.parentId;
  }
  if (chain.length === 0) return '/';
  if (chain[0] === nodes[rootId]?.name) chain.shift();
  return '/' + chain.join('/');
};

export const TerminalApp = (_props: AppHostProps): JSX.Element => {
  const fs = useOsStore((s) => s.fs);
  const rootId = fs.rootId;
  const createFile = useOsStore((s) => s.createFile);
  const createFolder = useOsStore((s) => s.createFolder);
  const deleteNode = useOsStore((s) => s.deleteNode);
  const updateFileContent = useOsStore((s) => s.updateFileContent);
  const openApp = useOsStore((s) => s.openApp);

  const [cwdId, setCwdId] = useState<string>(rootId);
  const [lines, setLines] = useState<ReadonlyArray<Line>>(() => [
    { id: 0, kind: 'info', text: 'Neon OS Terminal — type `help` for commands.' },
  ]);
  const [input, setInput] = useState<string>('');
  const idRef = useRef<number>(1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const outRef = useRef<HTMLDivElement | null>(null);
  const [history, setHistory] = useState<ReadonlyArray<string>>([]);
  const [histIdx, setHistIdx] = useState<number>(-1);

  const cwd = fs.nodes[cwdId];
  const prompt = useMemo<string>(() => {
    const path = buildPath(fs.nodes, rootId, cwdId);
    return `neon@os:${path}$`;
  }, [fs.nodes, rootId, cwdId]);

  useEffect(() => {
    if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
  }, [lines]);

  const push = (kind: Line['kind'], text: string): void => {
    setLines((prev) => [...prev, { id: idRef.current++, kind, text }]);
  };

  const runLine = (raw: string): void => {
    const text = raw.trim();
    push('in', `${prompt} ${text}`);
    if (text.length === 0) return;
    const [cmd, ...args] = text.split(/\s+/);
    const command = cmd ?? '';
    const rest = text.slice(command.length).trim();
    switch (command) {
      case 'help':
        push('out', HELP);
        break;
      case 'about':
        push('out', 'Neon OS — a tiny in-browser desktop by Codex.');
        break;
      case 'clear':
        setLines([]);
        break;
      case 'date':
        push('out', new Date().toString());
        break;
      case 'echo':
        push('out', rest);
        break;
      case 'pwd':
        push('out', buildPath(fs.nodes, rootId, cwdId));
        break;
      case 'ls': {
        const arg = args[0] ?? '.';
        const target = arg === '.' ? cwd : findNodeByPath(fs.nodes, rootId, cwdId, arg);
        if (!target) {
          push('err', `ls: no such path: ${arg}`);
        } else if (target.kind !== 'folder') {
          push('err', `ls: not a directory: ${arg}`);
        } else {
          const list: string[] = [];
          for (const c of target.children ?? []) {
            const n = fs.nodes[c];
            if (n) list.push(n.kind === 'folder' ? `${n.name}/` : n.name);
          }
          if (list.length === 0) push('out', '(empty)');
          else list.forEach((n) => push('out', n));
        }
        break;
      }
      case 'cd': {
        const arg = args[0] ?? '/';
        const next = resolveToCwd(fs.nodes, rootId, cwdId, arg);
        if (!next) push('err', `cd: no such directory: ${arg}`);
        else setCwdId(next);
        break;
      }
      case 'cat': {
        if (args.length === 0) {
          push('err', 'cat: missing filename');
        } else {
          const arg = args[0] ?? '';
          const target = findNodeByPath(fs.nodes, rootId, cwdId, arg);
          if (!target) push('err', `cat: no such file: ${arg}`);
          else if (target.kind !== 'text' && target.kind !== 'config') push('err', `cat: not a text file: ${arg}`);
          else push('out', target.content ?? '');
        }
        break;
      }
      case 'write': {
        if (args.length < 2) {
          push('err', 'usage: write <name> <text>');
          break;
        }
        if (!cwd) break;
        const name = args[0] ?? 'file.txt';
        const body = args.slice(1).join(' ');
        const id = createFile(cwd.id, name, 'text', 'notepad');
        updateFileContent(id, body);
        push('out', `created ${name}`);
        break;
      }
      case 'mkdir': {
        if (args.length === 0) {
          push('err', 'usage: mkdir <name>');
          break;
        }
        if (!cwd) break;
        createFolder(cwd.id, args[0] ?? 'New Folder');
        push('out', `created ${args[0]}/`);
        break;
      }
      case 'rm': {
        if (args.length === 0) {
          push('err', 'usage: rm <name>');
          break;
        }
        const arg = args[0] ?? '';
        const target = findNodeByPath(fs.nodes, rootId, cwdId, arg);
        if (!target) push('err', `rm: no such file: ${arg}`);
        else if (target.id === rootId) push('err', 'rm: cannot remove root');
        else {
          deleteNode(target.id);
          push('out', `removed ${target.name}`);
          if (cwdId === target.id) setCwdId(rootId);
        }
        break;
      }
      case 'open': {
        const app = args[0] ?? '';
        const allowed: ReadonlyArray<AppId> = ['notepad', 'paint', 'calculator', 'files', 'browser', 'terminal', 'about'];
        if (!allowed.includes(app as AppId)) {
          push('err', `open: unknown app: ${app}`);
        } else {
          openApp(app as AppId);
          push('out', `opening ${app}...`);
        }
        break;
      }
      default:
        if (BUILTINS.has(command)) {
          push('err', `${command}: not implemented in this build`);
        } else {
          push('err', `${command}: command not found. Try 'help'.`);
        }
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      const v = input;
      setInput('');
      setHistory((h) => [...h, v]);
      setHistIdx(-1);
      runLine(v);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const next = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(next);
      setInput(history[next] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < 0) return;
      const next = histIdx + 1;
      if (next >= history.length) {
        setHistIdx(-1);
        setInput('');
      } else {
        setHistIdx(next);
        setInput(history[next] ?? '');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>): void => setInput(e.target.value);

  return (
    <div className="terminal" onClick={() => inputRef.current?.focus()}>
      <div className="output" ref={outRef} aria-live="polite">
        {lines.map((l) => (
          <div key={l.id} className={`line ${l.kind}`}>{l.text}</div>
        ))}
      </div>
      <div className="input-row">
        <span className="prompt">{prompt}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={onChange}
          onKeyDown={onKey}
          autoFocus
          spellCheck={false}
          aria-label="Terminal input"
        />
      </div>
    </div>
  );
};
