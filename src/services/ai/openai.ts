/**
 * OpenAI 提供商
 * 文本：GPT 系列
 * 图像：DALL-E / gpt-image-1
 * 依赖：openai
 */
import OpenAI from 'openai';
import type {
  AiTextProvider,
  AiTextRequest,
  AiTextResponse,
  AiImageProvider,
  AiImageRequest,
  AiImageResponse,
  AiProviderConfig,
} from './types';

function createClient(config: AiProviderConfig) {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || undefined,
    dangerouslyAllowBrowser: true,
  });
}

// ── 文本 ──────────────────────────────────────────────────────
export const openaiTextProvider: AiTextProvider = {
  async generateText(request: AiTextRequest, config: AiProviderConfig): Promise<AiTextResponse> {
    if (!config.apiKey) throw new Error('OpenAI API Key 未配置');

    const client = createClient(config);
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    const res = await client.chat.completions.create({
      model: config.model || 'gpt-4o',
      messages,
      ...(request.maxTokens ? { max_tokens: request.maxTokens } : {}),
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
    });

    const text = res.choices[0]?.message?.content ?? '';
    return { text, raw: res };
  },
};

// ── 图像 ──────────────────────────────────────────────────────
export const openaiImageProvider: AiImageProvider = {
  async generateImage(request: AiImageRequest, config: AiProviderConfig): Promise<AiImageResponse> {
    if (!config.apiKey) throw new Error('OpenAI API Key 未配置');

    const client = createClient(config);
    const model = config.model || 'dall-e-3';

    const res = await client.images.generate({
      model,
      prompt: request.prompt,
      n: request.n ?? 1,
      size:
        request.width && request.height
          ? (`${request.width}x${request.height}` as '1024x1024')
          : '1024x1024',
      response_format: 'url',
    });

    const images = (res.data ?? []).map((d) => d.url ?? '').filter(Boolean);
    return { images, raw: res };
  },
};
