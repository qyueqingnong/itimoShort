/**
 * AI 服务统一入口
 * 新增平台只需：1) 在对应文件写实现  2) 在下方注册表加一行
 */
import { useSettingsStore } from 'src/stores/settings-store';

import { googleTextProvider, googleImageProvider, googleTtsProvider } from './google';
import { openaiTextProvider, openaiImageProvider } from './openai';
import { claudeTextProvider } from './claude';
import {
  deepseekTextProvider,
  qwenTextProvider,
  glmTextProvider,
  minimaxTextProvider,
  grokTextProvider,
  localTextProvider,
  compatibleTextProvider,
} from './openai-compatible';
import { elevenlabsTtsProvider } from './elevenlabs';
import { minimaxTtsProvider } from './minimax-tts';
import { amazonPollyTtsProvider } from './amazon-polly';

import type {
  AiTextProvider,
  AiTextRequest,
  AiTextResponse,
  AiImageProvider,
  AiImageRequest,
  AiImageResponse,
  AiTtsProvider,
  AiTtsRequest,
  AiTtsResponse,
  AiProviderConfig,
} from './types';

export type {
  AiTextRequest,
  AiTextResponse,
  AiImageRequest,
  AiImageResponse,
  AiTtsRequest,
  AiTtsResponse,
  AiProviderConfig,
};

// ── 注册表 ────────────────────────────────────────────────────
const TEXT_PROVIDERS: Record<string, AiTextProvider> = {
  google: googleTextProvider,
  openai: openaiTextProvider,
  claude: claudeTextProvider,
  grok: grokTextProvider,
  deepseek: deepseekTextProvider,
  qwen: qwenTextProvider,
  glm: glmTextProvider,
  minimax: minimaxTextProvider,
  'openai-compatible': compatibleTextProvider,
  local: localTextProvider,
};

const IMAGE_PROVIDERS: Record<string, AiImageProvider> = {
  'google-imagen': googleImageProvider,
  'openai-image': openaiImageProvider,
  // flux / seedream / grok-image / qwen-image → 接入后在此注册
  local: { generateImage: compatibleImageFallback },
};

const TTS_PROVIDERS: Record<string, AiTtsProvider> = {
  'google-tts': googleTtsProvider,
  'amazon-polly': amazonPollyTtsProvider,
  elevenlabs: elevenlabsTtsProvider,
  'minimax-tts': minimaxTtsProvider,
};

// ── 内部工具 ──────────────────────────────────────────────────
function resolveConfig(serviceType: string): { providerKey: string; config: AiProviderConfig } {
  const settings = useSettingsStore();
  const configs = settings.settings.api.customConfigs ?? [];
  const match = configs.find((c) => c.serviceType === serviceType);

  if (!match) {
    throw new Error(`未找到 serviceType="${serviceType}" 的 API 配置，请先在设置中添加`);
  }

  return {
    providerKey: match.provider,
    config: {
      apiKey: match.apiKey,
      model: match.model || undefined,
      baseUrl: match.baseUrl || undefined,
    },
  };
}

/**
 * 根据 API 配置名称获取配置
 */
export function resolveConfigByName(configName: string): { providerKey: string; config: AiProviderConfig } {
  const settings = useSettingsStore();
  const configs = settings.settings.api.customConfigs ?? [];
  const match = configs.find((c) => c.name === configName);

  if (!match) {
    throw new Error(`未找到名称为 "${configName}" 的 API 配置，请先在设置中添加`);
  }

  return {
    providerKey: match.provider,
    config: {
      apiKey: match.apiKey,
      model: match.model || undefined,
      baseUrl: match.baseUrl || undefined,
    },
  };
}

// ── 对外 API ──────────────────────────────────────────────────

/** 文本生成
 * @param request 生成请求
 * @param configName 可选，指定使用哪个 API 配置（通过 promptApiBindings 设置）
 */
export async function generateText(
  request: AiTextRequest,
  configName?: string,
): Promise<AiTextResponse> {
  const settings = useSettingsStore();

  let providerKey: string;
  let config: AiProviderConfig;

  if (configName) {
    // 根据配置名称查找
    const match = settings.settings.api.customConfigs?.find((c) => c.name === configName);
    if (!match) {
      throw new Error(`未找到名称为 "${configName}" 的 API 配置`);
    }
    providerKey = match.provider;
    config = {
      apiKey: match.apiKey,
      model: match.model || undefined,
      baseUrl: match.baseUrl || undefined,
    };
  } else {
    // 使用默认的 serviceType='text' 配置
    const result = resolveConfig('text');
    providerKey = result.providerKey;
    config = result.config;
  }

  const provider = TEXT_PROVIDERS[providerKey];
  if (!provider) throw new Error(`暂不支持的文本提供商：${providerKey}`);
  return provider.generateText(request, config);
}

/** 图像生成
 * @param request 生成请求
 * @param configName 可选，指定使用哪个 API 配置（通过 promptApiBindings 设置）
 */
export async function generateImage(
  request: AiImageRequest,
  configName?: string,
): Promise<AiImageResponse> {
  const settings = useSettingsStore();

  let providerKey: string;
  let config: AiProviderConfig;

  if (configName) {
    // 根据配置名称查找
    const match = settings.settings.api.customConfigs?.find((c) => c.name === configName);
    if (!match) {
      throw new Error(`未找到名称为 "${configName}" 的 API 配置`);
    }
    providerKey = match.provider;
    config = {
      apiKey: match.apiKey,
      model: match.model || undefined,
      baseUrl: match.baseUrl || undefined,
    };
  } else {
    // 使用默认的 serviceType='image' 配置
    const result = resolveConfig('image');
    providerKey = result.providerKey;
    config = result.config;
  }

  const provider = IMAGE_PROVIDERS[providerKey];
  if (!provider) throw new Error(`暂不支持的图像提供商：${providerKey}`);
  return provider.generateImage(request, config);
}

/** 文字转语音 */
export async function synthesizeSpeech(request: AiTtsRequest): Promise<AiTtsResponse> {
  const { providerKey, config } = resolveConfig('tts');
  const provider = TTS_PROVIDERS[providerKey];
  if (!provider) throw new Error(`暂不支持的 TTS 提供商：${providerKey}`);
  return provider.synthesize(request, config);
}

// ── 占位：本地图像（OpenAI 兼容 /images/generations）────────
async function compatibleImageFallback(
  request: AiImageRequest,
  config: AiProviderConfig,
): Promise<AiImageResponse> {
  const baseUrl = config.baseUrl || 'http://localhost:11434/v1';
  const res = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey || 'no-key'}`,
    },
    body: JSON.stringify({
      model: config.model || 'default',
      prompt: request.prompt,
      n: request.n ?? 1,
      size: `${request.width ?? 1024}x${request.height ?? 1024}`,
      response_format: 'url',
    }),
  });

  if (!res.ok) throw new Error(`本地图像生成错误：${await res.text()}`);
  const data = (await res.json()) as { data: { url: string }[] };
  return { images: data.data.map((d) => d.url) };
}
