/**
 * 页面与提示词ID的绑定映射
 * 用于指定每个生成页面使用哪个提示词
 * 
 * 支持从数据库和 settings store 两种方式读取配置
 */

import { useSettingsStore } from 'src/stores/settings-store';
import { PROMPT_THEMES } from 'src/services/prompt';

/** 页面类型枚举 */
export enum PageType {
  CHARACTER = 'character',
  PROP = 'prop',
  SCENE = 'scene',
  STORY = 'story',
  SCRIPT = 'script',
}

/** 功能类型枚举 */
export enum FeatureType {
  IMAGE_GENERATION = 'image_generation', // 图片生成
  EXTRACTION = 'extraction', // AI提取（文本）
  STORYBOARD = 'storyboard', // 分镜生成
  EXPAND = 'expand', // 剧本扩写
}

/** 故事页功能类型枚举 */
export enum StoryFeatureType {
  GENERATE = 'generate', // 故事生成
  EXPAND = 'expand', // 故事扩写
  POLISH = 'polish', // 故事润色
}

/** 图片生成提示词ID后缀（不含主题前缀） */
export const PAGE_PROMPT_ID_SUFFIX: Record<PageType, string> = {
  [PageType.CHARACTER]: 'character_image_prompt',
  [PageType.PROP]: 'prop_image_prompt',
  [PageType.SCENE]: 'scene_image_prompt',
  [PageType.STORY]: 'story_image_prompt',
  [PageType.SCRIPT]: 'script_image_prompt',
};

/** AI提取提示词ID后缀（不含主题前缀） */
export const EXTRACTION_PROMPT_ID_SUFFIX: Record<PageType, string> = {
  [PageType.CHARACTER]: 'character_extraction',
  [PageType.PROP]: 'prop_extraction',
  [PageType.SCENE]: 'scene_extraction',
  [PageType.STORY]: 'story_extract',
  [PageType.SCRIPT]: 'script_extract',
};

/** 剧本分镜提示词ID后缀 */
export const SCRIPT_STORYBOARD_PROMPT_SUFFIX = 'script_storyboard';

/** 剧本扩写提示词ID后缀 */
export const SCRIPT_EXPAND_PROMPT_SUFFIX = 'script_expand';

/** 故事生成提示词ID后缀 */
export const STORY_PROMPT_ID_SUFFIX: Record<StoryFeatureType, string> = {
  [StoryFeatureType.GENERATE]: 'story_generate',
  [StoryFeatureType.EXPAND]: 'story_expand',
  [StoryFeatureType.POLISH]: 'story_polish',
};

/**
 * 根据主题ID、页面类型和功能类型获取完整的提示词ID
 */
export function getPromptIdForPage(
  themeId: string,
  pageType: PageType,
  featureType: FeatureType = FeatureType.IMAGE_GENERATION,
): string {
  const suffix =
    featureType === FeatureType.EXTRACTION
      ? EXTRACTION_PROMPT_ID_SUFFIX[pageType]
      : PAGE_PROMPT_ID_SUFFIX[pageType];

  const prefix = themeId.replace('promp_', '');
  return `${prefix}_${suffix}`;
}

/**
 * 根据主题ID和故事功能类型获取完整的提示词ID
 */
export function getStoryPromptId(themeId: string, featureType: StoryFeatureType): string {
  const suffix = STORY_PROMPT_ID_SUFFIX[featureType];
  const prefix = themeId.replace('promp_', '');
  return `${prefix}_${suffix}`;
}

/**
 * 获取剧本拆分（分镜生成）的提示词ID
 */
export function getScriptStoryboardPromptId(themeId: string): string {
  const prefix = themeId.replace('promp_', '');
  return `${prefix}_${SCRIPT_STORYBOARD_PROMPT_SUFFIX}`;
}

/**
 * 获取剧本扩写的提示词ID
 */
export function getScriptExpandPromptId(themeId: string): string {
  const prefix = themeId.replace('promp_', '');
  return `${prefix}_${SCRIPT_EXPAND_PROMPT_SUFFIX}`;
}

/**
 * 获取提示词内容（支持语言切换）
 * @param promptId 提示词ID
 * @param themeId 主题ID
 * @param isEnglish 是否使用英文版本
 */
