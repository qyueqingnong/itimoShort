import { app, BrowserWindow, Menu, crashReporter, dialog } from 'electron';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { registerIpcHandlers } from './ipc-handlers';

// 配置崩溃报告器
crashReporter.start({
  companyName: 'itimo',
  productName: 'itimoAiDrama',
  submitURL: '',
  uploadToServer: false,
});

// 全局未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('[process] 未捕获异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[process] 未处理的 Promise rejection:', reason);
});

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

// 禁用 GPU 加速以避免 Windows 上的缓存权限问题
app.disableHardwareAcceleration();

// 禁用 Chromium 缓存，避免 Windows 上的缓存权限错误
app.commandLine.appendSwitch('disable-cache');
app.commandLine.appendSwitch('disable-gpu-cache');
// 禁用 quota 管理器，避免 quota database 错误
app.commandLine.appendSwitch('disable-quota');

const currentDir = fileURLToPath(new URL('.', import.meta.url));

let mainWindow: BrowserWindow | undefined;

console.log('[electron] 开始注册 IPC 处理器...');
registerIpcHandlers();
console.log('[electron] IPC 处理器注册完成');

async function createWindow() {
  console.log('[electron] 开始创建窗口...');

  /** 去掉 File / Edit 等系统菜单，界面操作统一用应用内按钮（更现代） */
  Menu.setApplicationMenu(null);

  /**
   * Initial window options
   */
  try {
    mainWindow = new BrowserWindow({
      icon: path.resolve(currentDir, 'icons/icon.png'), // tray icon
      width: 1280,
      height: 800,
      useContentSize: true,
      autoHideMenuBar: true,
      webPreferences: {
        /** 允许 img 使用 file:// 引用全局资源库图片（仅本地素材应用，勿加载远程不可信内容） */
        webSecurity: false,
        contextIsolation: true,
        nodeIntegration: false,
        // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
        preload: path.resolve(
          currentDir,
          path.join(process.env.QUASAR_ELECTRON_PRELOAD_FOLDER, 'electron-preload' + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION)
        ),
      },
    });
    console.log('[electron] BrowserWindow 创建成功');
  } catch (error) {
    console.error('[electron] 创建 BrowserWindow 失败:', error);
    throw error;
  }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) {
      console.log('[electron] did-fail-load: errorCode -3 (忽略)');
      return;
    }
    console.error('[electron] did-fail-load', { errorCode, errorDescription, validatedURL });
  });

  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('[electron] webContents 崩溃:', { event, killed });
  });

  mainWindow.on('closed', () => {
    console.log('[electron] 窗口已关闭');
    mainWindow = undefined;
  });

  if (process.env.DEV) {
    const url = process.env.APP_URL;
    if (typeof url !== 'string' || url.length === 0) {
      console.error(
        '[electron] APP_URL 未设置。请在项目根目录运行：yarn dev:electron（或 npx quasar dev -m electron）',
      );
      const html =
        '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>配置错误</title></head><body style="font-family:system-ui,sans-serif;padding:24px;background:#111;color:#eee">' +
        '<h1>无法加载开发页面</h1>' +
        '<p>环境变量 <code>APP_URL</code> 为空。请确认：</p>' +
        '<ul><li>在项目根目录 <code>itimoAiDrama</code> 下执行命令</li>' +
        '<li>使用 <code>yarn dev:electron</code> 或 <code>npx quasar dev -m electron</code></li>' +
        '<li>不要使用 <code>yarn quasar</code> 若未解析到本地 CLI</li></ul></body></html>';
      await mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    } else {
      try {
        console.log('[electron] 开始加载 URL:', url);
        await mainWindow.loadURL(url);
        console.log('[electron] URL 加载完成');
      } catch (err) {
        console.error('[electron] loadURL failed', err);
        throw err;
      }
    }
  } else {
    await mainWindow.loadFile('index.html');
  }

  if (process.env.DEBUGGING) {
    mainWindow.webContents.openDevTools();
  } else if (!process.env.DEV) {
    // 仅在生产环境禁止常驻 DevTools；开发环境不要注册「打��即关闭」避免异常
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  console.log('[electron] 窗口创建完成');
}

void app.whenReady().then(() => {
  console.log('[electron] app 就绪，开始创建窗口');
  void createWindow().catch((err) => {
    console.error('[electron] createWindow 失败:', err);
    app.quit();
  });
}).catch((err) => {
  console.error('[electron] app.whenReady 失败:', err);
  app.quit();
});

app.on('window-all-closed', () => {
  console.log('[electron] 所有窗口已关闭');
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('[electron] app activate');
  if (mainWindow === undefined) {
    void createWindow().catch((err) => {
      console.error('[electron] createWindow 失败:', err);
    });
  }
});

// 监听应用崩溃
app.on('will-quit', (event) => {
  console.log('[electron] app 即将退出');
});

// 监听渲染进程崩溃
app.on('renderer-process-crashed', (event, webContents, killed) => {
  console.error('[electron] 渲染进程崩溃:', { event, killed, webContents });
});

console.log('[electron] 主进程初始化完成');
