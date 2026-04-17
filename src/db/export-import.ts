/**
 * 数据库导出/导入服务
 * 备份文件存储在 `<数据目录>/backups/` 目录下
 */
import { exportDB, importInto } from 'dexie-export-import';
import { db } from './index';
import { getElectronApi } from 'src/services/native-fs';
import { getDatabaseBackupsPath, listDatabaseBackupFiles } from 'src/services/app-paths';

/**
 * 导出整个数据库到默认备份目录
 * 文件保存到 `<数据目录>/backups/backup-YYYY-MM-DD-HH-mm-ss.json`
 * @returns 导出的文件路径
 */
export async function exportDatabaseToDefaultPath(): Promise<string> {
  const api = getElectronApi();
  if (!api) {
    throw new Error('此功能仅在桌面端可用');
  }

  // 确保备份目录存在
  const backupsDir = await getDatabaseBackupsPath();
  await api.fsEnsureDir(backupsDir);

  // 生成文件名
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `backup-${timestamp}.json`;
  const filePath = await api.pathJoin(backupsDir, fileName);

  // 导出数据库
  const blob = await exportDB(db, {
    filter: (table) => {
      // 排除 AI 资产表（文件路径引用通过相对路径保存，不需要导出）
      return table !== 'aiAssets';
    },
  });

  const text = await blob.text();
  await api.fsWriteTextFile(filePath, text);

  console.log(`[db-export] Database exported to: ${filePath}`);
  return filePath;
}

/**
 * 导出整个数据库到指定文件路径
 * @param filePath 指定文件路径（包含文件名）
 */
export async function exportDatabase(filePath: string): Promise<void> {
  const api = getElectronApi();
  if (!api) {
    throw new Error('此功能仅在桌面端可用');
  }

  const blob = await exportDB(db, {
    filter: (table) => table !== 'aiAssets',
  });

  const text = await blob.text();
  await api.fsWriteTextFile(filePath, text);
}

/**
 * 导入数据库（从备份文件）
 * 导入前会清空现有数据，确保干净恢复
 * @param filePath 备份文件路径
 */
export async function importDatabase(filePath: string): Promise<void> {
  const api = getElectronApi();
  if (!api) {
    throw new Error('此功能仅在桌面端可用');
  }

  // 读取文件
  const text = await api.fsReadTextFile(filePath);

  // 解析为 Blob
  const blob = new Blob([text], { type: 'application/json' });

  // 清空所有数据表后导入（确保完全替换）
  await importInto(db, blob, {
    clearTablesBeforeImport: true,
    acceptVersionDiff: true,
  });

  console.log(`[db-import] Database imported from: ${filePath}`);
}

/**
 * 获取所有可用的数据库备份文件
 */
export async function getBackupFiles() {
  return listDatabaseBackupFiles();
}

/**
 * 清除所有数据（用于重置）
 */
export async function clearAllData(): Promise<void> {
  await db.delete();
  await db.open();
}

/**
 * 获取数据库统计信息
 */
export async function getDatabaseStats(): Promise<{
  projectCount: number;
  episodeCount: number;
  storyboardCount: number;
  aiAssetCount: number;
  characterCount: number;
  sceneCount: number;
  propCount: number;
}> {
  const [projectCount, episodeCount, storyboardCount, aiAssetCount, characterCount, sceneCount, propCount] = await Promise.all([
    db.projectManifests.count(),
    db.episodeManifests.count(),
    db.storyboards.count(),
    db.aiAssets.count(),
    db.characters.count(),
    db.scenes.count(),
    db.props.count(),
  ]);
  return { projectCount, episodeCount, storyboardCount, aiAssetCount, characterCount, sceneCount, propCount };
}
