/** 提示词阶段标签 */
export type PromptStage =
  | 'story'
  | 'character'
  | 'prop'
  | 'scene'
  | 'script'
  | 'storyboard'
  | 'video';

export const PROMPT_STAGE_LABELS: Record<PromptStage, string> = {
  story: '故事',
  character: '角色',
  prop: '道具',
  scene: '场景',
  script: '剧本',
  storyboard: '分镜',
  video: '视频',
};

export const PROMPT_STAGES: PromptStage[] = [
  'story',
  'character',
  'prop',
  'scene',
  'script',
  'storyboard',
  'video',
];

/** 单条提示词 */
export interface PromptItem {
  id: string;
  stage: PromptStage;
  title: string;
  /** 中文提示词内容 */
  contentZh: string;
  /** 英文提示词内容 */
  contentEn: string;
  /** 该提示词使用的 API 类型：text（文本）、image（图像）、video（视频）、tts（语音） */
  apiType: 'text' | 'image' | 'video' | 'tts';
}

/** 获取当前激活语言的提示词内容 */
export function getPromptContent(item: PromptItem, isEnglish: boolean): string {
  return isEnglish ? item.contentEn : item.contentZh;
}

/** 一套提示词主题 */
export interface PromptTheme {
  id: string;
  label: string;
  description: string;
  prompts: PromptItem[];
}
