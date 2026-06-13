import { useEffect, useMemo, useState, type ChangeEvent, type JSX } from 'react';
import { useOsStore } from '../state/osStore';
import type { AppHostProps } from './registry';

export const NotepadApp = (_props: AppHostProps): JSX.Element => {
  const fs = useOsStore((s) => s.fs);
  const openApp = useOsStore((s) => s.openApp);
  const createFile = useOsStore((s) => s.createFile);
  const updateFileContent = useOsStore((s) => s.updateFileContent);

  const [fileId, setFileId] = useState<string>('welcome_text');
  const file = fs.nodes[fileId];

  useEffect(() => {
    if (!file || file.kind !== 'text') {
      const fallback = Object.values(fs.nodes).find((n) => n.kind === 'text');
      if (fallback) setFileId(fallback.id);
    }
  }, [file, fs.nodes]);

  const textFiles = useMemo(
    () => Object.values(fs.nodes).filter((n) => n.kind === 'text'),
    [fs.nodes],
  );

  const content = file?.content ?? '';
  const lineCount = content.length === 0 ? 1 : content.split('\n').length;
  const charCount = content.length;

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    updateFileContent(fileId, e.target.value);
  };

  const newFile = (): void => {
    const id = createFile(fs.rootId, `Untitled-${Date.now()}.txt`, 'text', 'notepad');
    setFileId(id);
    void id;
  };

  return (
    <div className="notepad">
      <div className="toolbar">
        <select
          value={fileId}
          onChange={(e) => setFileId(e.target.value)}
          aria-label="Open file"
        >
          {textFiles.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={newFile} title="New file">+ New</button>
        <button
          type="button"
          onClick={() => openApp('files')}
          title="Browse files"
        >
          Browse
        </button>
        <input value={file?.name ?? ''} readOnly aria-label="File name" />
      </div>
      <textarea
        value={content}
        onChange={onChange}
        spellCheck={false}
        placeholder="Start typing..."
        aria-label="Editor"
      />
      <div className="statusbar">
        <span>Saved</span>
        <span>
          Ln {lineCount} · {charCount} chars
        </span>
      </div>
    </div>
  );
};
