/**
 * Anthropic Claude 提供商
 * 文本：Claude 3.x 系列
 * 依赖：@anthropic-ai/sdk
 */
import Anthropic from '@anthropic-ai/sdk';
import type { AiTextProvider, AiTextRequest, AiTextResponse, AiProviderConfig } from './types';

export const claudeTextProvider: AiTextProvider = {
  async generateText(request: AiTextRequest, config: AiProviderConfig): Promise<AiTextResponse> {
    if (!config.apiKey) throw new Error('Claude API Key 未配置');

    const client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || undefined,
      dangerouslyAllowBrowser: true,
    });

    const res = await client.messages.create({
      model: config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: request.maxTokens ?? 4096,
      ...(request.systemPrompt ? { system: request.systemPrompt } : {}),
      messages: [{ role: 'user', content: request.prompt }],
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
    });

    const text = res.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    return { text, raw: res };
  },
};
