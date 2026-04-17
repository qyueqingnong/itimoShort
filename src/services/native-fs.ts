import type { ElectronApi } from 'src/types/electron-api';

export function getElectronApi(): ElectronApi | undefined {
  return typeof window !== 'undefined' ? window.electronAPI : undefined;
}

export function requireElectronApi(): ElectronApi {
  const api = getElectronApi();
  if (!api) {
    throw new Error('当前环境未暴露 Electron API，请使用 yarn dev:electron 运行桌面端。');
  }
  return api;
}
