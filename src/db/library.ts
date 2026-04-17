/**
 * 项目资产管理服务
 * 统一管理角色、场景、道具的 CRUD 操作
 */
import {
  loadCharactersByProject,
  saveCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  deleteCharactersByProject,
  loadCharacter,
} from './characters';
import {
  loadScenesByProject,
  saveScenes,
  createScene,
  updateScene,
  deleteScene,
  deleteScenesByProject,
  loadScene,
} from './scenes';
import {
  loadPropsByProject,
  saveProps,
  createProp,
  updateProp,
  deleteProp,
  deletePropsByProject,
  loadProp,
} from './props';
import type { Character, Scene, Prop, Library } from 'src/core/types/project';

/** 完整资产库数据 */
export interface LibraryData {
  characters: Character[];
  scenes: Scene[];
  props: Prop[];
}

// ── 加载 ─────────────────────────────────────────────────────────

/** 加载项目的完整资产库 */
export async function loadLibrary(projectId: string): Promise<LibraryData> {
  const [characters, scenes, props] = await Promise.all([
    loadCharactersByProject(projectId),
    loadScenesByProject(projectId),
    loadPropsByProject(projectId),
  ]);

  return { characters, scenes, props };
}

/** 加载单个角色 */
export async function getCharacter(characterId: string): Promise<Character | null> {
  return loadCharacter(characterId);
}

/** 加载单个场景 */
export async function getScene(sceneId: string): Promise<Scene | null> {
  return loadScene(sceneId);
}

/** 加载单个道具 */
export async function getProp(propId: string): Promise<Prop | null> {
  return loadProp(propId);
}

// ── 创建 ─────────────────────────────────────────────────────────

/** 创建角色 */
export async function addCharacter(
  projectId: string,
  data: Omit<Character, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>,
): Promise<Character> {
  return createCharacter(projectId, data);
}

/** 创建场景 */
export async function addScene(
  projectId: string,
  data: Omit<Scene, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>,
): Promise<Scene> {
  return createScene(projectId, data);
}

/** 创建道具 */
export async function addProp(
  projectId: string,
  data: Omit<Prop, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>,
): Promise<Prop> {
  return createProp(projectId, data);
}

// ── 更新 ─────────────────────────────────────────────────────────

/** 更新角色 */
export async function modifyCharacter(
  characterId: string,
  updates: Partial<Omit<Character, 'id' | 'createdAt'>>,
): Promise<void> {
  return updateCharacter(characterId, updates);
}

/** 更新场景 */
export async function modifyScene(
  sceneId: string,
  updates: Partial<Omit<Scene, 'id' | 'createdAt'>>,
): Promise<void> {
  return updateScene(sceneId, updates);
}

/** 更新道具 */
export async function modifyProp(
  propId: string,
  updates: Partial<Omit<Prop, 'id' | 'createdAt'>>,
): Promise<void> {
  return updateProp(propId, updates);
}

// ── 删除 ─────────────────────────────────────────────────────────

/** 删除角色 */
export async function removeCharacter(characterId: string): Promise<void> {
  return deleteCharacter(characterId);
}

/** 删除场景 */
export async function removeScene(sceneId: string): Promise<void> {
  return deleteScene(sceneId);
}

/** 删除道具 */
export async function removeProp(propId: string): Promise<void> {
  return deleteProp(propId);
}

// ── 批量操作 ─────────────────────────────────────────────────────

/** 保存完整资产库（批量） */
export async function saveLibrary(projectId: string, library: LibraryData): Promise<void> {
  await Promise.all([
    saveCharacters(projectId, library.characters),
    saveScenes(projectId, library.scenes),
    saveProps(projectId, library.props),
  ]);
}

/** 删除项目的所有资产 */
export async function deleteLibrary(projectId: string): Promise<void> {
  await Promise.all([
    deleteCharactersByProject(projectId),
    deleteScenesByProject(projectId),
    deletePropsByProject(projectId),
  ]);
}

/** 批量创建角色 */
export async function addCharacters(
  projectId: string,
  items: Array<Omit<Character, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>,
): Promise<Character[]> {
  const { createCharacters } = await import('./characters');
  return createCharacters(projectId, items);
}

/** 批量创建场景 */
export async function addScenes(
  projectId: string,
  items: Array<Omit<Scene, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>,
): Promise<Scene[]> {
  const { createScenes } = await import('./scenes');
  return createScenes(projectId, items);
}

/** 批量创建道具 */
export async function addProps(
  projectId: string,
  items: Array<Omit<Prop, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>,
): Promise<Prop[]> {
  const { createProps } = await import('./props');
  return createProps(projectId, items);
}

// ── 兼容性 ─────────────────────────────────────────────────────

/** 将 LibraryData 转换为旧版 Library 格式 */
export function toLegacyLibrary(library: LibraryData): Library {
  return {
    characters: library.characters,
    scenes: library.scenes,
    props: library.props,
  };
}
