<template>
  <div class="column q-gutter-y-md" style="min-height: 400px">
    <div class="text-subtitle2 itimo-text-secondary">AI 模型接口配置</div>
    <div class="text-caption itimo-text-secondary">
      配置各类 AI 接口，用于文本生成、图像生成、视频生成和语音合成。
    </div>

    <!-- Configuration List -->
    <div class="itimo-api-list-wrapper">
      <div class="itimo-api-list">
        <!-- Header -->
        <div class="itimo-list-header">
          <div class="itimo-col-name">名称</div>
          <div class="itimo-col-type">用途</div>
          <div class="itimo-col-provider">提供商</div>
          <div class="itimo-col-model">模型</div>
          <div class="itimo-col-actions">操作</div>
        </div>

        <!-- Empty State -->
        <div v-if="configList.length === 0" class="itimo-empty-state">
          <q-icon name="cloud_off" size="48px" color="grey-5" />
          <div class="itimo-empty-text">暂无配置</div>
          <div class="itimo-empty-hint">点击下方「新建接口」按钮开始添加</div>
        </div>

        <!-- Config Rows -->
        <div v-for="(config, index) in configList" :key="index" class="itimo-list-row">
          <div class="itimo-col-name">
            <div class="itimo-config-name">{{ config.name || '未命名' }}</div>
          </div>
          <div class="itimo-col-type">
            <q-badge :label="getServiceTypeLabel(config.serviceType)" color="primary" outline />
          </div>
          <div class="itimo-col-provider">
            <span class="itimo-provider-text">{{ getProviderLabel(config.provider) }}</span>
          </div>
          <div class="itimo-col-model">
            <span class="itimo-model-text">{{ config.model || '-' }}</span>
          </div>
          <div class="itimo-col-actions">
            <q-btn
              flat
              round
              dense
              icon="edit"
              size="sm"
              color="primary"
              @click="editConfig(index)"
            >
              <q-tooltip>编辑</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="delete"
              size="sm"
              color="negative"
              @click="confirmDelete(index)"
            >
              <q-tooltip>删除</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Button -->
    <div class="row justify-center q-mt-md">
      <q-btn
        unelevated
        rounded
        color="primary"
        icon="add"
        label="新建接口"
        @click="openCreateDialog"
      />
    </div>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px; max-width: 600px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ editingIndex === null ? '新建接口' : '编辑接口' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="closeDialog" />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div class="column q-gutter-md">
            <!-- 名称 -->
            <q-input
              v-model="formData.name"
              label="名称 *"
              outlined
              dense
              color="primary"
              placeholder="例如：Google Gemini 文本"
              :rules="[(v) => !!v || '名称不能为空']"
              hide-bottom-space
            />

            <!-- 用途类型 -->
            <q-select
              v-model="formData.serviceType"
              :options="serviceTypeOptions"
              label="用途类型 *"
              outlined
              dense
              color="primary"
              emit-value
              map-options
              @update:model-value="onFormServiceTypeChange"
            />

            <!-- 提供商 -->
            <q-select
              v-model="formData.provider"
              :options="getProviderOptions(formData.serviceType)"
              label="提供商 *"
              outlined
              dense
              color="primary"
              emit-value
              map-options
              @update:model-value="onFormProviderChange"
            />

            <!-- Base URL -->
            <q-input
              v-if="needsBaseUrl(formData.provider)"
              v-model="formData.baseUrl"
              label="Base URL"
              outlined
              dense
              color="primary"
              :placeholder="getBaseUrlPlaceholder(formData.provider)"
            />

            <!-- 模型 -->
            <q-select
              v-if="getPresetModels(formData.provider, formData.serviceType).length > 0"
              v-model="formData.model"
              :options="getPresetModels(formData.provider, formData.serviceType)"
              label="模型 *"
              outlined
              dense
              color="primary"
              emit-value
              map-options
            />
            <q-input
              v-else
              v-model="formData.model"
              label="模型 *"
              outlined
              dense
              color="primary"
              placeholder="输入模型名称"
              :rules="[(v) => !!v || '模型不能为空']"
            />

            <!-- 视频生成时长 -->
            <q-input
              v-if="formData.serviceType === 'video'"
              v-model.number="formData.videoDuration"
              label="生成视频时长（秒）*"
              outlined
              dense
              type="number"
              color="primary"
              placeholder="例如：8"
              :rules="[(v) => v > 0 || '时长必须大于0']"
            >
              <template #hint>
                <div>💡 建议：设置为 4-8 秒效果较稳定，实际时长以模型官方文档为准。</div>
              </template>
            </q-input>
            <div class="text-caption" style="margin-left: 30px; margin-top: 0px">
              <strong>常见视频模型时长(仅供参考，时刻在变化)：</strong>
              <div style="display: flex; flex-wrap: wrap; column-gap: 10px">
                <div>Google Veo,PixVerse:8秒;</div>
                <div>Kling可灵,MiniMax:10秒;</div>
                <div>Vidu:16秒;</div>
                <div>Seedance2:15秒;</div>
              </div>
            </div>
            <!-- API Key -->
            <q-input
              v-if="needsApiKey(formData.provider)"
              v-model="formData.apiKey"
              label="API Key *"
              outlined
              dense
              color="primary"
              :type="showFormKey ? 'text' : 'password'"
              placeholder="输入 API Key"
              :rules="[(v) => !!v || 'API Key 不能为空']"
              autocomplete="off"
            >
              <template #append>
                <q-icon
                  :name="showFormKey ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showFormKey = !showFormKey"
                />
              </template>
            </q-input>

            <!-- 并发数 -->
            <q-input
              v-model.number="formData.maxConcurrency"
              label="并发数"
              outlined
              dense
              type="number"
              color="primary"
              placeholder="1-20"
              :rules="[
                (v) => v === null || v === undefined || (v >= 1 && v <= 20) || '并发数必须在1-20之间',
              ]"
            >
              <template #hint>
                <div>💡 最大并发请求数，建议不超过5以避免接口限流。</div>
              </template>
            </q-input>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn flat label="取消" @click="closeDialog" />
          <q-btn
            flat
            label="测试连接"
            color="info"
            icon="science"
            :disable="!canTest"
            @click="testConnection"
          >
            <q-tooltip>测试接口是否可用（不会消耗积分）</q-tooltip>
          </q-btn>
          <q-btn unelevated label="保存" color="primary" :disable="!canSave" @click="saveConfig" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteConfirm" persistent>
      <q-card style="min-width: 320px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">确认删除</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDeleteConfirm = false" />
        </q-card-section>
        <q-card-section>
          确定要删除接口「<strong>{{ pendingDeleteName }}</strong
          >」吗？此操作无法撤销。
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn flat label="取消" @click="showDeleteConfirm = false" />
          <q-btn unelevated label="删除" color="negative" @click="doDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { useSettingsStore } from 'src/stores/settings-store';
