/**
 * Google 提供商
 * 文本：Gemini  依赖 @google/generative-ai
 * 图像：Imagen  依赖 @google/generative-ai (>=0.21)
 * TTS ：Google Cloud Text-to-Speech  纯 HTTP，无需额外 SDK
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
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

// ── 文本：Gemini ──────────────────────────────────────────────
export const googleTextProvider: AiTextProvider = {
  async generateText(request: AiTextRequest, config: AiProviderConfig): Promise<AiTextResponse> {
    if (!config.apiKey) throw new Error('Google API Key 未配置');

    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({ model: config.model || 'gemini-2.5-flash' });

    const parts: { text: string }[] = [];
    if (request.systemPrompt) parts.push({ text: `${request.systemPrompt}\n\n` });
    parts.push({ text: request.prompt });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        ...(request.maxTokens ? { maxOutputTokens: request.maxTokens } : {}),
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      },
    });

    return { text: result.response.text(), raw: result.response };
  },
};

// ── 图像：Gemini Image Generation ──────────────────────────────
export const googleImageProvider: AiImageProvider = {
  async generateImage(request: AiImageRequest, config: AiProviderConfig): Promise<AiImageResponse> {
    if (!config.apiKey) throw new Error('Google API Key 未配置');

    // 使用 GoogleGenerativeAI SDK 调用 Gemini 图片生成
    const genAI = new GoogleGenerativeAI(config.apiKey);

    // 使用配置的模型或默认模型
    // 推荐模型：gemini-2.5-flash-image (Nano Banana)
    const model = config.model || 'gemini-2.5-flash-image';
    const generativeModel = genAI.getGenerativeModel({ model });

    const response = await generativeModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: request.prompt,
            },
          ],
        },
      ],
    });

    // 提取图片数据
    const images: string[] = [];
    const candidates = response.response.candidates || [];

    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        // 检查是否是图片数据
        if ('inlineData' in part && part.inlineData) {
          const imageData = part.inlineData.data;
          // 转换为 data URL 格式
          const dataUrl = `data:image/png;base64,${imageData}`;
          images.push(dataUrl);
        }
      }
    }

    if (images.length === 0) {
      throw new Error('Google Gemini 未返回图片数据');
    }

    return { images, raw: response.response };
  },
};

// ── TTS：Google Cloud Text-to-Speech ─────────────────────────
export const googleTtsProvider: AiTtsProvider = {
  async synthesize(request: AiTtsRequest, config: AiProviderConfig): Promise<AiTtsResponse> {
    if (!config.apiKey) throw new Error('Google API Key 未配置');

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${config.apiKey}`;
    const voice = request.voice || 'cmn-CN-Wavenet-A';
    const [languageCode] = voice.split('-').slice(0, 2);

    const body = {
      input: { text: request.text },
      voice: { languageCode: `${languageCode}-${voice.split('-')[1]}`, name: voice },
      audioConfig: {
        audioEncoding: 'MP3',
        ...(request.speed ? { speakingRate: request.speed } : {}),
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google TTS 错误：${err}`);
    }

    const data = (await res.json()) as { audioContent: string };
    const binary = atob(data.audioContent);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    return { audio: bytes.buffer, raw: data };
  },
};
