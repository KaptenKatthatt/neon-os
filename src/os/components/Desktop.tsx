import type { CSSProperties, JSX } from 'react';
import { useOsStore } from '../state/osStore';
import { findWallpaper } from '../styles/wallpapers';
import { Taskbar } from './Taskbar';
import { StartMenu } from './StartMenu';
import { WindowFrame } from './WindowFrame';
import { DesktopIcons } from './DesktopIcons';

export const Desktop = (): JSX.Element => {
  const windows = useOsStore((s) => s.windows);
  const wallpaperId = useOsStore((s) => s.wallpaper);
  const wp = findWallpaper(wallpaperId);
  const style: CSSProperties = {};
  // Inject the wallpaper's CSS into a style attribute by trimming newlines
  // (we keep the value escaped via React's text serialization).
  // Using a CSS variable avoids the dangerouslySetInnerHTML escape hatch.
  const wallpaperCss = wp.css.replace(/\s+/g, ' ').trim();
  style.background = wallpaperCss;
  return (
    <div className="desktop" style={style} role="application" aria-label="Neon OS Desktop">
      <DesktopIcons />
      {windows.map((w) => (
        <WindowFrame key={w.id} win={w} />
      ))}
      <StartMenu />
      <Taskbar />
    </div>
  );
};
