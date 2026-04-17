/**
 * ElevenLabs 文字转语音
 * 纯 HTTP，无需额外 SDK
 */
import type { AiTtsProvider, AiTtsRequest, AiTtsResponse, AiProviderConfig } from './types';

export const elevenlabsTtsProvider: AiTtsProvider = {
  async synthesize(request: AiTtsRequest, config: AiProviderConfig): Promise<AiTtsResponse> {
    if (!config.apiKey) throw new Error('ElevenLabs API Key 未配置');

    const voiceId = request.voice || '21m00Tcm4TlvDq8ikWAM'; // Rachel（默认）
    const model = config.model || 'eleven_multilingual_v2';
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': config.apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: request.text,
        model_id: model,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          ...(request.speed ? { speed: request.speed } : {}),
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`ElevenLabs 错误：${err}`);
    }

    const audio = await res.arrayBuffer();
    return { audio };
  },
};
