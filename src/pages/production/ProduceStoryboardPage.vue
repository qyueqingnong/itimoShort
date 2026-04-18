<template>
  <div class="itimo-produce-page">
    <!-- Page Header -->
    <div class="itimo-produce-header">
      <div class="row items-center gap-md">
        <h3>分镜生成</h3>
        <span class="itimo-episode-badge">{{ episodeNumber }}</span>
      </div>
      <p class="itimo-produce-subtitle">管理分镜列表，每个分镜可独立配置并生成图片和视频</p>
    </div>

    <!-- 分镜生成操作栏 -->
    <section class="itimo-produce-section">
      <div class="itimo-section-card">
        <div class="itimo-card-header">
          <h2 class="itimo-card-title">分镜列表</h2>
          <div class="row q-gutter-sm">
            <q-select
              v-model="selectedPromptTheme"
              :options="promptThemeOptions"
              option-label="label"
              option-value="id"
              outlined
              dense
              emit-value
              map-options
              placeholder="选择提示词套件"
              style="min-width: 160px"
            >
              <template #prepend>
                <q-icon name="description" size="xs" />
              </template>
            </q-select>
            <q-btn
              color="primary"
              unelevated
              rounded
              label="AI分镜"
              icon="auto_awesome"
              :disable="!selectedPromptTheme"
              @click="generateStoryboardFromScript"
            />
            <q-btn
              color="primary"
              outline
              rounded
              icon="add"
              label="添加分镜"
              @click="addNewShot"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Storyboard Cards -->
    <section class="itimo-produce-section">
      <div class="itimo-storyboard-container">
        <div v-for="(shot, index) in storyboardShots" :key="shot.id" class="itimo-storyboard-card">
          <!-- Card Header -->
          <div class="itimo-card-header">
            <div class="itimo-shot-title-section">
              <span class="itimo-shot-number">分镜 {{ index + 1 }}</span>
              <div class="itimo-shot-name-edit">
                <span v-if="!shot.isEditingName" class="itimo-shot-name">{{ shot.name }}</span>
                <q-input
                  v-else
                  v-model="shot.name"
                  dense
                  outlined
                  @keyup.enter="shot.isEditingName = false"
                  @blur="shot.isEditingName = false"
                  autofocus
                  class="itimo-shot-name-input"
                />
                <q-btn
                  flat
                  dense
                  icon="edit"
                  size="sm"
                  @click="shot.isEditingName = !shot.isEditingName"
                />
              </div>
            </div>
            <div class="row q-gutter-xs">
              <q-btn flat dense icon="content_copy" size="sm" @click="duplicateShot(index)">
                <q-tooltip>复制</q-tooltip>
              </q-btn>
              <q-btn color="negative" flat dense icon="delete" size="sm" @click="deleteShot(index)">
                <q-tooltip>删除</q-tooltip>
              </q-btn>
            </div>
          </div>

          <!-- Card Body -->
          <div class="itimo-card-body">
            <!-- 第一行：分镜剧本文本 + 配置 -->
            <div class="itimo-shot-content-row">
              <!-- 左侧：分镜剧本文本 -->
              <div class="itimo-script-section">
                <div class="itimo-section-header">
                  <span class="itimo-section-title">分镜剧本</span>
                  <q-select
                    v-model="shot.promptThemeId"
                    :options="promptThemeOptions"
                    option-label="label"
                    option-value="id"
                    outlined
                    dense
                    emit-value
                    map-options
                    placeholder="提示词套件"
                    size="sm"
                    style="min-width: 120px"
                  />
                  <q-btn flat dense icon="auto_awesome" size="xs" color="primary" @click="generateScriptText(shot)">
                    <q-tooltip>AI生成剧本</q-tooltip>
                  </q-btn>
                </div>
                <q-input
                  v-model="shot.scriptText"
                  type="textarea"
                  outlined
                  dense
                  placeholder="输入或编辑分镜剧本文本..."
                  :rows="4"
                  class="itimo-script-input"
                />
              </div>

              <!-- 右侧：场景和角色配置 -->
              <div class="itimo-config-section">
                <!-- 场景选择 -->
                <div class="itimo-config-row">
                  <label class="itimo-config-label">场景</label>
                  <q-select
                    v-model="shot.selectedScene"
                    :options="sceneOptions"
                    outlined
                    dense
                    option-label="name"
                    option-value="id"
                    emit-value
                    map-options
                    class="itimo-config-select"
                  >
                    <template #option="{ opt, itemProps }">
                      <q-item v-bind="itemProps">
                        <q-item-section avatar>
                          <img v-if="opt.imagePath" :src="getSceneImage(opt)" class="itimo-config-thumb" />
                          <q-icon v-else name="landscape" size="sm" color="grey" />
                        </q-item-section>
                        <q-item-section>{{ opt.name }}</q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>

                <!-- 角色选择 -->
                <div class="itimo-config-row">
                  <label class="itimo-config-label">角色</label>
                  <q-select
                    v-model="shot.selectedCharacters"
                    :options="characterOptions"
                    outlined
                    dense
                    multiple
                    option-label="name"
                    option-value="id"
                    emit-value
                    map-options
                    class="itimo-config-select"
                  >
                    <template #option="{ opt, itemProps }">
                      <q-item v-bind="itemProps">
                        <q-item-section avatar>
                          <img :src="getCharacterAvatar(opt)" class="itimo-config-thumb" />
                        </q-item-section>
                        <q-item-section>{{ opt.name }}</q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
              </div>
            </div>

            <!-- 第三行：语音生成 -->
            <div class="itimo-audio-row">
              <div class="itimo-audio-section">
                <div class="itimo-audio-header">
                  <q-checkbox
                    v-model="shot.useAudioInVideo"
                    :disable="!shot.generatedAudioUrl"
                    dense
                  >
                    <span class="itimo-audio-label">传音视频</span>
                  </q-checkbox>
                  <div class="itimo-audio-info">
                    <span class="itimo-audio-name">{{ shot.audioFileName || '未命名' }}</span>
                    <span
                      class="itimo-audio-status"
                      :class="`itimo-audio-status-${shot.audioStatus}`"
                    >
                      {{ getAudioStatusText(shot.audioStatus) }}
                    </span>
                  </div>
                </div>
                <div class="itimo-audio-controls">
                  <q-select
                    v-model="shot.audioApiConfig"
                    :options="audioApiOptions"
                    outlined
                    dense
                    size="sm"
                    style="min-width: 140px"
                    :disable="shot.audioStatus === 'generating'"
                  />
                  <q-btn
                    color="primary"
                    unelevated
                    dense
                    size="sm"
                    :label="shot.audioStatus === 'completed' ? '重新生成' : 'AI生成对话语音'"
                    :loading="shot.audioStatus === 'generating'"
                    :disable="!shot.scriptText.trim() || !shot.audioApiConfig"
                    @click="generateAudio(shot)"
                  />
                </div>
              </div>
            </div>

            <!-- 第二行：图片和视频 -->
            <div class="itimo-shot-content-row itimo-media-row">
              <!-- 图片生成区 -->
              <div class="itimo-media-section">
                <div class="itimo-section-header">
                  <span class="itimo-section-title">图片</span>
                  <div class="row q-gutter-xs">
                    <q-select
                      v-model="shot.imageApiConfig"
                      :options="imageApiOptions"
                      outlined
                      dense
                      size="sm"
                      style="min-width: 120px"
                    />
                    <q-btn color="primary" unelevated dense size="sm" label="生成" @click="generateImage(shot)" />
                    <q-btn color="positive" flat dense size="sm" icon="upload" @click="uploadImage(shot)">
                      <q-tooltip>上传图片</q-tooltip>
                    </q-btn>
                  </div>
                </div>
                <div class="itimo-media-display" @click="shot.generatedImage && enlargeImage(shot.generatedImage)">
                  <div v-if="shot.generatedImage" class="itimo-image-container">
                    <img :src="shot.generatedImage" alt="生成的图片" />
                  </div>
                  <div v-else class="itimo-media-placeholder">
                    <q-icon name="image" size="48px" color="grey-5" />
                    <span>暂无图片</span>
                  </div>
                </div>
                <!-- 图片提示词编辑 -->
                <div class="itimo-prompt-editor">
                  <div class="itimo-prompt-header">
                    <span class="itimo-prompt-label">图片提示词</span>
                    <q-btn flat dense icon="edit" size="xs" @click="editImagePrompt(shot)" />
                  </div>
                  <div class="itimo-prompt-preview">
                    {{ truncateText(shot.imagePrompt, 80) }}
                  </div>
                </div>
              </div>

              <!-- 视频生成区 -->
              <div class="itimo-media-section">
                <div class="itimo-section-header">
                  <span class="itimo-section-title">视频</span>
                  <div class="row q-gutter-xs">
                    <q-select
                      v-model="shot.videoApiConfig"
                      :options="videoApiOptions"
                      outlined
                      dense
                      size="sm"
                      style="min-width: 120px"
                    />
                    <q-btn
                      color="primary"
                      unelevated
                      dense
                      size="sm"
                      :label="shot.generatedVideo ? '重新生成' : '生成'"
                      @click="handleVideoGenerateClick(shot)"
                    />
                  </div>
                </div>
                <div class="itimo-media-display">
                  <div v-if="shot.generatedVideo" class="itimo-video-container">
                    <video :src="shot.generatedVideo" controls />
                  </div>
                  <div v-else class="itimo-media-placeholder">
                    <q-icon name="videocam" size="48px" color="grey-5" />
                    <span>暂无视频</span>
                  </div>
                </div>
                <!-- 视频提示词编辑 -->
                <div class="itimo-prompt-editor">
                  <div class="itimo-prompt-header">
                    <span class="itimo-prompt-label">视频提示词</span>
                    <q-btn flat dense icon="edit" size="xs" @click="editVideoPrompt(shot)" />
                  </div>
                  <div class="itimo-prompt-preview">
                    {{ truncateText(shot.videoPrompt, 80) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="storyboardShots.length === 0" class="itimo-empty-state">
          <q-icon name="view_quilt" size="64px" color="grey-5" />
          <p class="itimo-empty-text">暂无分镜，点击上方"从剧本导入"或"添加分镜"开始</p>
        </div>
      </div>
    </section>

    <!-- 图片提示词编辑弹窗 -->
    <q-dialog v-model="showImagePromptDialog" persistent>
      <q-card style="min-width: 700px">
        <q-card-section class="row items-center">
          <q-icon name="image" color="primary" size="md" class="q-mr-sm" />
          <div class="text-h6">编辑图片提示词</div>
          <q-space />
          <q-btn flat round icon="close" @click="showImagePromptDialog = false" />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-input
            v-model="editingImagePrompt"
            type="textarea"
            outlined
            label="图片提示词"
            :rows="8"
            placeholder="输入用于生成分镜图片的提示词..."
          />
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="取消" @click="showImagePromptDialog = false" />
          <q-btn unelevated label="保存" color="primary" @click="saveImagePrompt" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 视频提示词编辑弹窗 -->
    <q-dialog v-model="showVideoPromptDialog" persistent>
      <q-card style="min-width: 800px; max-width: 900px">
        <q-card-section class="row items-center">
          <q-icon name="videocam" color="primary" size="md" class="q-mr-sm" />
          <div class="text-h6">编辑视频提示词</div>
          <q-space />
          <q-btn flat round icon="close" @click="showVideoPromptDialog = false" />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="row q-col-gutter-md">
            <!-- 左列：基础配置 -->
            <div class="col-12 col-md-6">
              <div class="text-subtitle2 q-mb-md">基础配置</div>

              <!-- 视频分辨率 -->
              <div class="q-mb-md">
                <label class="itimo-config-label">视频分辨率</label>
                <q-btn-toggle
                  v-model="currentEditingShot!.videoResolution"
                  spread
                  no-caps
                  unelevated
                  toggle-color="primary"
                  :options="[
                    { label: '480p', value: '480p' },
                    { label: '720p', value: '720p' },
                    { label: '1080p', value: '1080p' },
                  ]"
                  class="q-mt-sm"
                />
              </div>

              <!-- 帧率 -->
              <div class="q-mb-md">
                <label class="itimo-config-label">帧率</label>
                <q-btn-toggle
                  v-model="currentEditingShot!.videoFps"
                  spread
                  no-caps
                  unelevated
                  toggle-color="primary"
                  :options="[
                    { label: '24 FPS', value: '24' },
                    { label: '30 FPS', value: '30' },
                  ]"
                  class="q-mt-sm"
                />
              </div>

              <!-- 运动强度 -->
              <div class="q-mb-md">
                <label class="itimo-config-label">运动强度</label>
                <div class="row items-center q-gutter-sm q-mt-sm">
                  <span class="text-caption">低</span>
                  <q-slider
                    v-model="currentEditingShot!.videoMotionIntensity"
                    :min="1"
                    :max="10"
                    :step="1"
                    label
                    label-always
                    color="primary"
                    style="flex: 1"
                  />
                  <span class="text-caption">高</span>
                </div>
                <div class="text-caption itimo-text-secondary q-mt-xs">
                  <q-icon name="info" size="xs" />
                  低数值：画面更安静，只有微风吹动头发或眨眼等细微动作。<br />
                  高数值：画面动作剧烈，比如激烈的追逐、爆炸或大幅度的舞蹈。
                </div>
              </div>

              <!-- 负向提示词 -->
              <div class="q-mb-md">
                <label class="itimo-config-label">负向提示词</label>
                <q-input
                  v-model="currentEditingShot!.videoNegativePrompt"
                  type="textarea"
                  outlined
                  dense
                  :rows="3"
                  placeholder="输入不希望出现的元素..."
                  class="q-mt-sm"
                />
              </div>
            </div>

            <!-- 右列：视角配置 -->
            <div class="col-12 col-md-6">
              <div class="text-subtitle2 q-mb-md">视角与摄影</div>

              <!-- 景别 -->
              <div class="q-mb-md">
                <label class="itimo-config-label">景别</label>
                <q-select
                  v-model="currentEditingShot!.videoAngleS"
                  :options="angleSOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  class="q-mt-sm"
                />
              </div>

              <!-- 俯仰角度 -->
              <div class="q-mb-md">
                <label class="itimo-config-label">俯仰角度</label>
                <q-select
                  v-model="currentEditingShot!.videoAngleV"
                  :options="angleVOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  class="q-mt-sm"
                />
              </div>

              <!-- 水平方向 -->
              <div class="q-mb-md">
                <label class="itimo-config-label">水平方向</label>
                <q-select
                  v-model="currentEditingShot!.videoAngleH"
                  :options="angleHOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  class="q-mt-sm"
                />
              </div>

              <!-- 镜头运动 -->
              <div class="q-mb-md">
                <label class="itimo-config-label">镜头运动</label>
                <q-select
                  v-model="currentEditingShot!.videoMovement"
                  :options="movementOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  class="q-mt-sm"
                />
              </div>

              <!-- 灯光风格 -->
              <div class="q-mb-md">
                <label class="itimo-config-label">灯光风格</label>
                <q-select
                  v-model="currentEditingShot!.videoLighting"
                  :options="lightingOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  class="q-mt-sm"
                />
              </div>

              <!-- 景深 -->
              <div class="q-mb-md">
                <label class="itimo-config-label">景深</label>
                <q-select
                  v-model="currentEditingShot!.videoDepthOfField"
                  :options="depthOfFieldOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  class="q-mt-sm"
                />
              </div>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <!-- 视频提示词（主提示词） -->
          <div>
            <label class="itimo-config-label">视频提示词</label>
            <q-input
              v-model="editingVideoPrompt"
              type="textarea"
              outlined
              :rows="6"
              placeholder="输入用于生成分镜视频的提示词..."
              class="q-mt-sm"
            />
            <div class="text-caption itimo-text-secondary q-mt-xs">
              <q-icon name="info" size="xs" />
              提示词将自动结合视角、灯光等摄影参数生成完整描述。
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="取消" @click="showVideoPromptDialog = false" />
          <q-btn unelevated label="保存" color="primary" @click="saveVideoPrompt" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 图片放大查看 -->
    <q-dialog v-model="showImageDialog" maximized transition-show="fade" transition-hide="fade">
      <div class="itimo-viewer-container" @click="showImageDialog = false">
        <q-btn
          round
          dense
          flat
          icon="close"
          color="white"
          size="lg"
          class="itimo-viewer-close-btn"
        >
          <q-tooltip>关闭</q-tooltip>
        </q-btn>
        <div class="itimo-viewer-content" @click.stop>
          <img :src="enlargedImage" alt="查看大图" class="itimo-viewer-image" />
        </div>
      </div>
    </q-dialog>

    <!-- 视频重新生成弹窗 -->
    <q-dialog v-model="showVideoRegenerateDialog" persistent>
      <q-card style="min-width: 450px">
        <q-card-section class="row items-center">
          <q-icon name="videocam" color="primary" size="md" class="q-mr-sm" />
          <div class="text-h6">重新生成视频</div>
          <q-space />
          <q-btn flat round icon="close" @click="cancelVideoRegenerate" />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="text-body2 text-grey-7 q-mb-md">请选择重新生成的方式：</div>

          <!-- 重新生成方式选择 -->
          <q-option-group
            v-model="videoRegenerateMode"
            :options="videoRegenerateOptions"
            color="primary"
            class="q-mb-md"
          />

          <!-- 原视频修改输入框 -->
          <div v-if="videoRegenerateMode === 'modify'" class="q-mt-md">
            <q-input
              v-model="videoModificationText"
              type="textarea"
              outlined
              label="请输入要修改优化的地方"
              :rows="4"
              placeholder="例如：让角色动作更自然，调整光线更柔和..."
            />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="取消" @click="cancelVideoRegenerate" />
          <q-btn
            unelevated
            label="确认"
            color="primary"
            :disable="videoRegenerateMode === 'modify' && !videoModificationText.trim()"
            @click="confirmVideoRegenerate"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useWorkspaceStore } from 'src/stores/workspace-store';
