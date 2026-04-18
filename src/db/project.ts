/**
 * 项目数据库 CRUD 服务
 */
import { db, type DbProjectEntry, type DbProjectManifest, type DbEpisodeManifest, type DbStoryboard } from './index';
import {
  EPISODE_MANIFEST_VERSION,
  PROJECT_MANIFEST_VERSION,
  type EpisodeManifest,
  type EpisodeRef,
  type ProjectManifest,
  type ProjectsIndexFile,
  type ProjectsIndexEntry,
} from 'src/core/types';

function nowIso(): string {
  return new Date().toISOString();
}

// ── 项目索引（projects-index） ──────────────────────────────────

/** 从数据库加载项目索引 */
export async function loadProjectEntries(): Promise<DbProjectEntry[]> {
  return db.projectEntries.orderBy('updatedAt').reverse().toArray();
}

/** 保存项目索引条目 */
export async function saveProjectEntry(entry: DbProjectEntry): Promise<void> {
  await db.projectEntries.put(entry);
}

/** 删除项目索引条目 */
export async function deleteProjectEntry(projectId: string): Promise<void> {
  await db.projectEntries.delete(projectId);
}

/** 更新项目索引中的条目 */
export async function updateProjectEntry(
  projectId: string,
  updates: Partial<DbProjectEntry>,
): Promise<void> {
  await db.projectEntries.update(projectId, updates);
}

// ── 项目清单（project.json → projectManifests） ─────────────────

/** 兼容旧接口：从项目路径加载项目清单 */
export async function loadProjectManifest(projectRoot: string): Promise<ProjectManifest> {
  const projectId = extractProjectIdFromPath(projectRoot);
  const result = await loadProjectManifestById(projectId);
  if (!result) {
    throw new Error(`项目数据不存在: ${projectRoot}`);
  }
  return result;
}

/** 从项目 ID 加载项目清单（内部使用） */
export async function loadProjectManifestById(projectId: string): Promise<ProjectManifest | null> {
  const record = await db.projectManifests.get(projectId);
  if (!record) return null;

  const result: ProjectManifest = {
    id: record.id,
    name: record.name,
    version: record.version as 1,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    description: record.description,
    synopsis: record.synopsis,
    style: record.style,
    canvasAspectRatio: record.canvasAspectRatio,
    visualStyle: record.visualStyle,
    novelGenres: record.novelGenres,
    filmAspectRatio: record.filmAspectRatio,
    episodes: record.episodes,
  };
  if (record.materialType !== undefined) result.materialType = record.materialType;
  if (record.artStyle !== undefined) result.artStyle = record.artStyle;
  if (record.moodAtmosphere !== undefined) result.moodAtmosphere = record.moodAtmosphere;
  if (record.coverImage !== undefined) result.coverImage = record.coverImage;
  if (record.language !== undefined) result.language = record.language;
  return result;
}

/** 兼容旧接口：保存项目清单 */
export async function saveProjectManifest(projectRoot: string, manifest: ProjectManifest): Promise<void> {
  const projectId = extractProjectIdFromPath(projectRoot);
  await saveProjectManifestById(projectId, manifest);
}

/** 保存项目数据（内部使用） */
export async function saveProjectManifestById(projectId: string, manifest: ProjectManifest): Promise<void> {
  const record = {
    projectId: manifest.id,
    id: manifest.id,
    name: manifest.name,
    version: manifest.version as 1,
    createdAt: manifest.createdAt,
    updatedAt: nowIso(),
    description: manifest.description,
    synopsis: manifest.synopsis,
    style: manifest.style,
    canvasAspectRatio: manifest.canvasAspectRatio,
    visualStyle: manifest.visualStyle,
    novelGenres: manifest.novelGenres,
    filmAspectRatio: manifest.filmAspectRatio,
    language: manifest.language,
    episodes: JSON.parse(JSON.stringify(manifest.episodes)),
    materialType: manifest.materialType,
    artStyle: manifest.artStyle,
    moodAtmosphere: manifest.moodAtmosphere,
    coverImage: manifest.coverImage,
  } satisfies DbProjectManifest;
  await db.projectManifests.put(record);

  // 同时更新项目索引
  await updateProjectEntry(projectId, {
    name: manifest.name,
    updatedAt: nowIso(),
  });
}

