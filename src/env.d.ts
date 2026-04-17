import type { ElectronApi } from './types/electron-api';

declare global {
  interface Window {
    electronAPI?: ElectronApi;
  }
}

export {};
