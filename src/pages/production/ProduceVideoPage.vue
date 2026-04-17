<template>
  <div class="itimo-produce-page">
    <!-- Page Header -->
    <div class="itimo-produce-header">
      <div class="row items-center gap-md">
        <h3>生成队列</h3>
        <span class="itimo-episode-badge">{{ episodeNumber }}</span>
      </div>
      <p class="itimo-produce-subtitle">查看语音和视频的生成进度，支持批量管理和一键合成</p>
    </div>

    <!-- 语音生成部分 -->
    <section class="itimo-produce-section">
      <div class="itimo-section-card">
        <div class="itimo-card-header">
          <h2 class="itimo-card-title">语音生成</h2>
          <div class="row q-gutter-sm">
            <q-btn flat dense icon="folder_open" size="sm" @click="openAudioFolder">
              <q-tooltip>打开文件夹</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              icon="stop"
              size="sm"
              color="negative"
              :disable="!hasGeneratingAudio"
              @click="stopAllAudio"
            >
              <q-tooltip>停止全部</q-tooltip>
            </q-btn>
          </div>
        </div>
        <div class="itimo-card-body">
          <div v-if="audioQueue.length > 0" class="itimo-generate-grid">
            <div v-for="item in audioQueue" :key="item.id" class="itimo-generate-card">
              <div class="itimo-generate-card-header">
                <span class="itimo-generate-name">{{ item.name }}</span>
                <q-chip
                  :color="getAudioStatusColor(item.status)"
                  text-color="white"
                  size="sm"
                  dense
                >
                  {{ getAudioStatusText(item.status) }}
                </q-chip>
              </div>
              <div class="itimo-generate-card-body">
                <div v-if="item.status === 'generating'" class="itimo-generate-loading">
                  <q-spinner-dots color="primary" size="40px" />
                  <span class="itimo-loading-text">生成中...</span>
                </div>
                <div v-else-if="item.status === 'completed'" class="itimo-generate-preview">
                  <audio :src="item.url" controls class="itimo-audio-player" />
                </div>
                <div v-else class="itimo-generate-placeholder">
                  <q-icon name="audiotrack" size="32px" color="grey-5" />
                </div>
              </div>
              <div class="itimo-generate-card-footer">
                <q-btn
                  v-if="item.status === 'generating'"
                  flat
                  dense
                  color="negative"
                  icon="stop"
                  label="停止"
                  size="sm"
                  @click="stopAudio(item)"
                />
                <q-btn
                  v-else-if="item.status === 'completed'"
                  flat
                  dense
                  color="primary"
                  icon="refresh"
                  label="重新生成"
                  size="sm"
                  @click="regenerateAudio(item)"
                />
                <span v-else class="itimo-waiting-text">等待生成</span>
              </div>
            </div>
          </div>
          <div v-else class="itimo-empty-state">
            <q-icon name="audiotrack" size="48px" color="grey-5" />
            <p>暂无语音生成任务</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 视频生成部分 -->
    <section class="itimo-produce-section">
      <div class="itimo-section-card">
        <div class="itimo-card-header">
          <h2 class="itimo-card-title">视频生成</h2>
          <div class="row q-gutter-sm">
            <q-btn flat dense icon="folder_open" size="sm" @click="openVideoFolder">
              <q-tooltip>打开文件夹</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              icon="stop"
              size="sm"
              color="negative"
              :disable="!hasGeneratingVideo"
              @click="stopAllVideo"
            >
              <q-tooltip>停止全部</q-tooltip>
            </q-btn>
          </div>
        </div>
        <div class="itimo-card-body">
          <div v-if="videoQueue.length > 0" class="itimo-generate-grid">
            <div v-for="item in videoQueue" :key="item.id" class="itimo-generate-card">
              <div class="itimo-generate-card-header">
                <span class="itimo-generate-name">{{ item.name }}</span>
                <q-chip
                  :color="getVideoStatusColor(item.status)"
                  text-color="white"
                  size="sm"
                  dense
                >
                  {{ getVideoStatusText(item.status) }}
                </q-chip>
              </div>
              <div class="itimo-generate-card-body">
                <div v-if="item.status === 'generating'" class="itimo-generate-loading">
                  <q-spinner-dots color="primary" size="40px" />
                  <span class="itimo-loading-text">生成中...</span>
                </div>
                <div v-else-if="item.status === 'completed'" class="itimo-generate-preview itimo-video-preview">
                  <video :src="item.url" controls class="itimo-video-player" />
                </div>
                <div v-else class="itimo-generate-placeholder">
                  <q-icon name="videocam" size="32px" color="grey-5" />
                </div>
              </div>
              <div class="itimo-generate-card-footer">
                <q-btn
                  v-if="item.status === 'generating'"
                  flat
                  dense
                  color="negative"
                  icon="stop"
                  label="停止"
                  size="sm"
                  @click="stopVideo(item)"
                />
                <q-btn
                  v-else-if="item.status === 'completed'"
                  flat
                  dense
                  color="primary"
                  icon="refresh"
                  label="重新生成"
                  size="sm"
                  @click="regenerateVideo(item)"
                />
                <span v-else class="itimo-waiting-text">等待生成</span>
              </div>
            </div>
          </div>
          <div v-else class="itimo-empty-state">
            <q-icon name="videocam" size="48px" color="grey-5" />
            <p>暂无视频生成任务</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 视频合并部分 -->
    <section class="itimo-produce-section">
      <div class="itimo-section-card">
        <div class="itimo-card-header">
          <h2 class="itimo-card-title">视频合成</h2>
          <div class="itimo-card-actions">
            <q-btn
              color="primary"
              unelevated
              rounded
              icon="movie_creation"
              label="一键合成"
              :disable="completedVideoCount < 2"
              @click="mergeVideos"
            />
          </div>
        </div>
        <div class="itimo-card-body">
          <div class="itimo-merge-info">
            <div class="itimo-merge-stat">
              <span class="itimo-merge-label">已完成视频</span>
              <span class="itimo-merge-value">{{ completedVideoCount }} 个</span>
            </div>
            <div class="itimo-merge-stat">
              <span class="itimo-merge-label">生成中视频</span>
              <span class="itimo-merge-value">{{ generatingVideoCount }} 个</span>
            </div>
            <div class="itimo-merge-stat">
              <span class="itimo-merge-label">待生成视频</span>
              <span class="itimo-merge-value">{{ pendingVideoCount }} 个</span>
            </div>
          </div>
          <p class="itimo-merge-hint">
            <q-icon name="info" size="xs" />
            {{ mergeHintText }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useWorkspaceStore } from 'src/stores/workspace-store';

