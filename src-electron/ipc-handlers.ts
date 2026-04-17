import { app, dialog, ipcMain, shell } from 'electron';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

type AppPathName = Parameters<typeof app.getPath>[0];

export function registerIpcHandlers(): void {
  ipcMain.handle('app:getPath', (_evt, name: AppPathName) => app.getPath(name));

  ipcMain.handle('shell:openPath', (_evt, targetPath: string) => shell.openPath(targetPath));

  ipcMain.handle('shell:openExternal', (_evt, url: string) => shell.openExternal(url));

  ipcMain.handle('dialog:openDirectory', async (_evt, options?: { defaultPath?: string }) => {
    const openOpts: Electron.OpenDialogOptions = {
      properties: ['openDirectory', 'createDirectory'],
    };
    if (options?.defaultPath !== undefined) {
      openOpts.defaultPath = options.defaultPath;
    }
    const r = await dialog.showOpenDialog(openOpts);
    if (r.canceled || r.filePaths.length === 0) return null;
    return r.filePaths[0];
  });

  ipcMain.handle(
    'dialog:openFile',
    async (
      _evt,
      options?: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] },
    ) => {
      const openOpts: Electron.OpenDialogOptions = { properties: ['openFile'] };
      if (options?.defaultPath !== undefined) {
        openOpts.defaultPath = options.defaultPath;
      }
      if (options?.filters !== undefined) {
        openOpts.filters = options.filters;
      }
      const r = await dialog.showOpenDialog(openOpts);
      if (r.canceled || r.filePaths.length === 0) return null;
      return r.filePaths[0];
    },
  );

  ipcMain.handle(
    'dialog:saveFile',
    async (
      _evt,
      options?: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] },
    ) => {
      const saveOpts: Electron.SaveDialogOptions = {};
      if (options?.defaultPath !== undefined) {
        saveOpts.defaultPath = options.defaultPath;
      }
      if (options?.filters !== undefined) {
        saveOpts.filters = options.filters;
      }
      const r = await dialog.showSaveDialog(saveOpts);
      if (r.canceled || !r.filePath) return null;
      return r.filePath;
    },
  );

  ipcMain.handle('fs:exists', (_evt, filePath: string) => existsSync(filePath));

  ipcMain.handle('fs:stat', async (_evt, filePath: string) => {
    const s = await stat(filePath);
    return { isFile: s.isFile(), isDirectory: s.isDirectory(), size: s.size, mtimeMs: s.mtimeMs };
  });

  ipcMain.handle('fs:readTextFile', async (_evt, filePath: string) => {
    return await readFile(filePath, 'utf8');
  });

  ipcMain.handle('fs:writeTextFile', async (_evt, filePath: string, content: string) => {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, 'utf8');
  });

  ipcMain.handle('fs:writeBase64File', async (_evt, filePath: string, base64Content: string) => {
    await mkdir(path.dirname(filePath), { recursive: true });
    const buffer = Buffer.from(base64Content, 'base64');
    await writeFile(filePath, buffer);
  });

  ipcMain.handle('fs:ensureDir', async (_evt, dirPath: string) => {
    await mkdir(dirPath, { recursive: true });
  });

  ipcMain.handle(
    'fs:remove',
    async (_evt, targetPath: string, options?: { recursive?: boolean }) => {
      await rm(targetPath, { recursive: options?.recursive ?? false, force: true });
    },
  );

  ipcMain.handle('fs:rename', async (_evt, fromPath: string, toPath: string) => {
    await mkdir(path.dirname(toPath), { recursive: true });
    await rename(fromPath, toPath);
  });

  ipcMain.handle('fs:listDir', async (_evt, dirPath: string) => {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return entries.map((e) => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      isFile: e.isFile(),
    }));
  });

  ipcMain.handle('fs:copyFile', async (_evt, srcPath: string, destPath: string) => {
    await mkdir(path.dirname(destPath), { recursive: true });
    await copyFile(srcPath, destPath);
  });

  ipcMain.handle('path:join', (_evt, ...parts: string[]) => path.join(...parts));

  ipcMain.handle('path:dirname', (_evt, p: string) => path.dirname(p));

  ipcMain.handle('fs:copyDirRecursive', async (_evt, src: string, dest: string) => {
    await copyDirRecursive(src, dest);
  });
}

async function copyDirRecursive(src: string, dest: string): Promise<void> {
  const entries = await readdir(src, { withFileTypes: true });
  await mkdir(dest, { recursive: true });
  for (const e of entries) {
    const from = path.join(src, e.name);
    const to = path.join(dest, e.name);
    if (e.isDirectory()) {
      await copyDirRecursive(from, to);
    } else {
      await mkdir(path.dirname(to), { recursive: true });
      await copyFile(from, to);
    }
  }
}
