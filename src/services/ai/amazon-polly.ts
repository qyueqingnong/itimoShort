/**
 * Amazon Polly 文字转语音
 * 使用 AWS REST API + Signature V4 签名
 * 无需额外 SDK（Web Crypto API 实现签名）
 *
 * config.apiKey   格式：ACCESS_KEY_ID:SECRET_ACCESS_KEY
 * config.baseUrl  格式：region（如 us-east-1），默认 us-east-1
 */
import type { AiTtsProvider, AiTtsRequest, AiTtsResponse, AiProviderConfig } from './types';

async function hmacSha256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

async function getSigningKey(
  secretKey: string,
  date: string,
  region: string,
  service: string,
): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  let key: ArrayBuffer = enc.encode(`AWS4${secretKey}`).buffer;
  key = await hmacSha256(key, date);
  key = await hmacSha256(key, region);
  key = await hmacSha256(key, service);
  key = await hmacSha256(key, 'aws4_request');
  return key;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return toHex(buf);
}

export const amazonPollyTtsProvider: AiTtsProvider = {
  async synthesize(request: AiTtsRequest, config: AiProviderConfig): Promise<AiTtsResponse> {
    if (!config.apiKey) throw new Error('Amazon Polly 未配置（格式：ACCESS_KEY:SECRET_KEY）');

    const [accessKeyId, secretAccessKey] = config.apiKey.split(':');
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('Amazon Polly API Key 格式错误，应为 ACCESS_KEY_ID:SECRET_ACCESS_KEY');
    }

    const region = config.baseUrl || 'us-east-1';
    const voiceId = request.voice || 'Zhiyu'; // 中文默认
    const now = new Date();
    const amzDate =
      now
        .toISOString()
        .replace(/[:-]|\.\d{3}/g, '')
        .slice(0, 15) + 'Z';
    const dateStamp = amzDate.slice(0, 8);

    const bodyObj = {
      Engine: 'neural',
      OutputFormat: 'mp3',
      Text: request.text,
      VoiceId: voiceId,
      ...(request.speed ? { SpeechMarkTypes: [] } : {}),
    };
    const bodyStr = JSON.stringify(bodyObj);
    const payloadHash = await sha256Hex(bodyStr);

    const host = `polly.${region}.amazonaws.com`;
    const canonicalUri = '/v1/speech';
    const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-date';
    const canonicalRequest = [
      'POST',
      canonicalUri,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${region}/polly/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      await sha256Hex(canonicalRequest),
    ].join('\n');

    const signingKey = await getSigningKey(secretAccessKey, dateStamp, region, 'polly');
    const signature = toHex(await hmacSha256(signingKey, stringToSign));

    const authHeader = [
      `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(', ');

    const res = await fetch(`https://${host}${canonicalUri}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Date': amzDate,
        Authorization: authHeader,
      },
      body: bodyStr,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Amazon Polly 错误：${err}`);
    }

    const audio = await res.arrayBuffer();
    return { audio };
  },
};
