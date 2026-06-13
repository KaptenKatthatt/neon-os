// Core domain types for Neon OS.
// All app and state shapes are defined here so we get full type coverage.

export type AppId =
  | 'notepad'
  | 'paint'
  | 'calculator'
  | 'terminal'
  | 'files'
  | 'browser'
  | 'about'
  | 'settings'
  | 'sysmon';

export interface AppDefinition {
  readonly id: AppId;
  readonly name: string;
  readonly icon: string;
  readonly defaultSize: WindowSize;
  readonly resizable: boolean;
}

export interface WindowSize {
  readonly width: number;
  readonly height: number;
}

export interface WindowPosition {
  readonly x: number;
  readonly y: number;
}

export interface AppWindow {
  readonly id: string;
  readonly appId: AppId;
  readonly title: string;
  readonly position: WindowPosition;
  readonly size: WindowSize;
  readonly zIndex: number;
  readonly minimized: boolean;
  readonly maximized: boolean;
}

export type FileKind = 'folder' | 'text' | 'image' | 'config' | 'app';

export interface FsNode {
  readonly id: string;
  readonly name: string;
  readonly kind: FileKind;
  readonly parentId: string | null;
  readonly children?: ReadonlyArray<string>;
  readonly content?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly size: number;
  readonly appId?: AppId;
}

export interface FsState {
  readonly nodes: Readonly<Record<string, FsNode>>;
  readonly rootId: string;
}