import { useSettingsStore } from 'src/stores/settings-store';
import { useDebounceFn } from 'src/composables/use-field-auto-save';
import { loadEpisodeManifest, saveEpisodeManifest } from 'src/db/project';
import type { EpisodeManifest } from 'src/core/types';
import { generateText, generateImage as generateImageApi } from 'src/services/ai';
import {
  getPromptThemeOptions,
  getPromptApiBinding,
  getPromptContent,
  getScriptStoryboardPromptId,
  getScriptExpandPromptId,
  getVideoDurationByConfigName,
} from 'src/constants/prompt-bindings';
import { toLocalFileUrl } from 'src/composables/use-local-file-url';
import heroineAvatar from 'src/assets/character/heroine.png';
import leadingActorAvatar from 'src/assets/character/leading_actor.png';
import supportingActressAvatar from 'src/assets/character/SupportingActress.png';
import supportingActorAvatar from 'src/assets/character/SupportingActor.png';
import femaleMinorAvatar from 'src/assets/character/Female_minor_character.png';
import maleSecondaryAvatar from 'src/assets/character/Male_secondary_character.png';

interface StoryboardShot {
  id: string;
  name: string;
  isEditingName: boolean;
  scriptText: string;
  selectedScene: string | null;
  selectedCharacters: string[];
  /** 当前选中的提示词套件ID */
  promptThemeId?: string;
  imagePrompt: string;
  videoPrompt: string;
  imageApiConfig: string;
  videoApiConfig: string;
  generatedImage: string | null;
  generatedVideo: string | null;
  // 语音相关
  audioFileName: string;
  audioStatus: 'pending' | 'generating' | 'completed' | 'error';
  audioApiConfig: string;
  useAudioInVideo: boolean;
  generatedAudioUrl: string | null;
  // 视频配置相关
  videoResolution: string;
  videoFps: string;
  videoMotionIntensity: number;
  videoNegativePrompt: string;
  videoAngleH: string;
  videoAngleV: string;
  videoAngleS: string;
  videoMovement: string;
  videoLighting: string;
  videoDepthOfField: string;
}

