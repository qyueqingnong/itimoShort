export type AssetKind = 'character' | 'scene' | 'prop' | 'image' | 'video' | 'audio';

export interface MediaAsset {
  id: string;
  kind: AssetKind;
  name: string;
  /** Relative to project root */
  filePath: string;
  thumbnailPath?: string;
  createdAt: string;
  updatedAt: string;
  /** Optional linkage to LLM / provider metadata */
  meta?: Record<string, unknown>;
}
