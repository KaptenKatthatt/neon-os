import type { ComponentType } from 'react';
import type { AppId, AppDefinition } from '../types';
import { NotepadApp } from './NotepadApp';
import { PaintApp } from './PaintApp';
import { CalculatorApp } from './CalculatorApp';
import { TerminalApp } from './TerminalApp';
import { FilesApp } from './FilesApp';
import { BrowserApp } from './BrowserApp';
import { AboutApp } from './AboutApp';
import { SettingsApp } from './SettingsApp';
import { SystemMonitorApp } from './SystemMonitorApp';

export interface AppHostProps {
  readonly windowId: string;
}

export type AppComponent = ComponentType<AppHostProps>;

export interface AppEntry extends AppDefinition {
  readonly component: AppComponent;
}

const build = (
  id: AppId,
  name: string,
  icon: string,
  component: AppComponent,
  defaultSize: AppDefinition['defaultSize'],
  resizable: boolean,
): AppEntry => ({ id, name, icon, defaultSize, resizable, component });

export const APP_REGISTRY: Readonly<Record<AppId, AppEntry>> = {
  notepad: build('notepad', 'Notepad', '??', NotepadApp, { width: 520, height: 380 }, true),
  paint: build('paint', 'Paint', '??', PaintApp, { width: 720, height: 520 }, true),
  calculator: build('calculator', 'Calculator', '??', CalculatorApp, { width: 280, height: 380 }, false),
  terminal: build('terminal', 'Terminal', '??', TerminalApp, { width: 640, height: 400 }, true),
  files: build('files', 'Files', '??', FilesApp, { width: 640, height: 420 }, true),
  browser: build('browser', 'Neon Browser', '??', BrowserApp, { width: 820, height: 560 }, true),
  about: build('about', 'About Neon OS', '??', AboutApp, { width: 360, height: 260 }, false),
  settings: build('settings', 'Settings', '??', SettingsApp, { width: 460, height: 480 }, false),
  sysmon: build('sysmon', 'System Monitor', '??', SystemMonitorApp, { width: 520, height: 600 }, true),
};