/** 创建新项目 */
export async function createProject(manifest: ProjectManifest): Promise<DbProjectEntry> {
  // 保存项目数据
  await saveProjectManifest(manifest.id, manifest);

  // 创建索引条目
  const entry: DbProjectEntry = {
    id: manifest.id,
    name: manifest.name,
    rootPath: '',
    updatedAt: nowIso(),
  };
  await saveProjectEntry(entry);

  return entry;
}

/** 删除项目（删除所有相关数据） */
export async function deleteProject(projectId: string): Promise<void> {
  // 删除项目数据
  await db.projectManifests.delete(projectId);

  // 删除所有分集数据
  await db.episodeManifests.where('projectId').equals(projectId).delete();

  // 删除所有分镜数据
  const storyboards = await db.storyboards.where('id').startsWith(projectId).toArray();
  for (const sb of storyboards) {
    if (sb.projectId === projectId) {
      await db.storyboards.delete(sb.id);
    }
  }

  // 删除所有 AI 资产
  await db.aiAssets.where('projectId').equals(projectId).delete();

  // 删除角色、场景、道具
  await db.characters.where('projectId').equals(projectId).delete();
  await db.scenes.where('projectId').equals(projectId).delete();
  await db.props.where('projectId').equals(projectId).delete();

  // 删除索引条目
  await deleteProjectEntry(projectId);
}

/** 更新项目基本字段 */
export async function updateProject(
  projectId: string,
  updates: Partial<Pick<ProjectManifest, 'name' | 'description' | 'canvasAspectRatio' | 'visualStyle' | 'materialType' | 'artStyle' | 'moodAtmosphere' | 'language' | 'novelGenres' | 'filmAspectRatio'>>,
): Promise<void> {
  const current = await loadProjectManifest(projectId);
  if (!current) return;

  await saveProjectManifest(projectId, {
    ...current,
    ...updates,
    updatedAt: nowIso(),
  });
}

// ── 分集数据（episode.json → episodeManifests） ─────────────────

/** 从路径提取项目 ID */
function extractProjectIdFromPath(path: string): string {
  const match = path.match(/proj_(\d+)/);
  return match ? match[0] : path;
}

/** 加载分集数据 */
export async function loadEpisodeManifest(episodeId: string): Promise<EpisodeManifest | null> {
  const record = await db.episodeManifests.get(episodeId);
  if (!record) return null;

  const result: EpisodeManifest = {
    id: record.episodeId,
    projectId: record.projectId,
    version: record.version as EpisodeManifest['version'],
    title: record.title,
    order: record.order,
    script: record.script,
    updatedAt: record.updatedAt,
  };
  if (record.storyboardId !== undefined) result.storyboardId = record.storyboardId;
  if (record.selectedCharacterIds !== undefined) result.selectedCharacterIds = record.selectedCharacterIds;
  if (record.aiInputText !== undefined) result.aiInputText = record.aiInputText;
  if (record.aiPromptThemeId !== undefined) result.aiPromptThemeId = record.aiPromptThemeId;
  return result;
}

/** 加载项目的所有分集 */
export async function loadEpisodesByProject(projectId: string): Promise<DbEpisodeManifest[]> {
  return db.episodeManifests.where('projectId').equals(projectId).toArray();
}

/** 兼容旧接口：从项目路径和分集文件夹名加载分集数据 */
export async function loadEpisodeManifestFromPath(
  projectRoot: string,
  episodeFolder: string,
): Promise<EpisodeManifest> {
  const projectId = extractProjectIdFromPath(projectRoot);
  const episodeId = `${projectId}_${episodeFolder}`;
  const result = await loadEpisodeManifest(episodeId);

  // 分集记录不存在时，从项目 manifest 中的 episodeRef 重建分集数据
  if (!result) {
    try {
      const manifest = await loadProjectManifestById(projectId);
      if (manifest) {
        const episodeRef = manifest.episodes.find((ep) => ep.folder === episodeFolder);
        if (episodeRef) {
          const fallbackEpisode: EpisodeManifest = {
            id: episodeRef.id,
            projectId,
            version: EPISODE_MANIFEST_VERSION,
            title: episodeRef.title,
            order: episodeRef.order,
            script: [{ id: crypto.randomUUID(), heading: '第一场', body: '' }],
            updatedAt: episodeRef.updatedAt,
          };
          await saveEpisodeManifest(episodeId, fallbackEpisode);
          return fallbackEpisode;
        }
      }
    } catch {
      // ignore errors during fallback
    }
    throw new Error(`分集数据不存在: ${projectRoot}/episodes/${episodeFolder}`);
  }
  return result;
}

