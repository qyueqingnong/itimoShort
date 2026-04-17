/** Electron 本地图片 file:// URL（需主进程 webSecurity: false） */
export function toLocalFileUrl(absPath: string): string {
  if (!absPath) {
    return '';
  }
  const normalized = absPath.replace(/\\/g, '/');
  if (/^[a-zA-Z]:/.test(normalized)) {
    return `file:///${normalized}`;
  }
  return `file://${normalized}`;
}
