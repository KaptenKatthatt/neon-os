import type { JSX } from 'react';
import type { AppHostProps } from './registry';
import { Icon } from '../components/Icon';

export const AboutApp = (_props: AppHostProps): JSX.Element => (
  <div className="about">
    <span className="pill">v1.0.0</span>
    <h2>
      <Icon name="globe" size={18} /> Neon OS
    </h2>
    <p>A tiny, browser-based desktop environment built with React, TypeScript, and Vite.</p>
    <p>
      Features: Start menu, taskbar clock, Notepad, Paint, Calculator, Files, Terminal (with <code>help</code> command),
      Browser with offline Wikipedia articles, Settings (wallpaper picker), and System Monitor.
    </p>
    <p style={{ color: 'var(--neon-muted)' }}>
      All state is persisted in <code>localStorage</code> and survives page reload.
    </p>
  </div>
);