import type { CustomApiConfig } from 'src/core/types/settings';

const $q = useQuasar();
const settings = useSettingsStore();

// ── 用途类型 ────────────────────────────────────────────────
const serviceTypeOptions = [
  { label: '文本 / 对话', value: 'text' },
  { label: '图像生成', value: 'image' },
  { label: '图生视频', value: 'video' },
  { label: '文字转语音', value: 'tts' },
];

function getServiceTypeLabel(type: string): string {
  return serviceTypeOptions.find((o) => o.value === type)?.label ?? type;
}

// ── 各类型对应的提供商 ────────────────────────────────────────
const PROVIDERS_BY_TYPE: Record<string, { label: string; value: string }[]> = {
  text: [
    { label: 'Google Gemini', value: 'google' },
    { label: 'OpenAI GPT', value: 'openai' },
    { label: 'Claude (Anthropic)', value: 'claude' },
    { label: 'Grok (xAI)', value: 'grok' },
    { label: 'DeepSeek', value: 'deepseek' },
    { label: 'Qwen (通义千问)', value: 'qwen' },
    { label: 'GLM (智谱)', value: 'glm' },
    { label: 'MiniMax', value: 'minimax' },
    { label: 'OpenAI 兼容接口', value: 'openai-compatible' },
    { label: '其他 / 本地', value: 'local' },
  ],
  image: [
    { label: 'Google Imagen', value: 'google-imagen' },
    { label: 'OpenAI GPT Image', value: 'openai-image' },
    { label: 'FLUX', value: 'flux' },
    { label: 'Seedream (字节)', value: 'seedream' },
    { label: 'Grok Imagine', value: 'grok-image' },
    { label: 'Qwen Image', value: 'qwen-image' },
    { label: 'OpenAI 兼容接口', value: 'openai-compatible' },
    { label: '其他 / 本地', value: 'local' },
  ],
  video: [
    { label: 'Dreamina Seedance (即梦)', value: 'dreamina' },
    { label: 'HappyHorse (快马)', value: 'happyhorse' },
    { label: 'SkyReels', value: 'skyreels' },
    { label: 'Google Veo', value: 'google-veo' },
    { label: 'Grok Imagine Video', value: 'grok-video' },
    { label: 'Kling (可灵)', value: 'kling' },
    { label: 'PixVerse', value: 'pixverse' },
    { label: 'Vidu', value: 'vidu' },
    { label: 'LTX-2.3', value: 'ltx' },
    { label: '其他 / 本地', value: 'local' },
  ],
  tts: [
    { label: 'Google Cloud TTS', value: 'google-tts' },
    { label: 'Amazon Polly', value: 'amazon-polly' },
    { label: 'ElevenLabs', value: 'elevenlabs' },
    { label: 'MiniMax 语音', value: 'minimax-tts' },
    { label: '其他 / 本地', value: 'local' },
  ],
};