const route = useRoute();
const $q = useQuasar();
const workspace = useWorkspaceStore();
const settingsStore = useSettingsStore();

const storyboardShots = ref<StoryboardShot[]>([]);
const showImagePromptDialog = ref(false);
const showVideoPromptDialog = ref(false);
const showImageDialog = ref(false);
const editingImagePrompt = ref('');
const editingVideoPrompt = ref('');
const currentEditingShot = ref<StoryboardShot | null>(null);
const enlargedImage = ref('');

// 视频重新生成相关
const showVideoRegenerateDialog = ref(false);
const videoRegenerateMode = ref<'modify' | 'redraw'>('modify');
const videoModificationText = ref('');
const currentRegeneratingShot = ref<StoryboardShot | null>(null);

const videoRegenerateOptions = [
  { label: '原视频修改', value: 'modify' },
  { label: '完全重新生成（抽卡）', value: 'redraw' },
];

// ── 提示词套件选择 ─────────────────────────────────────────────
const promptThemeOptions = computed(() => getPromptThemeOptions());
const selectedPromptTheme = ref<string>('');

// ── 剧本内容（从剧本页面获取）──────────────────────────────────
const scriptContent = ref('');

// ── 场景和角色选项 ───────────────────────────────────────────
const sceneOptions = computed(() => workspace.scenes);
const characterOptions = computed(() => workspace.characters);

