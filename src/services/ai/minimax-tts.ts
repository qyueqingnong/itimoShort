/**
 * MiniMax 文字转语音
 * 纯 HTTP，无需额外 SDK
 */
import type { AiTtsProvider, AiTtsRequest, AiTtsResponse, AiProviderConfig } from './types';

export const minimaxTtsProvider: AiTtsProvider = {
  async synthesize(request: AiTtsRequest, config: AiProviderConfig): Promise<AiTtsResponse> {
    if (!config.apiKey) throw new Error('MiniMax API Key 未配置');

    const baseUrl = config.baseUrl || 'https://api.minimax.chat/v1';
    const url = `${baseUrl}/t2a_v2`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || 'speech-02-hd',
        text: request.text,
        stream: false,
        voice_setting: {
          voice_id: request.voice || 'female-tianmei',
          speed: request.speed ?? 1.0,
          vol: 1.0,
          pitch: 0,
        },
        audio_setting: {
          audio_sample_rate: 32000,
          bitrate: 128000,
          format: 'mp3',
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`MiniMax TTS 错误：${err}`);
    }

    const data = (await res.json()) as {
      data?: { audio?: string };
      base_resp?: { status_code: number; status_msg: string };
    };

    if (data.base_resp && data.base_resp.status_code !== 0) {
      throw new Error(`MiniMax TTS 错误：${data.base_resp.status_msg}`);
    }

    const audioBase64 = data.data?.audio ?? '';
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    return { audio: bytes.buffer, raw: data };
  },
};
