/** Left-rail production steps (order matters for UX + automation). */
export const PRODUCTION_STEPS = [
  { id: 'story', label: '故事', icon: 'auto_stories' },
  { id: 'characters', label: '角色', icon: 'face' },
  { id: 'props', label: '道具', icon: 'inventory_2' },
  { id: 'scenes', label: '场景', icon: 'landscape' },
  { id: 'script', label: '剧本', icon: 'description' },
  { id: 'storyboard', label: '分镜', icon: 'view_quilt' },
  { id: 'video', label: '视频', icon: 'movie' },
] as const;

export type ProductionStepId = (typeof PRODUCTION_STEPS)[number]['id'];

export interface StoryboardShot {
  id: string;
  index: number;
  /** e.g. 全景 / 中景 */
  shotScale?: string;
  /** e.g. 推 / 摇 */
  cameraMove?: string;
  /** 分镜剧本文本（可二次编辑） */
  scriptText?: string;
  dialogue?: string;
  visualPrompt?: string;
  negativePrompt?: string;
  /** Linked generated still / clip ids */
  frameAssetId?: string;
  clipAssetId?: string;
}

export interface StoryboardManifest {
  id: string;
  episodeId: string;
  projectId: string;
  shots: StoryboardShot[];
  updatedAt: string;
}