// ── API 配置选项 ──────────────────────────────────────────────
const imageApiOptions = computed(() =>
  (settingsStore.settings.api.customConfigs ?? [])
    .filter((c) => c.serviceType === 'image')
    .map((c) => c.name),
);

const videoApiOptions = computed(() =>
  (settingsStore.settings.api.customConfigs ?? [])
    .filter((c) => c.serviceType === 'video')
    .map((c) => c.name),
);

const audioApiOptions = computed(() =>
  (settingsStore.settings.api.customConfigs ?? [])
    .filter((c) => c.serviceType === 'tts')
    .map((c) => c.name),
);

// ── 视频配置选项 ──────────────────────────────────────────────
const angleSOptions = [
  { label: '特写', value: 'close_up' },
  { label: '中景', value: 'medium' },
  { label: '远景', value: 'wide' },
];

const angleVOptions = [
  { label: '虫眼仰（极低）', value: 'worm' },
  { label: '仰拍（低）', value: 'low' },
  { label: '平视', value: 'eye_level' },
  { label: '俯拍（高）', value: 'high' },
];

const angleHOptions = [
  { label: '正面', value: 'front' },
  { label: '前左斜', value: 'front_left' },
  { label: '左侧', value: 'left' },
  { label: '后左斜', value: 'back_left' },
  { label: '背面', value: 'back' },
  { label: '后右斜', value: 'back_right' },
  { label: '右侧', value: 'right' },
  { label: '前右斜', value: 'front_right' },
];