/** 兼容旧接口：从项目路径和分集文件夹名保存分集数据 */
export async function saveEpisodeManifestFromPath(
  projectRoot: string,
  episodeFolder: string,
  episode: EpisodeManifest,
): Promise<void> {
  const projectId = extractProjectIdFromPath(projectRoot);
  const episodeId = `${projectId}_${episodeFolder}`;
  await saveEpisodeManifest(episodeId, episode);
}

/** 保存分集数据 */
export async function saveEpisodeManifest(episodeId: string, episode: EpisodeManifest): Promise<void> {
  const record: DbEpisodeManifest = {
    episodeId: episode.id,
    projectId: episode.projectId,
    version: episode.version as 1,
    title: episode.title,
    order: episode.order,
    script: JSON.parse(JSON.stringify(episode.script)),
    storyboardId: episode.storyboardId,
    selectedCharacterIds: episode.selectedCharacterIds
      ? JSON.parse(JSON.stringify(episode.selectedCharacterIds))
      : undefined,
    aiInputText: episode.aiInputText,
    aiPromptThemeId: episode.aiPromptThemeId,
    updatedAt: nowIso(),
  };
  await db.episodeManifests.put(record);
}

/** 创建新分集 */
export async function createEpisode(episode: EpisodeManifest): Promise<void> {
  await saveEpisodeManifest(episode.id, episode);
}

/** 删除分集 */
export async function deleteEpisode(episodeId: string): Promise<void> {
  // 删除分集数据
  await db.episodeManifests.delete(episodeId);

  // 删除关联的分镜数据
  await db.storyboards.where('id').equals(episodeId).delete();
}

/** 更新分集标题 */
export async function updateEpisodeTitle(episodeId: string, title: string): Promise<void> {
  const episode = await loadEpisodeManifest(episodeId);
  if (!episode) return;

  episode.title = title;
  episode.updatedAt = nowIso();
  await saveEpisodeManifest(episodeId, episode);
}

/** 更新分集剧本 */
export async function updateEpisodeScript(
  episodeId: string,
  script: EpisodeManifest['script'],
): Promise<void> {
  const episode = await loadEpisodeManifest(episodeId);
  if (!episode) return;

  episode.script = script;
  episode.updatedAt = nowIso();
  await saveEpisodeManifest(episodeId, episode);
}

/** 更新分集的 AI 生成故事数据 */
export async function updateEpisodeAiStoryData(
  episodeId: string,
  aiInputText: string,
  aiPromptThemeId: string,
): Promise<void> {
  const episode = await loadEpisodeManifest(episodeId);
  if (!episode) return;

  episode.aiInputText = aiInputText;
  episode.aiPromptThemeId = aiPromptThemeId;
  episode.updatedAt = nowIso();
  await saveEpisodeManifest(episodeId, episode);
}

// ── 分镜数据 ─────────────────────────────────────────────────────

/** 加载分镜数据 */
export async function loadStoryboard(storyboardId: string): Promise<DbStoryboard | null> {
  const record = await db.storyboards.get(storyboardId);
  return record ?? null;
}

/** 加载分集的分镜数据 */
export async function loadStoryboardByEpisode(episodeId: string): Promise<DbStoryboard | null> {
  const record = await db.storyboards.where('episodeId').equals(episodeId).first();
  return record ?? null;
}

/** 保存分镜数据 */
export async function saveStoryboard(storyboard: DbStoryboard): Promise<void> {
  await db.storyboards.put({
    ...storyboard,
    updatedAt: nowIso(),
  });
}

/** 创建新分镜 */
export async function createStoryboard(storyboard: DbStoryboard): Promise<void> {
  await saveStoryboard(storyboard);
}

/** 删除分镜 */
export async function deleteStoryboard(storyboardId: string): Promise<void> {
  await db.storyboards.delete(storyboardId);
}

// ── 批量操作 ─────────────────────────────────────────────────────

/** 清空所有项目数据（用于重置） */
export async function clearAllProjectData(): Promise<void> {
  await db.projectEntries.clear();
  await db.projectManifests.clear();
  await db.episodeManifests.clear();
  await db.storyboards.clear();
  await db.aiAssets.clear();
}