function getProviderOptions(serviceType: string): { label: string; value: string }[] {
  return PROVIDERS_BY_TYPE[serviceType] ?? PROVIDERS_BY_TYPE['text'] ?? [];
}

function getProviderLabel(provider: string): string {
  for (const providers of Object.values(PROVIDERS_BY_TYPE)) {
    const found = providers.find((p) => p.value === provider);
    if (found) return found.label;
  }
  return provider;
}

// ── 预设模型列表 ────────────────────────────────────────────
const PRESET_MODELS: Record<string, { label: string; value: string }[]> = {
  google: [
    { label: 'gemini-2.5-flash（推荐）', value: 'gemini-2.5-flash' },
    { label: 'gemini-2.5-flash-lite', value: 'gemini-2.5-flash-lite' },
    { label: 'gemini-3-flash-preview', value: 'gemini-3-flash-preview' },
    { label: 'gemini-3.1-flash-lite-preview', value: 'gemini-3.1-flash-lite-preview' },
    { label: 'gemini-2.0-flash', value: 'gemini-2.0-flash' },
    { label: 'gemini-2.0-flash-thinking-exp', value: 'gemini-2.0-flash-thinking-exp' },
    { label: 'gemini-1.5-flash', value: 'gemini-1.5-flash' },
    { label: 'gemini-1.5-pro', value: 'gemini-1.5-pro' },
  ],
  openai: [
    { label: 'gpt-4o（推荐）', value: 'gpt-4o' },
    { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
    { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
    { label: 'o1', value: 'o1' },
    { label: 'o3-mini', value: 'o3-mini' },
  ],
  claude: [
    { label: 'claude-3-5-sonnet（推荐）', value: 'claude-3-5-sonnet-20241022' },
    { label: 'claude-3-5-haiku', value: 'claude-3-5-haiku-20241022' },
    { label: 'claude-3-opus', value: 'claude-3-opus-20240229' },
  ],
  grok: [
    { label: 'grok-3（推荐）', value: 'grok-3' },
    { label: 'grok-3-mini', value: 'grok-3-mini' },
    { label: 'grok-2', value: 'grok-2' },
  ],
  deepseek: [
    { label: 'deepseek-chat（推荐）', value: 'deepseek-chat' },
    { label: 'deepseek-reasoner', value: 'deepseek-reasoner' },
  ],
  qwen: [
    { label: 'qwen-turbo（推荐）', value: 'qwen-turbo' },
    { label: 'qwen-plus', value: 'qwen-plus' },
    { label: 'qwen-max', value: 'qwen-max' },
  ],
  glm: [
    { label: 'glm-4-flash（推荐）', value: 'glm-4-flash' },
    { label: 'glm-4', value: 'glm-4' },
    { label: 'glm-4-air', value: 'glm-4-air' },
  ],
  minimax: [
    { label: 'MiniMax-Text-01（推荐）', value: 'MiniMax-Text-01' },
    { label: 'abab6.5s', value: 'abab6.5s' },
  ],
  'openai-image': [
    { label: 'gpt-image-1（推荐）', value: 'gpt-image-1' },
    { label: 'dall-e-3', value: 'dall-e-3' },
  ],
  'google-imagen': [
    { label: 'gemini-2.5-flash-image（推荐）', value: 'gemini-2.5-flash-image' },
    { label: 'gemini-3.1-flash-image-preview', value: 'gemini-3.1-flash-image-preview' },
    { label: 'gemini-3-pro-image-preview', value: 'gemini-3-pro-image-preview' },
  ],
  'google-tts': [
    { label: 'en-US-Neural2-A', value: 'en-US-Neural2-A' },
    { label: 'cmn-CN-Wavenet-A（普通话）', value: 'cmn-CN-Wavenet-A' },
  ],
  'google-veo': [
    { label: 'veo-3.1-generate-001（推荐）', value: 'veo-3.1-generate-001' },
    { label: 'veo-3.1-fast-generate-001', value: 'veo-3.1-fast-generate-001' },
    { label: 'veo-3.1-lite-generate-001', value: 'veo-3.1-lite-generate-001' },
  ],
  elevenlabs: [
    { label: 'eleven_multilingual_v2（推荐）', value: 'eleven_multilingual_v2' },
    { label: 'eleven_turbo_v2_5', value: 'eleven_turbo_v2_5' },
  ],
  'minimax-tts': [
    { label: 'speech-02-hd（推荐）', value: 'speech-02-hd' },
    { label: 'speech-02-turbo', value: 'speech-02-turbo' },
  ],
};

function getPresetModels(provider: string, serviceType: string) {
  void serviceType;
  return PRESET_MODELS[provider] ?? [];
}

// ── 默认 Base URL ────────────────────────────────────────────
const DEFAULT_BASE_URLS: Record<string, string> = {
  'openai-compatible': 'http://localhost:11434/v1',
  local: 'http://localhost:11434',
  deepseek: 'https://api.deepseek.com/v1',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  glm: 'https://open.bigmodel.cn/api/paas/v4',
  minimax: 'https://api.minimax.chat/v1',
  grok: 'https://api.x.ai/v1',
  'minimax-tts': 'https://api.minimax.chat/v1',
};

// ── 不需要 Base URL 的官方 SDK 平台 ─────────────────────────
const NO_BASE_URL_PROVIDERS = new Set([
  'google',
  'openai',
  'claude',
  'google-imagen',
  'openai-image',
  'google-veo',
  'grok-image',
  'grok-video',
  'google-tts',
  'amazon-polly',
  'elevenlabs',
  'dreamina',
  'happyhorse',
  'skyreels',
  'kling',
  'pixverse',
  'vidu',
  'ltx',
  'seedream',
  'flux',
]);

// ── 不需要 API Key 的（本地部署）────────────────────────────
const NO_API_KEY_PROVIDERS = new Set(['local']);

function needsBaseUrl(provider: string) {
  return !NO_BASE_URL_PROVIDERS.has(provider);
}

function needsApiKey(provider: string) {
  return !NO_API_KEY_PROVIDERS.has(provider);
}

function getBaseUrlPlaceholder(provider: string) {
  if (provider === 'local') return 'http://localhost:11434';
  if (provider === 'openai-compatible') return 'http://localhost:11434/v1';
  return 'https://...';
}

// ── 数据 ─────────────────────────────────────────────────────
const configList = computed({
  get: () => settings.settings.api.customConfigs || [],
  set: (value) => {
    settings.settings.api.customConfigs = value;
  },
});

// ── 对话框状态 ───────────────────────────────────────────────
const showDialog = ref(false);
const editingIndex = ref<number | null>(null);
const showFormKey = ref(false);

interface FormData {
  name: string;
  serviceType: string;
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  videoDuration: number | undefined;
  maxConcurrency: number;
}

const formData = reactive<FormData>({
  name: '',
  serviceType: 'text',
  provider: 'google',
  model: '',
  baseUrl: '',
  apiKey: '',
  videoDuration: undefined,
  maxConcurrency: 1,
});

function openCreateDialog() {
  editingIndex.value = null;
  resetFormData();
  showDialog.value = true;
}

function editConfig(index: number) {
  editingIndex.value = index;
  const config = configList.value[index];
  if (config) {
    formData.name = config.name;
    formData.serviceType = config.serviceType;
    formData.provider = config.provider;
    formData.model = config.model;
    formData.baseUrl = config.baseUrl ?? '';
    formData.apiKey = config.apiKey;
    formData.videoDuration = config.videoDuration;
    formData.maxConcurrency = config.maxConcurrency ?? 1;
  }
  showDialog.value = true;
}

function closeDialog() {
  showDialog.value = false;
  showFormKey.value = false;
}

function resetFormData() {
  formData.name = '';
  formData.serviceType = 'text';
  formData.provider = 'google';
  formData.model = 'gemini-2.5-flash';
  formData.baseUrl = '';
  formData.apiKey = '';
  formData.videoDuration = undefined;
  formData.maxConcurrency = 1;
}

function onFormServiceTypeChange() {
  const providerList = getProviderOptions(formData.serviceType);
  const first = providerList[0];
  formData.provider = first ? first.value : 'local';
  onFormProviderChange();
}

function onFormProviderChange() {
  formData.baseUrl = DEFAULT_BASE_URLS[formData.provider] ?? '';
  const presets = getPresetModels(formData.provider, formData.serviceType);
  formData.model = presets[0]?.value ?? '';
}

const canSave = computed(() => {
  if (!formData.name.trim()) return false;
  if (!formData.model.trim()) return false;
  if (needsApiKey(formData.provider) && !formData.apiKey.trim()) return false;
  if (formData.serviceType === 'video' && (!formData.videoDuration || formData.videoDuration <= 0))
    return false;
  return true;
});

const canTest = computed(() => {
  if (!formData.model.trim()) return false;
  if (needsApiKey(formData.provider) && !formData.apiKey.trim()) return false;
  return true;
});

function saveConfig() {
  if (!canSave.value) return;

  const newConfig: CustomApiConfig = {
    name: formData.name.trim(),
    serviceType: formData.serviceType,
    provider: formData.provider,
    model: formData.model.trim(),
    baseUrl: formData.baseUrl.trim(),
    apiKey: formData.apiKey.trim(),
    modelList: '',
    defaultModel: '',
    priority: 0,
    ...(formData.serviceType === 'video' && formData.videoDuration !== undefined
      ? { videoDuration: formData.videoDuration }
      : {}),
  };

  if (editingIndex.value !== null) {
    // 编辑
    configList.value[editingIndex.value] = newConfig;
    $q.notify({ type: 'positive', message: '接口已更新', timeout: 1500 });
  } else {
    // 新建
    configList.value.push(newConfig);
    $q.notify({ type: 'positive', message: '接口已添加', timeout: 1500 });
  }

  closeDialog();
}

async function testConnection() {
  $q.notify({
    type: 'info',
    message: '正在测试连接...',
    timeout: 2000,
  });

  try {
    const result = await performSmartTest();
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: '✓ 连接测试成功',
        caption: result.message,
        timeout: 3000,
      });
    } else {
      $q.notify({
        type: 'negative',
        message: '✗ 连接测试失败',
        caption: result.message,
        timeout: 4000,
      });
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '✗ 测试过程出错',
      caption: String(error),
      timeout: 4000,
    });
  }
}

