export interface Wallpaper {
  readonly id: string;
  readonly label: string;
  readonly preview: string;
  readonly css: string;
}

export const WALLPAPERS: ReadonlyArray<Wallpaper> = [
  {
    id: 'aurora',
    label: 'Aurora',
    preview: 'linear-gradient(135deg,#0b1437,#3b1d6b 60%,#0a1d4a)',
    css: `
      background:
        radial-gradient(1200px 700px at 12% 8%, rgba(34, 211, 238, 0.18), transparent 60%),
        radial-gradient(900px 600px at 90% 90%, rgba(167, 139, 250, 0.18), transparent 60%),
        radial-gradient(600px 400px at 50% 50%, rgba(244, 114, 182, 0.06), transparent 60%),
        linear-gradient(160deg, #060a1a 0%, #0a0f24 60%, #0e1430 100%);
    `,
  },
  {
    id: 'sunset',
    label: 'Sunset',
    preview: 'linear-gradient(160deg,#3a0d2b,#a13b6e 50%,#f59e0b)',
    css: `
      background:
        radial-gradient(900px 600px at 80% 10%, rgba(245, 158, 11, 0.35), transparent 60%),
        radial-gradient(800px 600px at 10% 90%, rgba(244, 114, 182, 0.30), transparent 60%),
        linear-gradient(160deg, #2b0a1e 0%, #6a1a47 50%, #b5562b 100%);
    `,
  },
  {
    id: 'forest',
    label: 'Forest',
    preview: 'linear-gradient(160deg,#0a2e1a,#0f5132 60%,#84cc16)',
    css: `
      background:
        radial-gradient(900px 600px at 20% 10%, rgba(132, 204, 22, 0.20), transparent 60%),
        radial-gradient(700px 500px at 80% 90%, rgba(34, 197, 94, 0.20), transparent 60%),
        linear-gradient(160deg, #06150d 0%, #0a2e1a 50%, #0f5132 100%);
    `,
  },
  {
    id: 'ocean',
    label: 'Ocean',
    preview: 'linear-gradient(160deg,#03183a,#0e7490 60%,#67e8f9)',
    css: `
      background:
        radial-gradient(900px 600px at 80% 10%, rgba(103, 232, 249, 0.30), transparent 60%),
        radial-gradient(800px 600px at 10% 90%, rgba(14, 116, 144, 0.40), transparent 60%),
        linear-gradient(160deg, #03183a 0%, #0c4a6e 60%, #155e75 100%);
    `,
  },
  {
    id: 'midnight',
    label: 'Midnight',
    preview: 'linear-gradient(160deg,#000000,#1e1b4b 60%,#312e81)',
    css: `
      background:
        radial-gradient(700px 500px at 30% 20%, rgba(99, 102, 241, 0.18), transparent 60%),
        radial-gradient(800px 600px at 80% 80%, rgba(30, 27, 75, 0.50), transparent 60%),
        linear-gradient(160deg, #000000 0%, #0b0b1a 50%, #1e1b4b 100%);
    `,
  },
  {
    id: 'rose',
    label: 'Rose',
    preview: 'linear-gradient(160deg,#1f0a1a,#9d174d 60%,#fda4af)',
    css: `
      background:
        radial-gradient(800px 600px at 70% 20%, rgba(253, 164, 175, 0.30), transparent 60%),
        radial-gradient(700px 500px at 20% 80%, rgba(157, 23, 77, 0.50), transparent 60%),
        linear-gradient(160deg, #1f0a1a 0%, #4a0d2b 50%, #9d174d 100%);
    `,
  },
];

export const DEFAULT_WALLPAPER_ID = 'aurora';

export const findWallpaper = (id: string): Wallpaper => {
  const found = WALLPAPERS.find((w) => w.id === id);
  return found ?? WALLPAPERS[0]!;
};