interface AudioItem {
  id: string;
  name: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  url?: string;
  progress?: number;
}

interface VideoItem {
  id: string;
  name: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  url?: string;
  progress?: number;
}

const route = useRoute();
const $q = useQuasar();
const workspace = useWorkspaceStore();

const audioQueue = ref<AudioItem[]>([]);
const videoQueue = ref<VideoItem[]>([]);

const episodeId = computed(() => String(route.params.episodeId));

const episodeNumber = computed(() => {
  const episodes = workspace.manifest?.episodes ?? [];
  const episode = episodes.find((ep) => ep.id === episodeId.value);
  return episode?.episodeNumber ?? '第1集';
});

// 计算属性
const hasGeneratingAudio = computed(() => audioQueue.value.some((item) => item.status === 'generating'));
const hasGeneratingVideo = computed(() => videoQueue.value.some((item) => item.status === 'generating'));

const completedVideoCount = computed(() => videoQueue.value.filter((v) => v.status === 'completed').length);
const generatingVideoCount = computed(() => videoQueue.value.filter((v) => v.status === 'generating').length);
const pendingVideoCount = computed(() => videoQueue.value.filter((v) => v.status === 'pending').length);

const mergeHintText = computed(() => {
  if (generatingVideoCount.value > 0) {
    return '有视频正在生成中，可以选择只合成已完成视频';
  }
  if (completedVideoCount.value < 2) {
    return '需要至少2个已完成视频才能进行合成';
  }
  return '点击"一键合成"将所有视频合并为一个';
});

onMounted(() => {
  loadQueueData();
});
function loadQueueData() {
  audioQueue.value = [
    {
      id: '1',
      name: `${episodeNumber.value}分镜1语音`,
      status: 'completed',
      url: '',
    },
    {
      id: '2',
      name: `${episodeNumber.value}分镜2语音`,
      status: 'generating',
    },
    {
      id: '3',
      name: `${episodeNumber.value}分镜3语音`,
      status: 'pending',
    },
  ];

  videoQueue.value = [
    {
      id: '1',
      name: `${episodeNumber.value}分镜1视频`,
      status: 'completed',
      url: '',
    },
    {
      id: '2',
      name: `${episodeNumber.value}分镜2视频`,
      status: 'generating',
    },
    {
      id: '3',
      name: `${episodeNumber.value}分镜3视频`,
      status: 'pending',
    },
  ];
}

// 语音状态相关
function getAudioStatusColor(status: AudioItem['status']): string {
  switch (status) {
    case 'generating':
      return 'primary';
    case 'completed':
      return 'positive';
    case 'error':
      return 'negative';
    default:
      return 'grey';
  }
}

function getAudioStatusText(status: AudioItem['status']): string {
  switch (status) {
    case 'generating':
      return '生成中';
    case 'completed':
      return '已完成';
    case 'error':
      return '失败';
    default:
      return '等待';
  }
}

// 视频状态相关
function getVideoStatusColor(status: VideoItem['status']): string {
  switch (status) {
    case 'generating':
      return 'primary';
    case 'completed':
      return 'positive';
    case 'error':
      return 'negative';
    default:
      return 'grey';
  }
}

