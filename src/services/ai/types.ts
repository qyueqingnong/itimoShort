/** AI 服务统一类型定义 */

// ── 通用配置 ──────────────────────────────────────────────────
export interface AiProviderConfig {
  apiKey: string;
  model?: string | undefined;
  baseUrl?: string | undefined;
}

// ── 文本生成 ──────────────────────────────────────────────────
export interface AiTextRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AiTextResponse {
  text: string;
  raw?: unknown;
}

export interface AiTextProvider {
  generateText(request: AiTextRequest, config: AiProviderConfig): Promise<AiTextResponse>;
}

// ── 图像生成 ──────────────────────────────────────────────────
export interface AiImageRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  /** 生成数量，默认 1 */
  n?: number;
}

export interface AiImageResponse {
  /** 图片 URL 或 base64 列表 */
  images: string[];
  raw?: unknown;
}

export interface AiImageProvider {
  generateImage(request: AiImageRequest, config: AiProviderConfig): Promise<AiImageResponse>;
}

// ── 文字转语音 ────────────────────────────────────────────────
export interface AiTtsRequest {
  text: string;
  /** 语音角色/声音 ID */
  voice?: string;
  speed?: number;
}

export interface AiTtsResponse {
  /** 返回 ArrayBuffer，调用方自行写文件或播放 */
  audio: ArrayBuffer;
  raw?: unknown;
}

export interface AiTtsProvider {
  synthesize(request: AiTtsRequest, config: AiProviderConfig): Promise<AiTtsResponse>;
}