const movementOptions = [
  { label: '固定', value: 'static' },
  { label: '推镜', value: 'push' },
  { label: '拉镜', value: 'pull' },
  { label: '横摇', value: 'pan' },
  { label: '纵摇', value: 'tilt' },
  { label: '跟镜', value: 'tracking' },
  { label: '升镜', value: 'crane_up' },
  { label: '降镜', value: 'crane_dn' },
  { label: '环绕', value: 'orbit' },
  { label: '手持', value: 'handheld' },
];

const lightingOptions = [
  { label: '自然光', value: 'natural' },
  { label: '顺光', value: 'front' },
  { label: '侧光', value: 'side' },
  { label: '逆光', value: 'backlit' },
  { label: '顶光', value: 'top' },
  { label: '底光', value: 'under' },
  { label: '柔光', value: 'soft' },
  { label: '戏剧光', value: 'dramatic' },
  { label: '黄金时段', value: 'golden_hour' },
  { label: '蓝调时刻', value: 'blue_hour' },
  { label: '夜景', value: 'night' },
  { label: '霓虹', value: 'neon' },
];

const depthOfFieldOptions = [
  { label: '极浅景深', value: 'extreme_shallow' },
  { label: '浅景深', value: 'shallow' },
  { label: '中景深', value: 'medium' },
  { label: '深景深', value: 'deep' },
];

const episodeId = computed(() => String(route.params.episodeId));

const episodeNumber = computed(() => {
  const episodes = workspace.manifest?.episodes ?? [];
  const episode = episodes.find((ep) => ep.id === episodeId.value);
  return episode?.episodeNumber ?? '第1集';
});

onMounted(async () => {
  await loadStoryboardData();
});

// 自动保存功能 - 基于 blur 事件，离开输入框时自动保存
const storyboardDirty = ref(false);

function markStoryboardDirty() {
  storyboardDirty.value = true;
}

const debouncedSaveStoryboard = useDebounceFn(() => {
  if (!storyboardDirty.value) return;
  void autoSaveStoryboard();
}, 300);

function onStoryboardInputBlur() {
  markStoryboardDirty();
  debouncedSaveStoryboard();
}

async function autoSaveStoryboard() {
  try {
    await saveStoryboardData(true);
    storyboardDirty.value = false;
  } catch (e) {
    console.error('Auto save storyboard failed:', e);
  }
}

async function loadStoryboardData() {
  try {
    const episodeManifest = await loadEpisodeManifest(episodeId.value);
    if (!episodeManifest) return;

    // 从剧本获取剧本内容
    if (episodeManifest.script && episodeManifest.script.length > 0) {
      const firstBlock = episodeManifest.script[0];
      if (firstBlock?.body) {
        scriptContent.value = firstBlock.body;
      }
    }
  } catch (e) {
    console.error('Failed to load storyboard data:', e);
  }
}

async function saveStoryboardData(silent = false) {
  try {
    const episodeManifest = await loadEpisodeManifest(episodeId.value);
    if (!episodeManifest) return;
    // TODO: 保存分镜数据到 episodeManifest
    await saveEpisodeManifest(episodeId.value, episodeManifest);
  } catch (e) {
    if (!silent) {
      const msg = e instanceof Error ? e.message : String(e);
      $q.notify({ type: 'negative', message: `保存失败: ${msg}` });
    }
  }
}

// 从剧本生成AI分镜
async function generateStoryboardFromScript() {
  if (!scriptContent.value.trim()) {
    $q.notify({ type: 'warning', message: '剧本内容为空，请先在剧本页面生成剧本' });
    return;
  }

  const scriptLength = scriptContent.value.trim().length;
  if (scriptLength < 50) {
    $q.notify({ type: 'warning', message: '剧本内容过短（少于50字），请先生成更完整的剧本' });
    return;
  }

  if (!selectedPromptTheme.value) {
    $q.notify({ type: 'warning', message: '请先选择提示词套件' });
    return;
  }

  // 获取提示词ID
  const promptId = getScriptStoryboardPromptId(selectedPromptTheme.value);

  // 获取提示词绑定的 API 配置
  const apiConfigName = getPromptApiBinding(promptId);
  if (!apiConfigName) {
    $q.notify({ type: 'warning', message: '请先在设置中为该提示词绑定文本生成接口' });
    return;
  }

  // 获取视频生成时长
  const videoDuration = getVideoDurationByConfigName(apiConfigName);
  if (!videoDuration) {
    $q.notify({ type: 'warning', message: '请先在设置中配置视频生成接口的时长' });
    return;
  }

  // 获取提示词内容
  const promptContent = getPromptContent(promptId, selectedPromptTheme.value);
  if (!promptContent) {
    $q.notify({ type: 'warning', message: '请先在设置中配置分镜生成提示词' });
    return;
  }

  // 获取扩写提示词（用于内容过少时扩写）
  const expandPromptId = getScriptExpandPromptId(selectedPromptTheme.value);
  const expandPromptContent = getPromptContent(expandPromptId, selectedPromptTheme.value);

  try {
    $q.loading.show({ message: '正在处理剧本...' });

    let processedScript = scriptContent.value.trim();

    // 判断是否需要扩写：字数少于200字时先扩写
    if (scriptLength < 200 && expandPromptContent) {
      // 先关闭再重新显示新消息
      $q.loading.hide();
      $q.loading.show({ message: '剧本内容较少，正在扩写...' });

      const expandPrompt = `${expandPromptContent}\n\n【原始剧本】\n${processedScript}`;
      const expandResult = await generateText({ prompt: expandPrompt }, apiConfigName);
      processedScript = expandResult.text.trim();

      $q.notify({
        type: 'info',
        message: '剧本已自动扩写',
        timeout: 2000,
      });

      // 继续处理时再次显示加载中
      $q.loading.show({ message: '正在生成分镜...' });
    }

    // 组装分镜提示词
    const prompt = `${promptContent}\n\n【视频生成参数】\n单个视频片段时长：${videoDuration}秒\n\n【剧本内容】\n${processedScript}`;

    // 调用AI进行分镜
    const result = await generateText({ prompt }, apiConfigName);

    // 解析返回的分镜列表
    const parsedShots = parseShotsFromResult(result.text);

    if (parsedShots.length === 0) {
      $q.notify({ type: 'warning', message: '未能解析分镜，请检查提示词配置' });
      return;
    }

    // 创建分镜对象
    storyboardShots.value = parsedShots.map((shot, index) =>
      createShot(shot.name || `分镜${index + 1}`, shot.scriptText || ''),
    );

    $q.notify({
      type: 'positive',
      message: `成功生成 ${parsedShots.length} 个分镜`,
    });

    // 自动保存
    await saveStoryboardData(true);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', message: `生成失败：${msg}` });
  } finally {
    $q.loading.hide();
  }
}

