import type { CSSProperties, JSX } from 'react';

export type IconName =
  | 'notepad'
  | 'paint'
  | 'calculator'
  | 'terminal'
  | 'files'
  | 'browser'
  | 'about'
  | 'settings'
  | 'sysmon'
  | 'start'
  | 'tray-online'
  | 'tray-offline'
  | 'battery'
  | 'chevron-left'
  | 'chevron-right'
  | 'refresh'
  | 'minimize'
  | 'maximize'
  | 'restore'
  | 'close'
  | 'trash'
  | 'rename'
  | 'folder'
  | 'file-text'
  | 'file-image'
  | 'file-config'
  | 'file-app'
  | 'play'
  | 'grid'
  | 'globe'
  | 'chart'
  | 'cpu'
  | 'memory'
  | 'paint-brush'
  | 'paint-bucket'
  | 'paint-eraser'
  | 'paint-line'
  | 'paint-rect'
  | 'paint-circle'
  | 'arrow-up'
  | 'plus'
  | 'search'
  | 'check'
  | 'warning'
  | 'info'
  | 'power';

export interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly className?: string;
  readonly title?: string;
}

const ICON_PATHS: Readonly<Record<IconName, ReadonlyArray<string>>> = {
  notepad: [
    'M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
    'M15 3v5h5',
    'M8 13h8M8 17h6',
  ],
  paint: [
    'M5 4h11a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3h-2l-3 3v6H8v-6H5a3 3 0 0 1-3-3v0a3 3 0 0 1 3-3Z',
    'M16 10l4 4',
    'M19 13l-1.5 1.5',
  ],
  calculator: [
    'M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
    'M7 7h10v3H7z',
    'M8 13h2M12 13h2M16 13h0M8 17h2M12 17h2M16 17h0',
  ],
  terminal: [
    'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
    'M7 9l3 3-3 3',
    'M13 15h5',
  ],
  files: [
    'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
    'M3 10h18',
  ],
  browser: [
    'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
    'M3 9h18',
    'M7 12h4M7 15h6',
  ],
  about: [
    'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
    'M12 10v6',
    'M12 7h0',
  ],
  settings: [
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z',
  ],
  sysmon: [
    'M4 19V8',
    'M9 19V5',
    'M14 19v-9',
    'M19 19v-5',
  ],
  start: [
    'M12 3l3.5 6 6.5.9-4.7 4.5 1.2 6.6L12 18l-6 3 1.2-6.6L2 9.9 8.5 9Z',
  ],
  'tray-online': [
    'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z',
    'M8 12l3 3 5-6',
  ],
  'tray-offline': [
    'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z',
    'M8 8l8 8',
  ],
  battery: [
    'M4 8h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z',
    'M21 10v4',
    'M6 11h6',
  ],
  'chevron-left': [
    'M15 6l-6 6 6 6',
  ],
  'chevron-right': [
    'M9 6l6 6-6 6',
  ],
  refresh: [
    'M3 12a9 9 0 0 1 15-6.7L21 8',
    'M21 3v5h-5',
    'M21 12a9 9 0 0 1-15 6.7L3 16',
    'M3 21v-5h5',
  ],
  minimize: [
    'M5 19h14',
  ],
  maximize: [
    'M5 5h14v14H5z',
  ],
  restore: [
    'M5 9V5h4',
    'M19 9V5h-4',
    'M5 15v4h4',
    'M19 15v4h-4',
  ],
  close: [
    'M6 6l12 12M18 6L6 18',
  ],
  trash: [
    'M4 7h16',
    'M9 7V4h6v3',
    'M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13',
    'M10 11v6M14 11v6',
  ],
  rename: [
    'M4 20h4l10-10-4-4L4 16Z',
    'M14 6l4 4',
  ],
  folder: [
    'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
  ],
  'file-text': [
    'M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
    'M15 3v5h5',
    'M8 13h8M8 17h6',
  ],
  'file-image': [
    'M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
    'M15 3v5h5',
    'M9 14a2 2 0 1 0 0 .01',
    'M9 21l4-5 3 3 4-5',
  ],
  'file-config': [
    'M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
    'M15 3v5h5',
    'M9 12h2M13 12h2M9 16h6',
  ],
  'file-app': [
    'M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
    'M15 3v5h5',
    'M10 13l-2 4h8l-2-4-2 3Z',
  ],
  play: [
    'M6 4l14 8-14 8Z',
  ],
  grid: [
    'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  ],
  globe: [
    'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z',
    'M3 12h18',
    'M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
  ],
  chart: [
    'M4 20V8',
    'M10 20V4',
    'M16 20v-7',
  ],
  cpu: [
    'M5 8h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z',
    'M9 12h6v0',
    'M8 5v2M16 5v2M8 17v2M16 17v2M5 8h-2M5 16h-2M19 8h2M19 16h2',
  ],
  memory: [
    'M4 6h16v12H4z',
    'M7 6v12M11 6v12M15 6v12',
  ],
  'paint-brush': [
    'M14 4l6 6-9 9-3-3 1-5 5-7Z',
    'M5 19a3 3 0 0 0 3-3 3 3 0 0 0-3-3 3 3 0 0 0-3 3',
  ],
  'paint-bucket': [
    'M5 11l7-7 7 7-7 7Z',
    'M5 11h14v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z',
  ],
  'paint-eraser': [
    'M16 4l4 4-9 9-4-4Z',
    'M3 21h18',
    'M11 13l4 4',
  ],
  'paint-line': [
    'M4 20L20 4',
  ],
  'paint-rect': [
    'M5 5h14v14H5z',
  ],
  'paint-circle': [
    'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z',
  ],
  'arrow-up': [
    'M12 19V5',
    'M5 12l7-7 7 7',
  ],
  plus: [
    'M12 5v14M5 12h14',
  ],
  search: [
    'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z',
    'M21 21l-4-4',
  ],
  check: [
    'M5 12l4 4 10-10',
  ],
  warning: [
    'M12 4l10 18H2Z',
    'M12 10v5',
    'M12 18h0',
  ],
  info: [
    'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
    'M12 10v6',
    'M12 7h0',
  ],
  power: [
    'M12 4v8',
    'M7 7a8 8 0 1 0 10 0',
  ],
};

export const Icon = ({ name, size = 20, className, title }: IconProps): JSX.Element => {
  const paths = ICON_PATHS[name];
  const ariaLabel = title ?? name;
  const style: CSSProperties = { width: size, height: size, display: 'inline-block', verticalAlign: 'middle' };
  const mergedClass = className ? `icon ${className}` : 'icon';
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={mergedClass}
      style={style}
    >
      {title ? <title>{title}</title> : null}
      {(paths ?? []).map((d, idx) => (
        <path key={idx} d={d} />
      ))}
    </svg>
  );
};
