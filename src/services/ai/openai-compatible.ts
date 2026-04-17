/**
 * OpenAI 兼容接口通用提供商
 * 覆盖：DeepSeek / Qwen / GLM / MiniMax / Grok / 本地(Ollama等) / 自定义
 * 依赖：openai（复用同一个包，只换 baseURL）
 */
import OpenAI from 'openai';
import type { AiTextProvider, AiTextRequest, AiTextResponse, AiProviderConfig } from './types';

/** 各厂商默认 baseURL，config.baseUrl 有值时优先用 config 的 */
const DEFAULT_BASE_URLS: Record<string, string> = {
  deepseek: 'https://api.deepseek.com/v1',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  glm: 'https://open.bigmodel.cn/api/paas/v4',
  minimax: 'https://api.minimax.chat/v1',
  grok: 'https://api.x.ai/v1',
  local: 'http://localhost:11434/v1',
  'openai-compatible': '',
};

/** 各厂商默认模型 */
const DEFAULT_MODELS: Record<string, string> = {
  deepseek: 'deepseek-chat',
  qwen: 'qwen-turbo',
  glm: 'glm-4-flash',
  minimax: 'MiniMax-Text-01',
  grok: 'grok-3',
  local: 'llama3',
};

function createClient(provider: string, config: AiProviderConfig) {
  const baseURL = config.baseUrl || DEFAULT_BASE_URLS[provider] || '';
  return new OpenAI({
    apiKey: config.apiKey || 'no-key', // 本地部署可能不需要 key
    baseURL,
    dangerouslyAllowBrowser: true,
  });
}

function makeProvider(providerKey: string): AiTextProvider {
  return {
    async generateText(request: AiTextRequest, config: AiProviderConfig): Promise<AiTextResponse> {
      const client = createClient(providerKey, config);
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
      }
      messages.push({ role: 'user', content: request.prompt });

      const res = await client.chat.completions.create({
        model: config.model || DEFAULT_MODELS[providerKey] || 'default',
        messages,
        ...(request.maxTokens ? { max_tokens: request.maxTokens } : {}),
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      });

      const text = res.choices[0]?.message?.content ?? '';
      return { text, raw: res };
    },
  };
}

export const deepseekTextProvider = makeProvider('deepseek');
export const qwenTextProvider = makeProvider('qwen');
export const glmTextProvider = makeProvider('glm');
export const minimaxTextProvider = makeProvider('minimax');
export const grokTextProvider = makeProvider('grok');
export const localTextProvider = makeProvider('local');
export const compatibleTextProvider = makeProvider('openai-compatible');