/** 导出所有项目数据（用于备份） */
export async function exportAllProjectData(): Promise<{
  projectEntries: DbProjectEntry[];
  projectManifests: DbProjectManifest[];
  episodeManifests: DbEpisodeManifest[];
  storyboards: DbStoryboard[];
}> {
  const [projectEntries, projectManifests, episodeManifests, storyboards] = await Promise.all([
    db.projectEntries.toArray(),
    db.projectManifests.toArray(),
    db.episodeManifests.toArray(),
    db.storyboards.toArray(),
  ]);
  return { projectEntries, projectManifests, episodeManifests, storyboards };
}

/** 导入项目数据（用于恢复备份） */
export async function importProjectData(data: {
  projectEntries: DbProjectEntry[];
  projectManifests: DbProjectManifest[];
  episodeManifests: DbEpisodeManifest[];
  storyboards: DbStoryboard[];
}): Promise<void> {
  await db.transaction('rw', [db.projectEntries, db.projectManifests, db.episodeManifests, db.storyboards], async () => {
    await db.projectEntries.bulkPut(data.projectEntries);
    await db.projectManifests.bulkPut(data.projectManifests);
    await db.episodeManifests.bulkPut(data.episodeManifests);
    await db.storyboards.bulkPut(data.storyboards);
  });
}

// ── 项目索引（ProjectsIndex） ─────────────────────────────────────

export interface CreateProjectInput {
  name: string;
  description: string;
  canvasAspectRatio: string;
  visualStyle: string;
  materialType?: string;
  artStyle?: string;
  moodAtmosphere?: string;
  language?: 'en' | 'zh';
  novelGenres: string[];
  filmAspectRatio: string;
  parentDir?: string;
  /** 封面图片路径（内置封面或上传后的相对路径） */
  coverImage?: string;
}

/** 从数据库加载项目索引 */
export async function loadProjectsIndex(): Promise<ProjectsIndexFile> {
  const entries = await loadProjectEntries();
  return {
    version: 1,
    projects: entries.map((e) => ({
      id: e.id,
      name: e.name,
      rootPath: e.rootPath,
      updatedAt: e.updatedAt,
    })),
  };
}

/** 保存项目索引到数据库 */
export async function saveProjectsIndex(index: ProjectsIndexFile): Promise<void> {
  for (const entry of index.projects) {
    await saveProjectEntry({
      id: entry.id,
      name: entry.name,
      rootPath: entry.rootPath,
      updatedAt: entry.updatedAt,
    });
  }
}

/** 扫描 projects 文件夹并重建索引（仅数据库索引，不再扫描旧 JSON） */
export async function scanAndRebuildProjectsIndex(): Promise<ProjectsIndexFile> {
  const entries = await loadProjectEntries();
  entries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return { version: 1, projects: entries };
}

/** 在数据库中按路径查找项目 */
export async function findProjectEntryByRootPath(rootPath: string): Promise<DbProjectEntry | undefined> {
  const entries = await loadProjectEntries();
  return entries.find((e) => e.rootPath === rootPath);
}

// ── 项目 CRUD（文件系统操作层） ────────────────────────────────────