// 解析分镜结果
function parseShotsFromResult(text: string): Array<{ name?: string; scriptText?: string }> {
  try {
    // 尝试解析 JSON
    const cleanText = text.trim().replace(/^```json\n?|```$/g, '');
    const parsed = JSON.parse(cleanText);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (parsed.shots && Array.isArray(parsed.shots)) {
      return parsed.shots;
    }
  } catch {
    // JSON 解析失败，尝试按行拆分
    const lines = text.split('\n').filter((line) => line.trim());
    const shots: Array<{ name?: string; scriptText?: string }> = [];
    let currentShot: { name?: string; scriptText?: string } = {};

    for (const line of lines) {
      // 检测分镜标记，如 "分镜1:" 或 "镜头1:" 等
      const shotMatch = line.match(/^(分镜|镜头|shot|scene)\s*(\d+)\s*[:：]/i);
      if (shotMatch) {
        if (currentShot.name || currentShot.scriptText) {
          shots.push(currentShot);
        }
        currentShot = { name: line };
      } else if (currentShot.name) {
        currentShot.scriptText = (currentShot.scriptText || '') + '\n' + line;
      } else {
        currentShot.name = line;
      }
    }

    if (currentShot.name || currentShot.scriptText) {
      shots.push(currentShot);
    }

    return shots;
  }

  return [];
}

// 创建分镜对象
function createShot(name: string, scriptText: string = '', audioFileName: string = ''): StoryboardShot {
  return {
    id: crypto.randomUUID(),
    name,
    isEditingName: false,
    scriptText,
    selectedScene: null,
    selectedCharacters: [],
    imagePrompt: '',
    videoPrompt: '',
    imageApiConfig: imageApiOptions.value[0] || '',
    videoApiConfig: videoApiOptions.value[0] || '',
    generatedImage: null,
    generatedVideo: null,
    // 语音相关
    audioFileName: audioFileName || '',
    audioStatus: 'pending',
    audioApiConfig: audioApiOptions.value[0] || '',
    useAudioInVideo: false,
    generatedAudioUrl: null,
    // 视频配置相关
    videoResolution: '720p',
    videoFps: '30',
    videoMotionIntensity: 5,
    videoNegativePrompt: '模糊, 变形, 低质量, 失真, 错误的手部, 畸变, 抖动, 闪烁, 噪点',
    videoAngleH: 'front',
    videoAngleV: 'eye_level',
    videoAngleS: 'medium',
    videoMovement: 'static',
    videoLighting: 'natural',
    videoDepthOfField: 'medium',
  };
}

// 添加新分镜
function addNewShot() {
  const newShot = createShot(`分镜 ${storyboardShots.value.length + 1}`);
  storyboardShots.value.push(newShot);
}

// 复制分镜
function duplicateShot(index: number) {
  const original = storyboardShots.value[index];
  if (!original) return;

  const duplicated: StoryboardShot = {
    id: crypto.randomUUID(),
    name: `${original.name} (副本)`,
    isEditingName: false,
    scriptText: original.scriptText || '',
    selectedScene: original.selectedScene,
    selectedCharacters: [...(original.selectedCharacters || [])],
    imagePrompt: original.imagePrompt || '',
    videoPrompt: original.videoPrompt || '',
    imageApiConfig: original.imageApiConfig || '',
    videoApiConfig: original.videoApiConfig || '',
    generatedImage: null,
    generatedVideo: null,
    // 语音相关
    audioFileName: original.audioFileName ? `${original.audioFileName} (副本)` : '',
    audioStatus: 'pending',
    audioApiConfig: original.audioApiConfig || '',
    useAudioInVideo: false,
    generatedAudioUrl: null,
    // 视频配置相关
    videoResolution: original.videoResolution || '720p',
    videoFps: original.videoFps || '30',
    videoMotionIntensity: original.videoMotionIntensity || 5,
    videoNegativePrompt: original.videoNegativePrompt || '',
    videoAngleH: original.videoAngleH || 'front',
    videoAngleV: original.videoAngleV || 'eye_level',
    videoAngleS: original.videoAngleS || 'medium',
    videoMovement: original.videoMovement || 'static',
    videoLighting: original.videoLighting || 'natural',
    videoDepthOfField: original.videoDepthOfField || 'medium',
  };
  storyboardShots.value.splice(index + 1, 0, duplicated);
}

// 删除分镜
function deleteShot(index: number) {
  const shot = storyboardShots.value[index];
  if (!shot) return;

  $q.dialog({
    title: '确认删除',
    message: `确定要删除"${shot.name}"吗？`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    storyboardShots.value.splice(index, 1);
  });
}

