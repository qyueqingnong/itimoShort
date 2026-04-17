/** Per-episode data (`episodes/<id>/episode.json`). */
export const EPISODE_MANIFEST_VERSION = 1 as const;

export interface ScriptBlock {
  id: string;
  heading?: string;
  /** Plain screenplay / novel text — editor owns formatting */
  body: string;
}

export interface EpisodeManifest {
  id: string;
  projectId: string;
  version: typeof EPISODE_MANIFEST_VERSION;
  title: string;
  order: number;
  script: ScriptBlock[];
  /** Reserved for storyboard / shot ids */
  storyboardId?: string;
  /** Selected character IDs for this episode */
  selectedCharacterIds?: string[];
  /** AI 生成故事输入框的文本 */
  aiInputText?: string;
  /** AI 生成故事选择的提示词套件ID */
  aiPromptThemeId?: string;
  updatedAt: string;
}
