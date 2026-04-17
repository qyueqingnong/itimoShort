/** Mirrors `app.getPath` names we expose to the renderer. */
export type AppPathName =
  | 'home'
  | 'appData'
  | 'userData'
  | 'cache'
  | 'temp'
  | 'exe'
  | 'module'
  | 'desktop'
  | 'documents'
  | 'downloads'
  | 'music'
  | 'pictures'
  | 'videos'
  | 'recent'
  | 'logs'
  | 'crashDumps';

export interface FsDirEntry {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
}

export interface FsStatResult {
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  mtimeMs: number;
}

/** Stable surface exposed via `contextBridge` from `electron-preload`. */
export interface ElectronApi {
  appGetPath: (name: AppPathName) => Promise<string>;
  shellOpenPath: (targetPath: string) => Promise<string>;
  shellOpenExternal: (url: string) => Promise<void>;
  dialogOpenDirectory: (options?: { defaultPath?: string }) => Promise<string | null>;
  dialogOpenFile: (options?: {
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<string | null>;
  dialogSaveFile: (options?: {
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<string | null>;
  fsExists: (filePath: string) => Promise<boolean>;
  fsStat: (filePath: string) => Promise<FsStatResult>;
  fsReadTextFile: (filePath: string) => Promise<string>;
  fsWriteTextFile: (filePath: string, content: string) => Promise<void>;
  fsWriteBase64File: (filePath: string, base64Content: string) => Promise<void>;
  fsEnsureDir: (dirPath: string) => Promise<void>;
  fsRemove: (targetPath: string, options?: { recursive?: boolean }) => Promise<void>;
  fsRename: (fromPath: string, toPath: string) => Promise<void>;
  fsListDir: (dirPath: string) => Promise<FsDirEntry[]>;
  fsCopyFile: (srcPath: string, destPath: string) => Promise<void>;
  pathJoin: (...parts: string[]) => Promise<string>;
  pathDirname: (filePath: string) => Promise<string>;
  /** 将源目录整棵复制到目标（目标目录会被创建或合并） */
  fsCopyDirRecursive: (srcDir: string, destDir: string) => Promise<void>;
}
