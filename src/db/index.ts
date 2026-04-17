/**
 * Dexie 数据库架构定义
 * 使用 Dexie.js 作为本地数据库，替代原来的 JSON 文件存储
 */
import Dexie, { type Table } from 'dexie';

/** 应用设置表（单行） */
export interface DbSettings {
  id: string;
  /** 主题模式 */
  theme: 'light' | 'dark' | 'auto';
  /** 字体大小预设 */
  fontSizePreset: 'sm' | 'md' | 'lg';
  /** 项目根目录 */
  projectsRootPath: string | null;
  /** 启动时恢复上次项目 */
  reopenLastProjectOnStartup: boolean;
  /** 提示词设置 */
  prompt: {
    /** 用户自建提示词主题 */
    userThemes: Array<{
      id: string;
      label: string;
      prompts: Array<{
        id: string;
        stage: string;
        title: string;
        contentZh: string;
        contentEn: string;
        apiType?: string;
      }>;
    }>;
    /** 内置主题中文提示词覆盖 */
    builtinThemeOverridesZh: Record<string, Record<string, string>>;
    /** 内置主题英文提示词覆盖 */
    builtinThemeOverridesEn: Record<string, Record<string, string>>;
    /** 内置主题新增提示词（中文） */
    builtinThemeNewPromptsZh: Record<string, Array<{
      id: string;
      stage: string;
      title: string;
      contentZh: string;
      apiType?: string;
    }>>;
    /** 内置主题新增提示词（英文） */
    builtinThemeNewPromptsEn: Record<string, Array<{
      id: string;
      stage: string;
      title: string;
      contentEn: string;
      apiType?: string;
    }>>;
    /** 提示词绑定的 API 配置名称 */
    promptApiBindings: Record<string, string>;
    /** 提示词 API 绑定的锁定状态 */
    promptApiLocked: Record<string, boolean>;
    /** 提示词语言切换状态（false=中文, true=英文） */
    promptLangState: Record<string, boolean>;
    /** 分类提示词 */
    categories: Record<string, {
      enabled: boolean;
      contentZh: string;
      contentEn: string;
    }>;
    /** 自定义提示词 */
    customPrompts: Array<{
      id: string;
      title: string;
      contentZh: string;
      contentEn: string;
      apiType: string;
    }>;
  };
  /** API 配置设置 */
  api: {
    /** 自定义 API 配置列表 */
    customConfigs: Array<{
      name: string;
      serviceType: string;
      provider: string;
      model: string;
      apiKey: string;
      baseUrl?: string;
      videoDuration?: number;
      systemPrompt?: string;
    }>;
  };
  updatedAt: string;
}

/** 项目索引表 */
export interface DbProjectEntry {
  id: string;
  name: string;
  rootPath: string;
  updatedAt: string;
}

/** 项目完整数据表（包含 manifest 所有字段） */
export interface DbProjectManifest {
  projectId: string;
  id: string;
  name: string;
  version: 1;
  createdAt: string;
  updatedAt: string;
  description: string;
  synopsis: string;
  style: string;
  canvasAspectRatio: string;
  visualStyle: string;
  novelGenres: string[];
  filmAspectRatio: string;
  language: 'en' | 'zh' | undefined;
  materialType: string | undefined;
  artStyle: string | undefined;
  moodAtmosphere: string | undefined;
  /** 封面图片路径 */
  coverImage: string | undefined;
  /** 剧集引用列表 */
  episodes: Array<{
    id: string;
    title: string;
    episodeNumber: string;
    order: number;
    folder: string;
    updatedAt: string;
  }>;
}

/** 分集数据表 */
export interface DbEpisodeManifest {
  episodeId: string;
  projectId: string;
  version: 1;
  title: string;
  order: number;
  /** 剧本块列表 */
  script: Array<{
    id: string;
    heading?: string;
    body: string;
  }>;
  /** 分镜 ID */
  storyboardId: string | undefined;
  /** 选中的角色 ID 列表 */
  selectedCharacterIds: string[] | undefined;
  /** AI 生成故事输入框的文本 */
  aiInputText: string | undefined;
  /** AI 生成故事选择的提示词套件ID */
  aiPromptThemeId: string | undefined;
  updatedAt: string;
}

/** 用户自建提示词主题表 */
export interface DbUserPromptTheme {
  id: string;
  label: string;
  prompts: Array<{
    id: string;
    stage: string;
    title: string;
    contentZh: string;
    contentEn: string;
    apiType?: string;
  }>;
}

/** 提示词覆盖数据表 */
export interface DbPromptOverrides {
  id: string;
  themeId: string;
  promptId: string;
  lang: 'zh' | 'en';
  content: string;
}

/** 分镜数据表 */
export interface DbStoryboard {
  id: string;
  projectId: string;
  episodeId: string;
  version: number;
  segments: Array<{
    id: string;
    index: number;
    title: string;
    shots: Array<{
      id: string;
      shotNumber: number;
      title: string;
      shotType: string;
      angle: string;
      time: string;
      location: string;
      sceneId?: string;
      movement: string;
      action: string;
      dialogue: string;
      result: string;
      atmosphere: string;
      emotion: string;
      duration: number;
      bgmPrompt: string;
      soundEffect: string;
      characters: string[];
      props: string[];
      isPrimary: boolean;
      /** 首帧图片路径 */
      firstFramePath?: string;
      /** 关键帧图片路径 */
      keyFramePath?: string;
      /** 尾帧图片路径 */
      lastFramePath?: string;
      /** 视频文件路径 */
      videoPath?: string;
    }>;
  }>;
  updatedAt: string;
}

