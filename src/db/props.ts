/**
 * 道具数据库 CRUD 服务
 */
import { db, type DbProp } from './index';
import type { Prop } from 'src/core/types/project';

function nowIso(): string {
  return new Date().toISOString();
}

// ── 道具 CRUD ─────────────────────────────────────────────────────

/** 从数据库加载单个道具 */
export async function loadProp(propId: string): Promise<Prop | null> {
  const record = await db.props.get(propId);
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

/** 加载项目的所有道具 */
export async function loadPropsByProject(projectId: string): Promise<Prop[]> {
  const records = await db.props.where('projectId').equals(projectId).toArray();
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

/** 保存道具（创建或更新） */
export async function saveProp(prop: Prop): Promise<void> {
  const record: DbProp = {
    id: prop.id,
    projectId: prop.projectId ?? '',
    name: prop.name,
    description: prop.description,
    imagePath: prop.imagePath,
    promptLangEn: prop.promptLangEn,
    promptThemeId: prop.promptThemeId,
    createdAt: prop.createdAt,
    updatedAt: nowIso(),
  };
  await db.props.put(record);
}

/** 创建新道具 */
export async function createProp(
  projectId: string,
  data: Omit<Prop, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>,
): Promise<Prop> {
  const prop: Prop = {
    ...data,
    id: crypto.randomUUID(),
    projectId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await saveProp(prop);
  return prop;
}

/** 批量创建道具 */
export async function createProps(
  projectId: string,
  items: Array<Omit<Prop, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>,
): Promise<Prop[]> {
  const props = items.map((data) => ({
    ...data,
    id: crypto.randomUUID(),
    projectId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));

  const records: DbProp[] = props.map((p) => ({
    id: p.id,
    projectId: p.projectId,
    name: p.name,
    description: p.description,
    imagePath: p.imagePath,
    promptLangEn: p.promptLangEn,
    promptThemeId: p.promptThemeId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  await db.props.bulkPut(records);
  return props;
}

/** 更新道具 */
export async function updateProp(
  propId: string,
  updates: Partial<Omit<Prop, 'id' | 'createdAt'>>,
): Promise<void> {
  const existing = await db.props.get(propId);
  if (!existing) return;

  await db.props.update(propId, {
    ...updates,
    updatedAt: nowIso(),
  });
}

/** 删除道具 */
export async function deleteProp(propId: string): Promise<void> {
  await db.props.delete(propId);
}

/** 批量删除项目的所有道具 */
export async function deletePropsByProject(projectId: string): Promise<void> {
  await db.props.where('projectId').equals(projectId).delete();
}

/** 批量保存/更新道具（用于同步） */
export async function saveProps(projectId: string, props: Prop[]): Promise<void> {
  const records: DbProp[] = props.map((p) => ({
    id: p.id,
    projectId,
    name: p.name,
    description: p.description,
    imagePath: p.imagePath,
    promptLangEn: p.promptLangEn,
    promptThemeId: p.promptThemeId,
    createdAt: p.createdAt,
    updatedAt: nowIso(),
  }));
  await db.props.bulkPut(records);
}