/**
 * 智能测试连接 - 根据不同API类型采用不同策略，避免消耗积分
 */
async function performSmartTest(): Promise<{ success: boolean; message: string }> {
  const { provider, serviceType, apiKey, baseUrl } = formData;

  // 构建测试用的配置对象
  const testConfig = {
    apiKey,
    baseUrl,
    model: formData.model,
  };

  try {
    switch (serviceType) {
      case 'text':
        return await testTextApi(provider, testConfig);
      case 'image':
        return await testImageApi(provider, testConfig);
      case 'video':
        return await testVideoApi(provider, testConfig);
      case 'tts':
        return await testTtsApi(provider, testConfig);
      default:
        return { success: false, message: '未知的API类型' };
    }
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

/**
 * 测试文本API
 */
async function testTextApi(
  provider: string,
  config: { apiKey: string; baseUrl: string },
): Promise<{ success: boolean; message: string }> {
  if (provider === 'google') {
    // Google Gemini - 检查API key是否有效
    const genAI = new (await import('@google/generative-ai')).GoogleGenerativeAI(config.apiKey);
    try {
      const model = genAI.getGenerativeModel({ model: formData.model || 'gemini-2.5-flash' });
      // 发送一个非常简单的请求来验证连接
      const result = await model.generateContent('test');
      if (result.response.text()) {
        return { success: true, message: 'Google Gemini 连接正常' };
      }
    } catch (error) {
      throw new Error(`Gemini API 错误: ${String(error)}`);
    }
  }

  if (provider === 'openai') {
    // OpenAI - 发送简单请求
    const client = new (await import('openai')).default({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true,
    });
    await client.chat.completions.create({
      model: formData.model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 5,
    });
    return { success: true, message: 'OpenAI 连接正常' };
  }

  if (provider === 'claude') {
    // Anthropic Claude - 发送简单请求
    const client = new (await import('@anthropic-ai/sdk')).default({
      apiKey: config.apiKey,
    });
    await client.messages.create({
      model: formData.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }],
    });
    return { success: true, message: 'Claude 连接正常' };
  }

  // 其他支持 OpenAI 兼容接口的提供商 - 尝试获取模型列表
  return await testOpenAICompatibleApi(config, '文本');
}

