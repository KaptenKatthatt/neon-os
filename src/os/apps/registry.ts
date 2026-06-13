import type { ComponentType } from 'react';
import type { AppId, AppDefinition } from '../types';
import type { IconName } from '../components/Icon';
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
  readonly iconName: IconName;
}

const build = (
  id: AppId,
  name: string,
  iconName: IconName,
  component: AppComponent,
  defaultSize: AppDefinition['defaultSize'],
  resizable: boolean,
): AppEntry => ({ id, name, iconName, defaultSize, resizable, component, icon: iconName });

export const APP_REGISTRY: Readonly<Record<AppId, AppEntry>> = {
  notepad: build('notepad', 'Notepad', 'notepad', NotepadApp, { width: 520, height: 380 }, true),
  paint: build('paint', 'Paint', 'paint', PaintApp, { width: 720, height: 520 }, true),
  calculator: build('calculator', 'Calculator', 'calculator', CalculatorApp, { width: 280, height: 380 }, false),
  terminal: build('terminal', 'Terminal', 'terminal', TerminalApp, { width: 640, height: 400 }, true),
  files: build('files', 'Files', 'files', FilesApp, { width: 640, height: 420 }, true),
  browser: build('browser', 'Neon Browser', 'browser', BrowserApp, { width: 820, height: 560 }, true),
  about: build('about', 'About Neon OS', 'about', AboutApp, { width: 360, height: 260 }, false),
  settings: build('settings', 'Settings', 'settings', SettingsApp, { width: 460, height: 480 }, false),
  sysmon: build('sysmon', 'System Monitor', 'sysmon', SystemMonitorApp, { width: 520, height: 600 }, true),
};