export function getPromptContent(promptId: string, themeId: string, isEnglish: boolean = false): string | null {
  const settings = useSettingsStore();

  // 获取对应语言的覆盖内容
  const overridesKey = isEnglish ? 'builtinThemeOverridesEn' : 'builtinThemeOverridesZh';
  const overrides = settings.settings.prompt[overridesKey]?.[themeId];
  if (overrides && overrides[promptId]) {
    return overrides[promptId];
  }

  // 从内置主题中查找
  for (const theme of PROMPT_THEMES) {
    if (theme.id === themeId) {
      const prompt = theme.prompts.find((p) => p.id === promptId);
      if (prompt) {
        return isEnglish ? prompt.contentEn : prompt.contentZh;
      }
    }
  }

  // 从用户自建主题中查找
  const userThemes = settings.settings.prompt.userThemes ?? [];
  for (const theme of userThemes) {
    if (theme.id === themeId) {
      const prompt = theme.prompts.find((p) => p.id === promptId);
      if (prompt) {
        return isEnglish ? prompt.contentEn : prompt.contentZh;
      }
    }
  }

  return null;
}

/**
 * 获取提示词绑定的 API 配置名称
 */
export function getPromptApiBinding(promptId: string): string {
  const settings = useSettingsStore();
  return settings.settings.prompt.promptApiBindings?.[promptId] ?? '';
}

/**
 * 设置提示词绑定的 API 配置
 */
export function setPromptApiBinding(promptId: string, apiConfigName: string): void {
  const settings = useSettingsStore();
  if (!settings.settings.prompt.promptApiBindings) {
    settings.settings.prompt.promptApiBindings = {};
  }
  settings.settings.prompt.promptApiBindings[promptId] = apiConfigName;
  // 立即保存到数据库
  void settings.save();
}

/**
 * 获取提示词 API 绑定的锁定状态
 */
export function isPromptApiLocked(promptId: string): boolean {
  const settings = useSettingsStore();
  return settings.settings.prompt.promptApiLocked?.[promptId] ?? false;
}

/**
 * 设置提示词 API 绑定的锁定状态
 */
export function setPromptApiLocked(promptId: string, locked: boolean): void {
  const settings = useSettingsStore();
  if (!settings.settings.prompt.promptApiLocked) {
    settings.settings.prompt.promptApiLocked = {};
  }
  settings.settings.prompt.promptApiLocked[promptId] = locked;
  void settings.save();
}

/**
 * 获取提示词的语言切换状态（false=中文, true=英文）
 */
export function getPromptLang(promptId: string): boolean {
  const settings = useSettingsStore();
  return settings.settings.prompt.promptLangState?.[promptId] ?? false;
}

/**
 * 设置提示词的语言切换状态
 */
export function setPromptLang(promptId: string, isEnglish: boolean): void {
  const settings = useSettingsStore();
  if (!settings.settings.prompt.promptLangState) {
    settings.settings.prompt.promptLangState = {};
  }
  settings.settings.prompt.promptLangState[promptId] = isEnglish;
  void settings.save();
}

/**
 * 获取提示词套件选项（内置 + 用户自建）
 */
export function getPromptThemeOptions(): Array<{ id: string; label: string }> {
  const builtinThemes = PROMPT_THEMES.map((t) => ({ id: t.id, label: t.label }));
  const settings = useSettingsStore();
  const userThemes = (settings.settings.prompt.userThemes ?? []).map((t) => ({
    id: t.id,
    label: t.label,
  }));
  return [...builtinThemes, ...userThemes];
}

/**
 * 获取默认提示词套件ID
 */
export function getDefaultPromptThemeId(): string {
  return PROMPT_THEMES[0]?.id ?? '';
}

/**
 * 获取 API 配置绑定的视频生成时长（秒）
 */
export function getVideoDurationFromBinding(promptId: string): number | null {
  const apiConfigName = getPromptApiBinding(promptId);
  if (!apiConfigName) return null;

  const settings = useSettingsStore();
  const configs = settings.settings.api.customConfigs ?? [];
  const config = configs.find((c) => c.name === apiConfigName);

  if (config && config.serviceType === 'video' && config.videoDuration) {
    return config.videoDuration;
  }

  return null;
}

/**
 * 根据 API 配置名称获取视频生成时长（秒）
 */
export function getVideoDurationByConfigName(apiConfigName: string): number | null {
  if (!apiConfigName) return null;

  const settings = useSettingsStore();
  const configs = settings.settings.api.customConfigs ?? [];
  const config = configs.find((c) => c.name === apiConfigName);

  if (config && config.serviceType === 'video' && config.videoDuration) {
    return config.videoDuration;
  }

  return null;
}