/** 创建项目 */
export async function createProjectOnDisk(input: CreateProjectInput): Promise<ProjectsIndexEntry> {
  const { requireElectronApi } = await import('src/services/native-fs');
  const { getProjectsDataRoot, getProjectsParentPath } = await import('src/services/app-paths');
  const { useSettingsStore } = await import('src/stores/settings-store');

  const api = requireElectronApi();
  const timestamp = Date.now();
  const id = `proj_${timestamp}`;
  const slug = id;

  let baseParent: string;
  if (input.parentDir) {
    baseParent = await getProjectsParentPath(input.parentDir);
  } else {
    const settings = useSettingsStore();
    const dataRoot = await getProjectsDataRoot(settings.settings.projectsRootPath);
    baseParent = await api.pathJoin(dataRoot, 'projects');
  }

  await api.fsEnsureDir(baseParent);
  const projectRoot = await api.pathJoin(baseParent, slug);
  if (await api.fsExists(projectRoot)) {
    throw new Error('目标目录已存在，请更换名称或路径。');
  }
  await api.fsEnsureDir(projectRoot);

  const episodeFolder = 'ep-001';
  // 数据库主键使用 projectId_folder 格式，与 loadEpisodeManifestFromPath 保持一致
  const episodeId = `${id}_${episodeFolder}`;
  const episodeRef: EpisodeRef = {
    id: episodeId,
    title: '第 1 集',
    episodeNumber: '001',
    order: 1,
    folder: episodeFolder,
    updatedAt: nowIso(),
  };

  const manifest: ProjectManifest = {
    id,
    name: input.name,
    version: PROJECT_MANIFEST_VERSION,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    description: input.description,
    synopsis: '',
    style: '',
    canvasAspectRatio: input.canvasAspectRatio,
    visualStyle: input.visualStyle,
    novelGenres: [...input.novelGenres],
    filmAspectRatio: input.filmAspectRatio,
    episodes: [episodeRef],
    language: (input.language as 'en' | 'zh') || 'zh',
  };
  if (input.materialType !== undefined) manifest.materialType = input.materialType;
  if (input.artStyle !== undefined) manifest.artStyle = input.artStyle;
  if (input.moodAtmosphere !== undefined) manifest.moodAtmosphere = input.moodAtmosphere;
  if (input.coverImage !== undefined) manifest.coverImage = input.coverImage;

  const episode: EpisodeManifest = {
    id: episodeId,
    projectId: id,
    version: EPISODE_MANIFEST_VERSION,
    title: episodeRef.title,
    order: 1,
    script: [{ id: crypto.randomUUID(), heading: '第一场', body: '' }],
    updatedAt: nowIso(),
  };

  await api.fsEnsureDir(await api.pathJoin(projectRoot, 'assets', 'characters'));
  await api.fsEnsureDir(await api.pathJoin(projectRoot, 'assets', 'scenes'));
  await api.fsEnsureDir(await api.pathJoin(projectRoot, 'assets', 'props'));
  await api.fsEnsureDir(await api.pathJoin(projectRoot, 'assets', 'videos'));
  await api.fsEnsureDir(await api.pathJoin(projectRoot, 'assets', 'audio'));
  await api.fsEnsureDir(await api.pathJoin(projectRoot, 'episodes', episodeFolder));

  await saveProjectManifest(projectRoot, manifest);
  await saveEpisodeManifestFromPath(projectRoot, episodeFolder, episode);

  // 验证分集数据已正确保存
  const verify = await loadEpisodeManifest(episodeId);
  if (!verify) {
    throw new Error('分集数据保存失败，请重试');
  }

  const entry: ProjectsIndexEntry = {
    id,
    name: input.name,
    rootPath: projectRoot,
    updatedAt: nowIso(),
  };

  const index = await loadProjectsIndex();
  index.projects = [entry, ...index.projects.filter((p) => p.id !== id)];
  await saveProjectsIndex(index);

  return entry;
}

/** 更新项目 */
export async function updateProjectOnDisk(projectId: string, input: CreateProjectInput): Promise<void> {
  const index = await loadProjectsIndex();
  const entry = index.projects.find((p) => p.id === projectId);
  if (!entry) {
    throw new Error('未找到项目，请刷新列表后重试。');
  }

  const manifest = await loadProjectManifest(entry.rootPath);
  manifest.name = input.name;
  manifest.description = input.description;
  manifest.canvasAspectRatio = input.canvasAspectRatio;
  manifest.visualStyle = input.visualStyle;

  if (input.materialType !== undefined) {
    manifest.materialType = input.materialType;
  } else {
    delete manifest.materialType;
  }
  if (input.artStyle !== undefined) {
    manifest.artStyle = input.artStyle;
  } else {
    delete manifest.artStyle;
  }
  if (input.moodAtmosphere !== undefined) {
    manifest.moodAtmosphere = input.moodAtmosphere;
  } else {
    delete manifest.moodAtmosphere;
  }
  if (input.coverImage !== undefined) {
    manifest.coverImage = input.coverImage;
  } else {
    delete manifest.coverImage;
  }
  if (input.language !== undefined) {
    manifest.language = input.language;
  }
  manifest.novelGenres = [...input.novelGenres];
  manifest.filmAspectRatio = input.filmAspectRatio;

  await saveProjectManifest(entry.rootPath, manifest);
  entry.name = input.name;
  entry.updatedAt = nowIso();
  await saveProjectsIndex(index);
}

/** 删除项目 */
export async function deleteProjectOnDisk(projectId: string): Promise<void> {
  const { requireElectronApi } = await import('src/services/native-fs');
  const api = requireElectronApi();
  const index = await loadProjectsIndex();
  const entry = index.projects.find((p) => p.id === projectId);
  if (!entry) {
    throw new Error('未找到项目，请刷新列表后重试。');
  }

  if (await api.fsExists(entry.rootPath)) {
    await api.fsRemove(entry.rootPath, { recursive: true });
  }

  await deleteProject(projectId);

  index.projects = index.projects.filter((p) => p.id !== projectId);
  await saveProjectsIndex(index);
}
