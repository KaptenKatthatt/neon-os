import { useEffect, useRef, useState, type CSSProperties, type JSX, type PointerEvent as ReactPointerEvent } from 'react';
import type { AppWindow } from '../types';
import { useOsStore } from '../state/osStore';
import { APP_REGISTRY } from '../apps/registry';
import { Icon } from './Icon';

interface Props {
  readonly win: AppWindow;
}

interface DragState {
  readonly startX: number;
  readonly startY: number;
  readonly origX: number;
  readonly origY: number;
}

interface ResizeState {
  readonly startX: number;
  readonly startY: number;
  readonly origW: number;
  readonly origH: number;
}

export const WindowFrame = ({ win }: Props): JSX.Element | null => {
  const close = useOsStore((s) => s.closeWindow);
  const focus = useOsStore((s) => s.focusWindow);
  const toggleMax = useOsStore((s) => s.toggleMaximize);
  const move = useOsStore((s) => s.moveWindow);
  const resize = useOsStore((s) => s.resizeWindow);
  const minimize = useOsStore((s) => s.minimizeWindow);

  const [drag, setDrag] = useState<DragState | null>(null);
  const [rsz, setRsz] = useState<ResizeState | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  const App = APP_REGISTRY[win.appId]?.component;

  useEffect(() => {
    if (!drag) return;
    const onMove = (ev: PointerEvent): void => {
      const dx = ev.clientX - drag.startX;
      const dy = ev.clientY - drag.startY;
      move(win.id, { x: drag.origX + dx, y: Math.max(0, drag.origY + dy) });
    };
    const onUp = (): void => setDrag(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag, move, win.id]);

  useEffect(() => {
    if (!rsz) return;
    const onMove = (ev: PointerEvent): void => {
      const dx = ev.clientX - rsz.startX;
      const dy = ev.clientY - rsz.startY;
      resize(win.id, {
        width: Math.max(240, rsz.origW + dx),
        height: Math.max(160, rsz.origH + dy),
      });
    };
    const onUp = (): void => setRsz(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [rsz, resize, win.id]);

  if (win.minimized) return null;

  const style: CSSProperties = win.maximized
    ? { left: 0, top: 0, width: '100%', height: 'calc(100% - 52px)', zIndex: win.zIndex }
    : {
        left: win.position.x,
        top: win.position.y,
        width: win.size.width,
        height: win.size.height,
        zIndex: win.zIndex,
      };

  const def = APP_REGISTRY[win.appId];

  return (
    <div
      ref={ref}
      className={`window${win.maximized ? ' maximized' : ''}`}
      style={style}
      role="dialog"
      aria-label={win.title}
      onPointerDown={() => focus(win.id)}
    >
      <div
        className="window-titlebar"
        onPointerDown={(ev: ReactPointerEvent<HTMLDivElement>) => {
          if (win.maximized) return;
          (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
          setDrag({
            startX: ev.clientX,
            startY: ev.clientY,
            origX: win.position.x,
            origY: win.position.y,
          });
        }}
        onDoubleClick={() => toggleMax(win.id)}
      >
        <div className="title">
          <span className="icon" aria-hidden>
            <Icon name={def?.iconName ?? 'globe'} size={14} />
          </span>
          <span>{win.title}</span>
        </div>
        <div className="controls">
          <button
            type="button"
            aria-label="Minimize"
            title="Minimize"
            onClick={(e) => {
              e.stopPropagation();
              minimize(win.id);
            }}
          >
            <Icon name="minimize" size={12} />
          </button>
          <button
            type="button"
            aria-label={win.maximized ? 'Restore' : 'Maximize'}
            title={win.maximized ? 'Restore' : 'Maximize'}
            onClick={(e) => {
              e.stopPropagation();
              toggleMax(win.id);
            }}
          >
            <Icon name={win.maximized ? 'restore' : 'maximize'} size={12} />
          </button>
          <button
            type="button"
            className="close"
            aria-label="Close"
            title="Close"
            onClick={(e) => {
              e.stopPropagation();
              close(win.id);
            }}
          >
            <Icon name="close" size={12} />
          </button>
        </div>
      </div>
      <div className="window-body">{App ? <App windowId={win.id} /> : null}</div>
      {def?.resizable && !win.maximized ? (
        <div
          className="resize-handle"
          aria-hidden
          onPointerDown={(ev: ReactPointerEvent<HTMLDivElement>) => {
            (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
            setRsz({
              startX: ev.clientX,
              startY: ev.clientY,
              origW: win.size.width,
              origH: win.size.height,
            });
          }}
        />
      ) : null}
    </div>
  );
};