function getVideoStatusText(status: VideoItem['status']): string {
  switch (status) {
    case 'generating':
      return '生成中';
    case 'completed':
      return '已完成';
    case 'error':
      return '失败';
    default:
      return '等待';
  }
}

// 语音操作
function stopAudio(item: AudioItem) {
  item.status = 'pending';
  $q.notify({ type: 'info', message: `已停止生成：${item.name}` });
}

function regenerateAudio(item: AudioItem) {
  item.status = 'generating';
  $q.notify({ type: 'info', message: `正在重新生成：${item.name}` });
  // TODO: 调用语音生成接口
}

// 打开语音文件夹
function openAudioFolder() {
  // TODO: 调用 Electron API 打开文件夹
  $q.notify({ type: 'info', message: '打开语音文件夹' });
}

// 停止所有语音
function stopAllAudio() {
  audioQueue.value.forEach((item) => {
    if (item.status === 'generating') {
      item.status = 'pending';
    }
  });
  $q.notify({ type: 'info', message: '已停止所有语音生成' });
}

// 视频操作
function stopVideo(item: VideoItem) {
  item.status = 'pending';
  $q.notify({ type: 'info', message: `已停止生成：${item.name}` });
}

function regenerateVideo(item: VideoItem) {
  item.status = 'generating';
  $q.notify({ type: 'info', message: `正在重新生成：${item.name}` });
  // TODO: 调用视频生成接口
}

// 打开视频文件夹
function openVideoFolder() {
  // TODO: 调用 Electron API 打开文件夹
  $q.notify({ type: 'info', message: '打开视频文件夹' });
}

// 停止所有视频
function stopAllVideo() {
  videoQueue.value.forEach((item) => {
    if (item.status === 'generating') {
      item.status = 'pending';
    }
  });
  $q.notify({ type: 'info', message: '已停止所有视频生成' });
}

// 视频合成
async function mergeVideos() {
  if (generatingVideoCount.value > 0) {
    $q.dialog({
      title: '确认合成',
      message: '有视频正在生成中，是否只合成已完成视频？',
      cancel: true,
      persistent: true,
    }).onOk(() => {
      void doMergeVideos();
    });
  } else if (completedVideoCount.value < 2) {
    $q.notify({ type: 'warning', message: '需要至少2个已完成视频才能进行合成' });
  } else {
    await doMergeVideos();
  }
}

async function doMergeVideos() {
  try {
    $q.loading.show({ message: '正在合成视频...' });
    // TODO: 调用视频合成接口
    await new Promise((resolve) => setTimeout(resolve, 2000));
    $q.loading.hide();
    $q.notify({ type: 'positive', message: '视频合成成功' });
  } catch (e) {
    $q.loading.hide();
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', message: `合成失败：${msg}` });
  }
}
</script>

<style scoped>
.itimo-produce-header {
  margin-bottom: 12px;
}

.itimo-generate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.itimo-generate-card {
  background: var(--itimo-bg-primary);
  border: 1px solid var(--itimo-surface-border);
  border-radius: 8px;
  overflow: hidden;
}

.itimo-generate-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--itimo-bg-secondary);
  border-bottom: 1px solid var(--itimo-surface-border);
}

.itimo-generate-name {
  font-weight: 500;
  color: var(--itimo-text-primary);
  font-size: 0.9rem;
}

.itimo-generate-card-body {
  padding: 16px;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.itimo-generate-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.itimo-loading-text {
  font-size: 0.85rem;
  color: var(--itimo-text-secondary);
}

.itimo-generate-preview {
  width: 100%;
}

.itimo-audio-player {
  width: 100%;
  height: 40px;
}

.itimo-video-preview {
  background: #000;
  border-radius: 4px;
  overflow: hidden;
}

.itimo-video-player {
  width: 100%;
  max-height: 160px;
}

.itimo-generate-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 60px;
  background: var(--itimo-bg-tertiary);
  border-radius: 4px;
}

.itimo-generate-card-footer {
  padding: 8px 16px;
  border-top: 1px solid var(--itimo-surface-border);
  display: flex;
  justify-content: center;
}

.itimo-waiting-text {
  font-size: 0.85rem;
  color: var(--itimo-text-secondary);
}

/* 视频合并 */
.itimo-merge-info {
  display: flex;
  gap: 24px;
  padding: 16px 0;
}

.itimo-merge-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.itimo-merge-label {
  font-size: 0.85rem;
  color: var(--itimo-text-secondary);
}

.itimo-merge-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--itimo-text-primary);
}

.itimo-merge-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--itimo-bg-tertiary);
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--itimo-text-secondary);
  margin: 0;
}

/* 空状态 */
.itimo-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--itimo-text-secondary);
}

.itimo-empty-state p {
  margin-top: 12px;
  font-size: 0.9rem;
}
</style>
