/**
 * 角色数据库 CRUD 服务
 */
import { db, type DbCharacter } from './index';
import type { Character } from 'src/core/types/project';

function nowIso(): string {
  return new Date().toISOString();
}

// ── 角色 CRUD ─────────────────────────────────────────────────────

/** 从数据库加载单个角色 */
export async function loadCharacter(characterId: string): Promise<Character | null> {
  const record = await db.characters.get(characterId);
  if (!record) return null;

  return {
    id: record.id,
    name: record.name,
    description: record.description,
    role: record.role,
    gender: record.gender,
    age: record.age,
    height: record.height,
    weight: record.weight,
    bodyType: record.bodyType,
    facialFeatures: record.facialFeatures,
    identity: record.identity,
    personality: record.personality,
    speakingStyle: record.speakingStyle,
    interests: record.interests,
    imagePath: record.imagePath,
    promptLangEn: record.promptLangEn,
    promptThemeId: record.promptThemeId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/** 加载项目的所有角色 */
export async function loadCharactersByProject(projectId: string): Promise<Character[]> {
  const records = await db.characters.where('projectId').equals(projectId).toArray();
  return records.map((record) => ({
    id: record.id,
    name: record.name,
    description: record.description,
    role: record.role,
    gender: record.gender,
    age: record.age,
    height: record.height,
    weight: record.weight,
    bodyType: record.bodyType,
    facialFeatures: record.facialFeatures,
    identity: record.identity,
    personality: record.personality,
    speakingStyle: record.speakingStyle,
    interests: record.interests,
    imagePath: record.imagePath,
    promptLangEn: record.promptLangEn,
    promptThemeId: record.promptThemeId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }));
}

/** 保存角色（创建或更新） */
export async function saveCharacter(character: Character): Promise<void> {
  const record: DbCharacter = {
    id: character.id,
    projectId: character.projectId ?? '',
    name: character.name,
    description: character.description,
    role: character.role,
    gender: character.gender,
    age: character.age,
    height: character.height,
    weight: character.weight,
    bodyType: character.bodyType,
    facialFeatures: character.facialFeatures,
    identity: character.identity,
    personality: character.personality,
    speakingStyle: character.speakingStyle,
    interests: character.interests,
    imagePath: character.imagePath,
    promptLangEn: character.promptLangEn,
    promptThemeId: character.promptThemeId,
    createdAt: character.createdAt,
    updatedAt: nowIso(),
  };
  await db.characters.put(record);
}

/** 创建新角色 */
export async function createCharacter(
  projectId: string,
  data: Omit<Character, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>,
): Promise<Character> {
  const character: Character = {
    ...data,
    id: crypto.randomUUID(),
    projectId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await saveCharacter(character);
  return character;
}

/** 批量创建角色 */
export async function createCharacters(
  projectId: string,
  items: Array<Omit<Character, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>,
): Promise<Character[]> {
  const characters = items.map((data) => ({
    ...data,
    id: crypto.randomUUID(),
    projectId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));

  const records: DbCharacter[] = characters.map((c) => ({
    id: c.id,
    projectId: c.projectId,
    name: c.name,
    description: c.description,
    role: c.role,
    gender: c.gender,
    age: c.age,
    height: c.height,
    weight: c.weight,
    bodyType: c.bodyType,
    facialFeatures: c.facialFeatures,
    identity: c.identity,
    personality: c.personality,
    speakingStyle: c.speakingStyle,
    interests: c.interests,
    imagePath: c.imagePath,
    promptLangEn: c.promptLangEn,
    promptThemeId: c.promptThemeId,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));

  await db.characters.bulkPut(records);
  return characters;
}

/** 更新角色 */
export async function updateCharacter(
  characterId: string,
  updates: Partial<Omit<Character, 'id' | 'createdAt'>>,
): Promise<void> {
  const existing = await db.characters.get(characterId);
  if (!existing) return;

  await db.characters.update(characterId, {
    ...updates,
    updatedAt: nowIso(),
  });
}

/** 删除角色 */
export async function deleteCharacter(characterId: string): Promise<void> {
  await db.characters.delete(characterId);
}

/** 批量删除项目的所有角色 */
export async function deleteCharactersByProject(projectId: string): Promise<void> {
  await db.characters.where('projectId').equals(projectId).delete();
}

/** 批量保存/更新角色（用于同步） */
export async function saveCharacters(projectId: string, characters: Character[]): Promise<void> {
  const records: DbCharacter[] = characters.map((c) => ({
    id: c.id,
    projectId,
    name: c.name,
    description: c.description,
    role: c.role,
    gender: c.gender,
    age: c.age,
    height: c.height,
    weight: c.weight,
    bodyType: c.bodyType,
    facialFeatures: c.facialFeatures,
    identity: c.identity,
    personality: c.personality,
    speakingStyle: c.speakingStyle,
    interests: c.interests,
    imagePath: c.imagePath,
    promptLangEn: c.promptLangEn,
    promptThemeId: c.promptThemeId,
    createdAt: c.createdAt,
    updatedAt: nowIso(),
  }));
  await db.characters.bulkPut(records);
}