/** AI 资产表（图片/视频/音频，不存储文件内容） */
export interface DbAiAsset {
  id: string;
  projectId: string;
  episodeId?: string;
  type: 'character' | 'scene' | 'prop' | 'video' | 'audio';
  name: string;
  /** 文件相对路径（相对于项目根目录的 assets 文件夹） */
  relativePath: string;
  /** 关联的资产 ID（如角色/场景/道具 ID） */
  assetId?: string;
  /** AI 模型来源 */
  model?: string;
  /** 元数据 */
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** 角色数据表 */
export interface DbCharacter {
  id: string;
  projectId: string;
  name: string;
  description: string;
  role: '主角' | '配角' | '次要角色';
  gender: string;
  age: string;
  height: string;
  weight: string;
  bodyType: string;
  facialFeatures: string;
  identity: string;
  personality: string;
  speakingStyle: string;
  interests: string;
  /** 角色图片相对路径（相对于项目根目录） */
  imagePath: string | undefined;
  /** 提示词语言状态（false=中文, true=英文） */
  promptLangEn: boolean | undefined;
  /** 当前选中的提示词套件ID */
  promptThemeId: string | undefined;
  createdAt: string;
  updatedAt: string;
}

/** 场景数据表 */
export interface DbScene {
  id: string;
  projectId: string;
  name: string;
  description: string;
  /** 场景图片相对路径（相对于项目根目录） */
  imagePath: string | undefined;
  /** 提示词语言状态（false=中文, true=英文） */
  promptLangEn: boolean | undefined;
  /** 当前选中的提示词套件ID */
  promptThemeId: string | undefined;
  createdAt: string;
  updatedAt: string;
}

/** 道具数据表 */
export interface DbProp {
  id: string;
  projectId: string;
  name: string;
  description: string;
  /** 道具图片相对路径（相对于项目根目录） */
  imagePath: string | undefined;
  /** 提示词语言状态（false=中文, true=英文） */
  promptLangEn: boolean | undefined;
  /** 当前选中的提示词套件ID */
  promptThemeId: string | undefined;
  createdAt: string;
  updatedAt: string;
}

class ItimoDatabase extends Dexie {
  settings!: Table<DbSettings, string>;
  projectEntries!: Table<DbProjectEntry, string>;
  projectManifests!: Table<DbProjectManifest, string>;
  episodeManifests!: Table<DbEpisodeManifest, string>;
  userPromptThemes!: Table<DbUserPromptTheme, string>;
  promptOverrides!: Table<DbPromptOverrides, string>;
  storyboards!: Table<DbStoryboard, string>;
  aiAssets!: Table<DbAiAsset, string>;
  characters!: Table<DbCharacter, string>;
  scenes!: Table<DbScene, string>;
  props!: Table<DbProp, string>;

  constructor() {
    super('ItimoAiDramaDB');

    this.version(1).stores({
      /** settings 表以 'app' 为唯一 key */
      settings: 'id',
      /** 项目索引：id 为主键，name 和 updatedAt 为索引 */
      projectEntries: 'id, name, updatedAt',
      /** 项目数据：projectId 为主键 */
      projectManifests: 'projectId',
      /** 分集数据：episodeId 为主键，projectId 为索引 */
      episodeManifests: 'episodeId, projectId',
      /** 用户自建主题：id 为主键 */
      userPromptThemes: 'id',
      /** 提示词覆盖：(themeId+promptId+lang) 复合唯一 */
      promptOverrides: 'id, themeId, promptId',
      /** 分镜数据：id 为主键，episodeId 为索引 */
      storyboards: 'id, episodeId',
      /** AI 资产：id 为主键，projectId 和 type 为索引 */
      aiAssets: 'id, projectId, type, assetId',
    });

    this.version(2).stores({
      settings: 'id',
      projectEntries: 'id, name, updatedAt',
      projectManifests: 'projectId',
      episodeManifests: 'episodeId, projectId',
      userPromptThemes: 'id',
      promptOverrides: 'id, themeId, promptId',
      storyboards: 'id, episodeId',
      aiAssets: 'id, projectId, type, assetId',
      /** 角色数据：id 为主键，projectId 为索引 */
      characters: 'id, projectId',
      /** 场景数据：id 为主键，projectId 为索引 */
      scenes: 'id, projectId',
      /** 道具数据：id 为主键，projectId 为索引 */
      props: 'id, projectId',
    });
  }
}

/** 数据库单例 */
export const db = new ItimoDatabase();

/** 默认设置数据 */
export const DEFAULT_DB_SETTINGS: DbSettings = {
  id: 'app',
  theme: 'auto',
  fontSizePreset: 'md',
  projectsRootPath: null,
  reopenLastProjectOnStartup: false,
  prompt: {
    userThemes: [],
    builtinThemeOverridesZh: {},
    builtinThemeOverridesEn: {},
    builtinThemeNewPromptsZh: {},
    builtinThemeNewPromptsEn: {},
    promptApiBindings: {},
    promptApiLocked: {},
    promptLangState: {},
    categories: {},
    customPrompts: [],
  },
  api: {
    customConfigs: [],
  },
  updatedAt: new Date().toISOString(),
};
