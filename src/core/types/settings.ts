/** Application settings persisted to disk (Electron) or localStorage (browser dev). */

export type ThemeMode = 'light' | 'dark' | 'auto';

/** 界面字号三档（映射到 html 根字号） */
export type FontSizePreset = 'sm' | 'md' | 'lg';

export const FONT_PRESET_PX: Record<FontSizePreset, number> = {
  sm: 13,
  md: 15,
  lg: 18,
};

export type PromptCategoryKey = 'global' | 'character' | 'scene' | 'prop' | 'storyboard' | 'video';

export interface PromptCategoryBlock {
  /** 正向提示词模板（可含占位符，后续由代码替换） */
  positive: string;
  /** 后置正向（如质量词、画风，拼在主体后） */
  postPositive: string;
  negative: string;
}

export type PromptUsageType =
  | 'text'
  | 'image'
  | 'image2image'
  | 'video'
  | 'image2video'
  | 'video2video';

export interface CustomPrompt {
  id: string;
  title: string;
  usageType: PromptUsageType;
  content: string;
  tags: string;
  createdAt: string;
  updatedAt: string;
}

/** 用户自建提示词主题中的单条提示词 */
export interface UserPromptItem {
  id: string;
  stage: string;
  title: string;
  /** 该提示词使用的 API 类型：text（文本）、image（图像）、video（视频）、tts（语音） */
  apiType: 'text' | 'image' | 'video' | 'tts';
  /** 中文提示词内容 */
  contentZh: string;
  /** 英文提示词内容 */
  contentEn: string;
  createdAt: string;
  updatedAt: string;
}

/** 用户自建提示词主题 */
export interface UserPromptTheme {
  id: string;
  label: string;
  prompts: UserPromptItem[];
  createdAt: string;
}

export interface PromptSettings {
  categories: Record<PromptCategoryKey, PromptCategoryBlock>;
  customPrompts: CustomPrompt[];
  /** 用户自建的提示词主题列表 */
  userThemes?: UserPromptTheme[];
  /** 内置主题提示词的中文编辑覆盖 */
  builtinThemeOverridesZh?: Record<string, Record<string, string>>; // { themeId: { promptId: content } }
  /** 内置主题提示词的英文编辑覆盖 */
  builtinThemeOverridesEn?: Record<string, Record<string, string>>; // { themeId: { promptId: content } }
  /** 内置主题中新增的提示词（中文） */
  builtinThemeNewPromptsZh?: Record<string, UserPromptItem[]>; // { themeId: [{ id, stage, title, contentZh, contentEn, ... }] }
  /** 内置主题中新增的提示词（英文） */
  builtinThemeNewPromptsEn?: Record<string, UserPromptItem[]>; // { themeId: [{ id, stage, title, contentZh, contentEn, ... }] }
  /** 提示词绑定的 API 配置 */
  promptApiBindings?: Record<string, string>; // { promptId: apiConfigName }
  /** 提示词 API 绑定的锁定状态 */
  promptApiLocked?: Record<string, boolean>; // { promptId: isLocked }
  /** 提示词的语言切换状态（false=中文, true=英文） */
  promptLangState?: Record<string, boolean>; // { promptId: isEnglish }
}

export const PROMPT_CATEGORY_META: { key: PromptCategoryKey; label: string; caption: string }[] = [
  { key: 'global', label: '通用', caption: '未单独配置时回退到此' },
  { key: 'character', label: '角色', caption: '角色立绘、头像等' },
  { key: 'scene', label: '场景', caption: '场景背景、环境' },
  { key: 'prop', label: '道具', caption: '道具静物' },
  { key: 'storyboard', label: '分镜', caption: '分镜构图、镜头描述' },
  { key: 'video', label: '视频', caption: '图生视频、运镜' },
];

export type ApiEngineKind = 'text' | 'image' | 'video' | 'audio';

/** 单引擎连接与限流（对接 OpenAI 兼容或各厂商 REST） */
export interface ApiEngineConfig {
  /** 展示用：openai-compatible、azure、custom 等 */
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  maxConcurrency: number;
  timeoutMs: number;
}

/** 自定义 API 配置 */
export interface CustomApiConfig {
  serviceType: string;
  name: string;
  provider: string;
  model: string;
  baseUrl?: string;
  apiKey: string;
  /** 模型列表 */
  modelList?: string;
  /** 默认模型 */
  defaultModel?: string;
  /** 优先级 */
  priority?: number;
  /** 视频生成时长（秒），仅当 serviceType 为 'video' 时有效 */
  videoDuration?: number;
  /** 最大并发数，1-20 */
  maxConcurrency?: number;
}

export interface ApiSettings {
  text: ApiEngineConfig;
  image: ApiEngineConfig;
  video: ApiEngineConfig;
  audio: ApiEngineConfig;
  customConfigs?: CustomApiConfig[];
}

export interface AppSettings {
  theme: ThemeMode;
  /** 界面字号：小号 / 中号 / 大号 */
  fontSizePreset: FontSizePreset;
  /** 项目和资源的根目录路径，包含 itimoAiDrama 文件夹 */
  projectsRootPath: string | null;
  /** 启动时尝试恢复上次打开的项目（需后续与 workspace 联动） */
  reopenLastProjectOnStartup: boolean;

  prompt: PromptSettings;
  api: ApiSettings;
}

function emptyPromptBlock(): PromptCategoryBlock {
  return { positive: '', postPositive: '', negative: '' };
}

function defaultApiEngine(): ApiEngineConfig {
  return {
    provider: 'openai-compatible',
    baseUrl: '',
    apiKey: '',
    model: '',
    maxConcurrency: 1,
    timeoutMs: 300000, // 5 minutes in milliseconds
  };
}

export function createDefaultPromptSettings(): PromptSettings {
  const categories = {} as Record<PromptCategoryKey, PromptCategoryBlock>;
  for (const { key } of PROMPT_CATEGORY_META) {
    categories[key] = emptyPromptBlock();
  }
  return {
    categories,
    customPrompts: [],
    builtinThemeOverridesZh: {},
    builtinThemeOverridesEn: {},
    builtinThemeNewPromptsZh: {},
    builtinThemeNewPromptsEn: {},
  };
}

export function createDefaultApiSettings(): ApiSettings {
  return {
    text: { ...defaultApiEngine(), provider: 'openai-compatible', model: 'gpt-4o-mini' },
    image: { ...defaultApiEngine(), provider: 'openai-compatible', model: 'dall-e-3' },
    video: { ...defaultApiEngine(), provider: 'custom', model: '' },
    audio: { ...defaultApiEngine(), provider: 'openai-compatible', model: 'tts-1' },
    customConfigs: [],
  };
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'light',
  fontSizePreset: 'md',
  projectsRootPath: null,
  reopenLastProjectOnStartup: false,
  prompt: createDefaultPromptSettings(),
  api: createDefaultApiSettings(),
};
