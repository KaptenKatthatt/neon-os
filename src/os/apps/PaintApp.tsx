import { useEffect, useRef, useState, type JSX, type PointerEvent as ReactPointerEvent } from 'react';
import type { AppHostProps } from './registry';

type Tool = 'pen' | 'eraser' | 'rect' | 'circle' | 'line';

const COLORS: ReadonlyArray<string> = [
  '#000000',
  '#ffffff',
  '#ef4444',
  '#f59e0b',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

export const PaintApp = (_props: AppHostProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState<string>('#22d3ee');
  const [size, setSize] = useState<number>(4);
  const [tool, setTool] = useState<Tool>('pen');
  const drawing = useRef<boolean>(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const snapshot = useRef<ImageData | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  const getPos = (e: ReactPointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    drawing.current = true;
    const p = getPos(e);
    start.current = p;
    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = size;
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    } else {
      snapshot.current = ctx.getImageData(0, 0, c.width, c.height);
    }
  };

  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    if (!drawing.current) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const p = getPos(e);
    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    } else if (start.current && snapshot.current) {
      ctx.putImageData(snapshot.current, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.beginPath();
      const s = start.current;
      if (tool === 'rect') {
        ctx.strokeRect(s.x, s.y, p.x - s.x, p.y - s.y);
      } else if (tool === 'circle') {
        const rx = Math.abs(p.x - s.x) / 2;
        const ry = Math.abs(p.y - s.y) / 2;
        const cx = (s.x + p.x) / 2;
        const cy = (s.y + p.y) / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }
  };

  const onUp = (): void => {
    drawing.current = false;
    start.current = null;
    snapshot.current = null;
  };

  const clear = (): void => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
  };

  const fillAll = (): void => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, c.width, c.height);
  };

  const exportPng = (): void => {
    const c = canvasRef.current;
    if (!c) return;
    const url = c.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `neon-paint-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="paint">
      <div className="toolbar" role="toolbar" aria-label="Paint tools">
        <div className="group">
          {(['pen', 'eraser', 'line', 'rect', 'circle'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={tool === t ? 'active' : ''}
              onClick={() => setTool(t)}
              title={t}
            >
              {t === 'pen' ? '?' : t === 'eraser' ? '?' : t === 'line' ? '/' : t === 'rect' ? '?' : '?'}
            </button>
          ))}
        </div>
        <div className="group">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Custom color"
          />
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{ background: c, borderColor: color === c ? 'var(--neon-accent)' : 'var(--neon-border)' }}
              title={c}
            />
          ))}
        </div>
        <div className="group">
          <label style={{ color: 'var(--neon-muted)' }}>Size</label>
          <input
            type="range"
            min={1}
            max={48}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
          <span style={{ width: 24, textAlign: 'right' }}>{size}</span>
        </div>
        <div className="group">
          <button type="button" onClick={clear} title="Clear">Clear</button>
          <button type="button" onClick={fillAll} title="Fill with current color">Fill</button>
          <button type="button" onClick={exportPng} title="Export PNG">Export</button>
        </div>
      </div>
      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={640}
          height={420}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        />
      </div>
    </div>
  );
};
