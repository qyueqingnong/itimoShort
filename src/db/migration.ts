/**
 * 数据库迁移服务
 * 用于将旧版数据迁移到新版独立表
 * 注意：此模块已在 v2 版本中重构，现在直接使用独立的 characters/scenes/props 表
 */
import { db } from './index';

interface MigrationResult {
  migratedProjects: number;
  migratedCharacters: number;
  migratedScenes: number;
  migratedProps: number;
  errors: string[];
}

/**
 * 检查是否需要迁移（检查是否有孤立资产）
 * 如果 characters/scenes/props 表为空但项目存在，可能需要迁移
 */
export async function checkNeedsMigration(): Promise<boolean> {
  const [projectCount, characterCount, sceneCount, propCount] = await Promise.all([
    db.projectManifests.count(),
    db.characters.count(),
    db.scenes.count(),
    db.props.count(),
  ]);

  // 如果有项目但没有资产，可能需要迁移
  return projectCount > 0 && characterCount === 0 && sceneCount === 0 && propCount === 0;
}

/**
 * 获取需要迁移的项目列表
 * 返回有项目但资产表为空的项目
 */
export async function getProjectsNeedingMigration(): Promise<string[]> {
  const projects = await db.projectManifests.toArray();
  const projectIds = projects.map((p) => p.id);

  const [characterCount, sceneCount, propCount] = await Promise.all([
    db.characters.count(),
    db.scenes.count(),
    db.props.count(),
  ]);

  // 如果资产表为空，所有项目都需要检查
  if (characterCount === 0 && sceneCount === 0 && propCount === 0) {
    return projectIds;
  }

  return [];
}

/**
 * 迁移单个项目的资产数据（如果存在旧格式数据）
 * 注意：v2 版本不再使用 libraryData，直接使用独立表
 */
export async function migrateProjectLibrary(projectId: string): Promise<{
  characters: number;
  scenes: number;
  props: number;
}> {
  // v2 版本：直接使用独立的 characters/scenes/props 表
  // 如果这些表有数据，说明迁移已完成
  const [existingCharacters, existingScenes, existingProps] = await Promise.all([
    db.characters.where('projectId').equals(projectId).count(),
    db.scenes.where('projectId').equals(projectId).count(),
    db.props.where('projectId').equals(projectId).count(),
  ]);

  return {
    characters: existingCharacters,
    scenes: existingScenes,
    props: existingProps,
  };
}

/**
 * 执行完整迁移
 * v2 版本中，迁移逻辑已简化为确保数据结构正确
 */
export async function runMigration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    migratedProjects: 0,
    migratedCharacters: 0,
    migratedScenes: 0,
    migratedProps: 0,
    errors: [],
  };

  try {
    const projectsToMigrate = await getProjectsNeedingMigration();

    for (const projectId of projectsToMigrate) {
      try {
        const counts = await migrateProjectLibrary(projectId);
        if (counts.characters > 0 || counts.scenes > 0 || counts.props > 0) {
          result.migratedProjects++;
          result.migratedCharacters += counts.characters;
          result.migratedScenes += counts.scenes;
          result.migratedProps += counts.props;
        }
      } catch (error) {
        result.errors.push(`迁移项目 ${projectId} 失败: ${error}`);
      }
    }
  } catch (error) {
    result.errors.push(`迁移过程出错: ${error}`);
  }

  return result;
}

/**
 * 清理旧数据（保留函数签名以兼容）
 */
export async function cleanupLegacyLibraryData(): Promise<number> {
  // v2 版本不再有 libraryData 字段
  return 0;
}

/**
 * 获取迁移状态摘要
 */
export async function getMigrationStatus(): Promise<{
  needsMigration: boolean;
  totalProjects: number;
  projectsWithLibraryData: number;
  totalCharacters: number;
  totalScenes: number;
  totalProps: number;
}> {
  const [manifests, characters, scenes, props] = await Promise.all([
    db.projectManifests.toArray(),
    db.characters.count(),
    db.scenes.count(),
    db.props.count(),
  ]);

  // v2 版本：不再检查 libraryData
  const projectsWithLibraryData = 0;

  return {
    needsMigration: await checkNeedsMigration(),
    totalProjects: manifests.length,
    projectsWithLibraryData,
    totalCharacters: characters,
    totalScenes: scenes,
    totalProps: props,
  };
}