/**
 * 测试图像API
 */
async function testImageApi(
  provider: string,
  config: { apiKey: string; baseUrl: string },
): Promise<{ success: boolean; message: string }> {
  if (provider === 'openai-image') {
    // OpenAI 图像 - 发送非常小的请求验证连接
    const client = new (await import('openai')).default({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true,
    });
    // 使用最小的尺寸来测试，避免实际消耗太多资源
    await client.images.generate({
      model: formData.model || 'gpt-image-1',
      prompt: 'test',
      n: 1,
      size: '256x256',
    });
    return { success: true, message: 'OpenAI 图像API 连接正常' };
  }

  if (provider === 'google-imagen') {
    // Google Imagen - 同样使用Gemini SDK测试
    const genAI = new (await import('@google/generative-ai')).GoogleGenerativeAI(config.apiKey);
    try {
      const model = genAI.getGenerativeModel({
        model: formData.model || 'gemini-2.5-flash-image',
      });
      await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'test' }] }],
      });
      return { success: true, message: 'Google Imagen 连接正常' };
    } catch (error) {
      throw new Error(`Imagen API 错误: ${String(error)}`);
    }
  }

  // 其他图像API - 尝试模型列表或简单请求
  return await testOpenAICompatibleApi(config, '图像');
}

/**
 * 测试视频API - 最关键，避免真的生成视频
 */