// AI 生成单个分镜剧本
async function generateScriptText(shot: StoryboardShot) {
  const themeId = shot.promptThemeId;
  if (!themeId) {
    $q.notify({ type: 'warning', message: '请先为该分镜选择提示词套件' });
    return;
  }

  if (!scriptContent.value.trim()) {
    $q.notify({ type: 'warning', message: '剧本内容为空' });
    return;
  }

  // 获取提示词ID（使用分镜生成提示词）
  const promptId = getScriptStoryboardPromptId(themeId);
  const apiConfigName = getPromptApiBinding(promptId);

  if (!apiConfigName) {
    $q.notify({ type: 'warning', message: '请先在设置中为该提示词绑定接口' });
    return;
  }

  const promptContent = getPromptContent(promptId, themeId);
  if (!promptContent) {
    $q.notify({ type: 'warning', message: '请先在设置中配置分镜生成提示词' });
    return;
  }

  try {
    const prompt = `${promptContent}\n\n【剧本内容】\n${scriptContent.value.trim()}\n\n请为第 "${shot.name}" 生成详细的剧本文本。`;
    const result = await generateText({ prompt }, apiConfigName);
    shot.scriptText = result.text.trim();
    $q.notify({ type: 'positive', message: '剧本生成成功' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', message: `生成失败：${msg}` });
  }
}

// 编辑图片提示词
function editImagePrompt(shot: StoryboardShot) {
  currentEditingShot.value = shot;
  editingImagePrompt.value = shot.imagePrompt;
  showImagePromptDialog.value = true;
}

function saveImagePrompt() {
  if (currentEditingShot.value) {
    currentEditingShot.value.imagePrompt = editingImagePrompt.value;
  }
  showImagePromptDialog.value = false;
}

// 编辑视频提示词
function editVideoPrompt(shot: StoryboardShot) {
  currentEditingShot.value = shot;
  editingVideoPrompt.value = shot.videoPrompt;
  showVideoPromptDialog.value = true;
}

function saveVideoPrompt() {
  if (currentEditingShot.value) {
    currentEditingShot.value.videoPrompt = editingVideoPrompt.value;
  }
  showVideoPromptDialog.value = false;
}

// 生成图片
async function generateImage(shot: StoryboardShot) {
  if (!shot.imagePrompt) {
    $q.notify({ type: 'warning', message: '请先编辑图片提示词' });
    return;
  }

  if (!shot.imageApiConfig) {
    $q.notify({ type: 'warning', message: '请先选择图片生成接口' });
    return;
  }

  try {
    $q.loading.show({ message: '正在生成图片...' });

    const response = await generateImageApi(
      {
        prompt: shot.imagePrompt,
        n: 1,
        width: 1024,
        height: 1024,
      },
      shot.imageApiConfig,
    );

    if (response && response.images && response.images.length > 0) {
      shot.generatedImage = response.images[0] ?? null;
      $q.notify({ type: 'positive', message: '图片生成成功' });
    } else {
      $q.notify({ type: 'warning', message: '未生成图片，请检查接口配置' });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', message: `生成失败：${msg}` });
  } finally {
    $q.loading.hide();
  }
}

// 上传图片
async function uploadImage(_shot: StoryboardShot) {
  // TODO: 实现图片上传逻辑
  void _shot;
  await Promise.resolve();
  $q.notify({ type: 'info', message: '上传功能待实现' });
}

// 点击视频生成按钮
function handleVideoGenerateClick(shot: StoryboardShot) {
  if (shot.generatedVideo) {
    // 已有视频，显示重新生成弹窗
    currentRegeneratingShot.value = shot;
    videoRegenerateMode.value = 'modify';
    videoModificationText.value = '';
    showVideoRegenerateDialog.value = true;
  } else {
    // 没有视频，直接生成
    generateVideo(shot);
  }
}

// 确认视频重新生成
function confirmVideoRegenerate() {
  if (!currentRegeneratingShot.value) return;

  const mode = videoRegenerateMode.value;
  const modification = videoModificationText.value.trim();

  // TODO: 根据 mode 和 modification 拼接提示词，然后调用生成逻辑
  // mode === 'modify' : 原视频修改，将 modification 拼接到提示词
  // mode === 'redraw' : 完全重新生成（抽卡）

  console.log('视频重新生成模式:', mode);
  console.log('修改内容:', modification);

  showVideoRegenerateDialog.value = false;
  currentRegeneratingShot.value = null;
}

// 取消视频重新生成
function cancelVideoRegenerate() {
  showVideoRegenerateDialog.value = false;
  currentRegeneratingShot.value = null;
  videoModificationText.value = '';
}

// 生成视频
async function generateVideo(shot: StoryboardShot) {
  if (!shot.videoApiConfig) {
    $q.notify({ type: 'warning', message: '请先选择视频生成接口' });
    return;
  }

  // TODO: 实现视频生成逻辑
  void shot; // 使用 shot 参数避免未使用警告
  await Promise.resolve(); // 占位，等待实现
  $q.notify({ type: 'info', message: '视频生成功能待实现' });
}

// 放大图片
function enlargeImage(imageUrl: string) {
  enlargedImage.value = imageUrl;
  showImageDialog.value = true;
}

// 获取角色头像
function getCharacterAvatar(character: { gender?: string; role?: string }): string {
  const isFemale = character.gender === '女';
  const role = character.role;

  if (role === '主角') {
    return isFemale ? heroineAvatar : leadingActorAvatar;
  } else if (role === '配角') {
    return isFemale ? supportingActressAvatar : supportingActorAvatar;
  } else {
    return isFemale ? femaleMinorAvatar : maleSecondaryAvatar;
  }
}

// 获取场景图片
function getSceneImage(scene: { imagePath?: string }): string {
  if (!scene.imagePath || !workspace.rootPath) return '';
  return toLocalFileUrl(`${workspace.rootPath}/${scene.imagePath}`);
}

// 截断文本
function truncateText(text: string, maxLength: number): string {
  if (!text) return '(未设置)';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// 获取语音状态文本
function getAudioStatusText(status: StoryboardShot['audioStatus']): string {
  switch (status) {
    case 'pending':
      return '未生成';
    case 'generating':
      return '生成中...';
    case 'completed':
      return '已生成';
    case 'error':
      return '生成失败';
    default:
      return '未生成';
  }
}

// 生成语音
async function generateAudio(shot: StoryboardShot) {
  if (!shot.scriptText.trim()) {
    $q.notify({ type: 'warning', message: '剧本内容为空，无法生成语音' });
    return;
  }

  if (!shot.audioApiConfig) {
    $q.notify({ type: 'warning', message: '请先选择语音接口' });
    return;
  }

  // 设置默认文件名
  if (!shot.audioFileName) {
    shot.audioFileName = `${episodeNumber.value}分镜${storyboardShots.value.indexOf(shot) + 1}`;
  }

  shot.audioStatus = 'generating';

  try {
    $q.loading.show({ message: '正在生成语音...' });

    // TODO: 调用语音生成接口
    // const response = await generateTts({ text: shot.scriptText }, shot.audioApiConfig);
    // shot.generatedAudioUrl = response.audioUrl;

    // 模拟生成（待实现）
    await new Promise((resolve) => setTimeout(resolve, 1000));

    shot.audioStatus = 'completed';
    shot.useAudioInVideo = true;

    $q.notify({ type: 'positive', message: '语音生成成功' });
  } catch (e) {
    shot.audioStatus = 'error';
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', message: `生成失败：${msg}` });
  } finally {
    $q.loading.hide();
  }
}
</script>

<style scoped>
.itimo-produce-header {
  margin-bottom: 12px;
}

.itimo-storyboard-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.itimo-storyboard-card {
  background: var(--itimo-bg-secondary);
  border: 1px solid var(--itimo-surface-border);
  border-radius: 12px;
  overflow: hidden;
}

.itimo-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--itimo-bg-primary);
  border-bottom: 1px solid var(--itimo-surface-border);
}

.itimo-card-body {
  padding: 20px;
}

.itimo-shot-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.itimo-shot-number {
  font-weight: 600;
  color: var(--itimo-text-primary);
  background: var(--itimo-bg-primary);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
}

.itimo-shot-name-edit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.itimo-shot-name {
  font-weight: 500;
  color: var(--itimo-text-primary);
}

.itimo-shot-name-input {
  min-width: 150px;
}

/* 内容布局 */
.itimo-shot-content-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.itimo-media-row {
  margin-bottom: 0;
}

/* 语音区域 */
.itimo-audio-row {
  padding: 12px 16px;
  background: var(--itimo-bg-tertiary);
  border-radius: 8px;
  margin-bottom: 20px;
}

.itimo-audio-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.itimo-audio-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.itimo-audio-label {
  font-weight: 500;
  color: var(--itimo-text-primary);
  margin-left: 4px;
}

.itimo-audio-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.itimo-audio-name {
  font-weight: 500;
  color: var(--itimo-text-primary);
}

.itimo-audio-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  background: var(--itimo-bg-secondary);
}

.itimo-audio-status-pending {
  color: var(--itimo-text-secondary);
}

.itimo-audio-status-generating {
  color: var(--itimo-primary);
  background: rgba(var(--itimo-primary-rgb), 0.1);
}

.itimo-audio-status-completed {
  color: var(--itimo-positive);
  background: rgba(0, 128, 0, 0.1);
}

.itimo-audio-status-error {
  color: var(--itimo-negative);
  background: rgba(255, 0, 0, 0.1);
}

.itimo-audio-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 分镜剧本 */
.itimo-script-section {
  flex: 1;
  min-width: 0;
}

.itimo-script-input {
  margin-top: 8px;
}

/* 配置区域 */
.itimo-config-section {
  width: 280px;
  flex-shrink: 0;
}

.itimo-config-row {
  margin-bottom: 12px;
}

.itimo-config-label {
  font-weight: 500;
  color: var(--itimo-text-secondary);
  font-size: 0.85rem;
  margin-bottom: 4px;
  display: block;
}

.itimo-config-select {
  width: 100%;
}

.itimo-config-thumb {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
}

/* 媒体区域 */
.itimo-media-section {
  flex: 1;
  min-width: 0;
}

.itimo-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.itimo-section-title {
  font-weight: 600;
  color: var(--itimo-text-primary);
  font-size: 0.95rem;
}

.itimo-media-display {
  border: 2px dashed var(--itimo-surface-border);
  border-radius: 8px;
  overflow: hidden;
  cursor: zoom-in;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--itimo-bg-primary);
}

