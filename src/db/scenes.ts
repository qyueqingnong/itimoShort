/**
 * 场景数据库 CRUD 服务
 */
import { db, type DbScene } from './index';
import type { Scene } from 'src/core/types/project';

function nowIso(): string {
  return new Date().toISOString();
}

// ── 场景 CRUD ─────────────────────────────────────────────────────

/** 从数据库加载单个场景 */
export async function loadScene(sceneId: string): Promise<Scene | null> {
  const record = await db.scenes.get(sceneId);
  if (!record) return null;

  return {
    id: record.id,
    name: record.name,
    description: record.description,
    imagePath: record.imagePath,
    promptLangEn: record.promptLangEn,
    promptThemeId: record.promptThemeId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/** 加载项目的所有场景 */
export async function loadScenesByProject(projectId: string): Promise<Scene[]> {
  const records = await db.scenes.where('projectId').equals(projectId).toArray();
  return records.map((record) => ({
    id: record.id,
    name: record.name,
    description: record.description,
    imagePath: record.imagePath,
    promptLangEn: record.promptLangEn,
    promptThemeId: record.promptThemeId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }));
}

/** 保存场景（创建或更新） */
export async function saveScene(scene: Scene): Promise<void> {
  const record: DbScene = {
    id: scene.id,
    projectId: scene.projectId ?? '',
    name: scene.name,
    description: scene.description,
    imagePath: scene.imagePath,
    promptLangEn: scene.promptLangEn,
    promptThemeId: scene.promptThemeId,
    createdAt: scene.createdAt,
    updatedAt: nowIso(),
  };
  await db.scenes.put(record);
}

/** 创建新场景 */
export async function createScene(
  projectId: string,
  data: Omit<Scene, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>,
): Promise<Scene> {
  const scene: Scene = {
    ...data,
    id: crypto.randomUUID(),
    projectId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await saveScene(scene);
  return scene;
}

/** 批量创建场景 */
export async function createScenes(
  projectId: string,
  items: Array<Omit<Scene, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>,
): Promise<Scene[]> {
  const scenes = items.map((data) => ({
    ...data,
    id: crypto.randomUUID(),
    projectId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));

  const records: DbScene[] = scenes.map((s) => ({
    id: s.id,
    projectId: s.projectId,
    name: s.name,
    description: s.description,
    imagePath: s.imagePath,
    promptLangEn: s.promptLangEn,
    promptThemeId: s.promptThemeId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));

  await db.scenes.bulkPut(records);
  return scenes;
}

/** 更新场景 */
export async function updateScene(
  sceneId: string,
  updates: Partial<Omit<Scene, 'id' | 'createdAt'>>,
): Promise<void> {
  const existing = await db.scenes.get(sceneId);
  if (!existing) return;

  await db.scenes.update(sceneId, {
    ...updates,
    updatedAt: nowIso(),
  });
}

/** 删除场景 */
export async function deleteScene(sceneId: string): Promise<void> {
  await db.scenes.delete(sceneId);
}

/** 批量删除项目的所有场景 */
export async function deleteScenesByProject(projectId: string): Promise<void> {
  await db.scenes.where('projectId').equals(projectId).delete();
}

/** 批量保存/更新场景（用于同步） */
export async function saveScenes(projectId: string, scenes: Scene[]): Promise<void> {
  const records: DbScene[] = scenes.map((s) => ({
    id: s.id,
    projectId,
    name: s.name,
    description: s.description,
    imagePath: s.imagePath,
    promptLangEn: s.promptLangEn,
    promptThemeId: s.promptThemeId,
    createdAt: s.createdAt,
    updatedAt: nowIso(),
  }));
  await db.scenes.bulkPut(records);
}