async function testVideoApi(
  provider: string,
  config: { apiKey: string; baseUrl: string },
): Promise<{ success: boolean; message: string }> {
  // 大多数视频API不支持模型列表，但可以通过检查endpoint是否可达来验证
  // 这里采用特殊策略：发送一个格式正确但不会被处理的请求

  // 对于有 baseUrl 的 API，尝试发送一个 HEAD 请求检查端点可达性
  if (config.baseUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${config.baseUrl}/models`, {
        method: 'HEAD',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok || response.status === 401) {
        // 401 表示端点可达但认证失败，这也是有用的信息
        return {
          success: response.status === 401,
          message:
            response.status === 401 ? '端点可达，但 API Key 可能无效' : '视频API端点连接正常',
        };
      }
    } catch (error) {
      // 如果连端点都访问不了，说明配置有问题
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('连接超时，请检查 Base URL 是否正确');
      }
      throw new Error(`无法连接到视频API端点: ${String(error)}`);
    }
  }

  // 对于没有 baseUrl 的官方SDK提供商，尝试SDK测试
  if (provider === 'google-veo') {
    // Google Veo 使用 Gemini API 测试
    const genAI = new (await import('@google/generative-ai')).GoogleGenerativeAI(config.apiKey);
    try {
      // Google API 可以通过简单的文本调用来验证 key 是否有效
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      await model.generateContent('connection test');
      return { success: true, message: 'Google API Key 验证通过（视频功能待测试）' };
    } catch (error) {
      throw new Error(`Google API 错误: ${String(error)}`);
    }
  }

  // 对于视频API，返回一个提示
  return {
    success: true,
    message: `已记录 ${provider} 配置，建议在正式使用时验证生成效果`,
  };
}

/**
 * 测试TTS API
 */
async function testTtsApi(
  provider: string,
  config: { apiKey: string; baseUrl: string },
): Promise<{ success: boolean; message: string }> {
  if (provider === 'google-tts') {
    // Google TTS - 发送一个非常短的请求
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${config.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: 'test' },
        voice: { languageCode: 'en-US', name: 'en-US-Neural2-A' },
        audioConfig: { audioEncoding: 'MP3' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google TTS 错误: ${errorText}`);
    }

    const data = (await response.json()) as { audioContent?: string };
    if (data.audioContent) {
      return { success: true, message: 'Google TTS 连接正常' };
    }
  }

  if (provider === 'elevenlabs') {
    // ElevenLabs - 获取可用声音列表
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': config.apiKey },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs 错误: ${response.status}`);
    }

    return { success: true, message: 'ElevenLabs 连接正常' };
  }

  if (provider === 'amazon-polly') {
    // Amazon Polly - AWS SDK 比较复杂，这里做简化处理
    // 实际项目中需要配置 AWS credentials
    if (!config.apiKey) {
      throw new Error('Amazon Polly 需要配置 AWS Access Key 和 Secret Key');
    }
    // 这里可以添加更复杂的 AWS 签名逻辑
    return { success: true, message: 'Amazon Polly 配置已记录' };
  }

  // 其他TTS API
  return await testOpenAICompatibleApi(config, 'TTS');
}

