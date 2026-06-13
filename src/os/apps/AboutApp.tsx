import type { JSX } from 'react';
import type { AppHostProps } from './registry';

export const AboutApp = (_props: AppHostProps): JSX.Element => (
  <div className="about">
    <span className="pill">v1.0.0</span>
    <h2>Neon OS</h2>
    <p>A tiny, browser-based desktop environment built with React, TypeScript, and Vite.</p>
    <p>
      Features: Start menu, taskbar clock, Notepad, Paint, Calculator, Files, Terminal (with <code>help</code> command),
      and a sandboxed Browser that can load Wikipedia.
    </p>
    <p style={{ color: 'var(--neon-muted)' }}>
      All state is in-memory and resets on page reload.
    </p>
  </div>
);
