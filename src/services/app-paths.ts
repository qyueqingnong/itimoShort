import { getElectronApi, requireElectronApi } from './native-fs';

const APP_DIR = 'itimoAiDrama';

/**
 * 获取系统配置文件的存储目录（固定在用户 AppData 目录下）
 */
export async function getSystemConfigRoot(): Promise<string> {
  const api = requireElectronApi();
  const userData = await api.appGetPath('userData');
  return api.pathJoin(userData, APP_DIR);
}

/**
 * 获取项目和资源数据的根目录
 * `<projectsRootPath>/itimoAiDrama`（如果用户自定义了 projectsRootPath）
 * 否则 `<用户数据目录>/itimoAiDrama`
 */
export async function getProjectsDataRoot(customProjectsRootPath?: string | null): Promise<string> {
  if (customProjectsRootPath) {
    const api = requireElectronApi();
    return api.pathJoin(customProjectsRootPath, APP_DIR);
  }

  const api = getElectronApi();
  if (!api) {
    return 'D:\\itimoAiDrama（无 D 盘则为 C:\\itimoAiDrama）';
  }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isWin = /Windows/i.test(ua);

  if (isWin) {
    const tryRoot = async (letter: string) => {
      const root = `${letter}:\\`;
      try {
        if (await api.fsExists(root)) {
          return api.pathJoin(root, APP_DIR);
        }
      } catch {
        /* ignore */
      }
      return null;
    };
    const dPath = await tryRoot('D');
    if (dPath) return dPath;
    const cPath = await tryRoot('C');
    if (cPath) return cPath;
    return api.pathJoin('C:', APP_DIR);
  }

  return getSystemConfigRoot();
}

/**
 * 获取项目的默认父目录（projects 文件夹）
 */
export async function getProjectsParentPath(
  customProjectsRootPath?: string | null,
): Promise<string> {
  const root = await getProjectsDataRoot(customProjectsRootPath);
  return requireElectronApi().pathJoin(root, 'projects');
}

/**
 * 获取全局资源库目录（libraries 文件夹）
 */
export async function getLibrariesPath(customProjectsRootPath?: string | null): Promise<string> {
  const root = await getProjectsDataRoot(customProjectsRootPath);
  return requireElectronApi().pathJoin(root, 'libraries');
}

/**
 * 获取数据库备份目录（backups 文件夹，在 itimoAiDrama 根目录下）
 */
export async function getDatabaseBackupsPath(customProjectsRootPath?: string | null): Promise<string> {
  const root = await getProjectsDataRoot(customProjectsRootPath);
  return requireElectronApi().pathJoin(root, 'backups');
}

/**
 * 获取数据库备份目录下所有备份文件列表（按时间倒序）
 */
export async function listDatabaseBackupFiles(
  customProjectsRootPath?: string | null,
): Promise<Array<{ name: string; fullPath: string; mtimeMs: number }>> {
  const api = getElectronApi();
  if (!api) return [];

  const backupsDir = await getDatabaseBackupsPath(customProjectsRootPath);
  if (!(await api.fsExists(backupsDir))) return [];

  const entries = await api.fsListDir(backupsDir);
  const result: Array<{ name: string; fullPath: string; mtimeMs: number }> = [];

  for (const entry of entries) {
    if (!entry.isFile || !entry.name.endsWith('.json')) continue;
    try {
      const fullPath = await api.pathJoin(backupsDir, entry.name);
      const stat = await api.fsStat(fullPath);
      result.push({ name: entry.name, fullPath, mtimeMs: stat.mtimeMs });
    } catch {
      /* skip invalid entries */
    }
  }

  // 按修改时间倒序
  result.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return result;
}

// 便捷函数：自动获取当前设置

/** 获取当前 projectsRootPath 对应的数据根目录 */
export async function getCurrentProjectsDataRoot(): Promise<string> {
  const api = getElectronApi();
  if (!api) return 'D:\\itimoAiDrama';

  try {
    const { useSettingsStore } = await import('src/stores/settings-store');
    const settings = useSettingsStore();
    return getProjectsDataRoot(settings.settings.projectsRootPath);
  } catch {
    return getProjectsDataRoot(null);
  }
}

/** 获取当前 projectsRootPath 对应的 projects 目录 */
export async function getCurrentProjectsParentPath(): Promise<string> {
  const api = getElectronApi();
  if (!api) return 'D:\\itimoAiDrama\\projects';

  try {
    const { useSettingsStore } = await import('src/stores/settings-store');
    const settings = useSettingsStore();
    return getProjectsParentPath(settings.settings.projectsRootPath);
  } catch {
    return getProjectsParentPath(null);
  }
}

/** 获取当前 projectsRootPath 对应的 libraries 目录 */
export async function getCurrentLibrariesPath(): Promise<string> {
  const api = getElectronApi();
  if (!api) return 'D:\\itimoAiDrama\\libraries';

  try {
    const { useSettingsStore } = await import('src/stores/settings-store');
    const settings = useSettingsStore();
    return getLibrariesPath(settings.settings.projectsRootPath);
  } catch {
    return getLibrariesPath(null);
  }
}