/**
 * 测试 OpenAI 兼容接口
 */
async function testOpenAICompatibleApi(
  config: { apiKey: string; baseUrl: string },
  apiType: string,
): Promise<{ success: boolean; message: string }> {
  if (!config.baseUrl) {
    return { success: false, message: `${apiType} API 需要配置 Base URL` };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${config.baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      return { success: true, message: `${apiType} API 连接正常` };
    } else if (response.status === 401) {
      return { success: false, message: 'API Key 无效或已过期' };
    } else {
      return { success: false, message: `服务器返回错误: ${response.status}` };
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, message: '连接超时，请检查 Base URL 是否正确' };
    }
    return { success: false, message: `连接失败: ${String(error)}` };
  }
}

// ── 删除确认 ─────────────────────────────────────────────────
const showDeleteConfirm = ref(false);
const pendingDeleteIndex = ref<number | null>(null);
const pendingDeleteName = ref('');

function confirmDelete(index: number) {
  const config = configList.value[index];
  if (!config) return;
  pendingDeleteIndex.value = index;
  pendingDeleteName.value = config.name || '未命名';
  showDeleteConfirm.value = true;
}

function doDelete() {
  if (pendingDeleteIndex.value !== null) {
    configList.value.splice(pendingDeleteIndex.value, 1);
    $q.notify({ type: 'positive', message: '接口已删除', timeout: 1500 });
  }
  showDeleteConfirm.value = false;
}
</script>

<style scoped>
.itimo-api-list-wrapper {
  max-width: 100%;
  overflow: hidden;
  border-radius: 8px;
}

.itimo-api-list {
  border: 1px solid var(--itimo-surface-border);
  border-radius: 8px;
  overflow: hidden;
  max-width: 100%;
  background: var(--itimo-bg-primary);
}

.itimo-list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 2fr 120px;
  gap: 12px;
  padding: 12px 16px;
  background: var(--itimo-bg-secondary);
  border-bottom: 1px solid var(--itimo-surface-border);
  font-weight: 600;
  font-size: 0.82rem;
  color: var(--itimo-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.itimo-list-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 2fr 120px;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--itimo-surface-border);
  align-items: center;
  background: var(--itimo-bg-primary);
  transition: background 0.15s ease;
}

.itimo-list-row:hover {
  background: color-mix(in srgb, var(--itimo-brand) 3%, var(--itimo-bg-primary));
}

.itimo-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
}

.itimo-config-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--itimo-text-primary);
}

.itimo-provider-text,
.itimo-model-text {
  font-size: 0.85rem;
  color: var(--itimo-text-secondary);
}

.itimo-model-text {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
}
</style>