.itimo-media-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px;
  color: var(--itimo-text-secondary);
}

.itimo-image-container {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.itimo-image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.itimo-video-container {
  width: 100%;
}

.itimo-video-container video {
  width: 100%;
  max-height: 200px;
}

/* 提示词编辑 */
.itimo-prompt-editor {
  margin-top: 12px;
  padding: 12px;
  background: var(--itimo-bg-primary);
  border-radius: 8px;
  border: 1px solid var(--itimo-surface-border);
}

.itimo-prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.itimo-prompt-label {
  font-weight: 500;
  color: var(--itimo-text-secondary);
  font-size: 0.85rem;
}

.itimo-prompt-preview {
  font-size: 0.85rem;
  color: var(--itimo-text-secondary);
  line-height: 1.4;
}

/* 空状态 */
.itimo-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: var(--itimo-bg-secondary);
  border-radius: 12px;
  border: 2px dashed var(--itimo-surface-border);
}

.itimo-empty-text {
  color: var(--itimo-text-secondary);
  margin-top: 16px;
  text-align: center;
}

/* 图片放大查看 */
.itimo-viewer-container {
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
  position: relative;
}

.itimo-viewer-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(4px);
}

.itimo-viewer-close-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.itimo-viewer-content {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.itimo-viewer-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 视频配置标签 */
.itimo-config-label {
  display: block;
  font-weight: 500;
  color: var(--itimo-text-primary);
  font-size: 0.9rem;
  margin-bottom: 4px;
}
</style>
