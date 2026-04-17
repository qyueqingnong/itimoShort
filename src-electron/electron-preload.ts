import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronApi } from '../src/types/electron-api';

const api: ElectronApi = {
  appGetPath: (name) => ipcRenderer.invoke('app:getPath', name),
  shellOpenPath: (targetPath) => ipcRenderer.invoke('shell:openPath', targetPath),
  shellOpenExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  dialogOpenDirectory: (options) => ipcRenderer.invoke('dialog:openDirectory', options),
  dialogOpenFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  dialogSaveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  fsExists: (filePath) => ipcRenderer.invoke('fs:exists', filePath),
  fsStat: (filePath) => ipcRenderer.invoke('fs:stat', filePath),
  fsReadTextFile: (filePath) => ipcRenderer.invoke('fs:readTextFile', filePath),
  fsWriteTextFile: (filePath, content) => ipcRenderer.invoke('fs:writeTextFile', filePath, content),
  fsWriteBase64File: (filePath, base64Content) =>
    ipcRenderer.invoke('fs:writeBase64File', filePath, base64Content),
  fsEnsureDir: (dirPath) => ipcRenderer.invoke('fs:ensureDir', dirPath),
  fsRemove: (targetPath, options) => ipcRenderer.invoke('fs:remove', targetPath, options),
  fsRename: (fromPath, toPath) => ipcRenderer.invoke('fs:rename', fromPath, toPath),
  fsListDir: (dirPath) => ipcRenderer.invoke('fs:listDir', dirPath),
  fsCopyFile: (srcPath, destPath) => ipcRenderer.invoke('fs:copyFile', srcPath, destPath),
  pathJoin: (...parts) => ipcRenderer.invoke('path:join', ...parts),
  pathDirname: (filePath) => ipcRenderer.invoke('path:dirname', filePath),
  fsCopyDirRecursive: (src, dest) => ipcRenderer.invoke('fs:copyDirRecursive', src, dest),
};

contextBridge.exposeInMainWorld('electronAPI', api);
