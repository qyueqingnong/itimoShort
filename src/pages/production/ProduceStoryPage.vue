<template>
  <div class="itimo-produce-page">
    <!-- Page Header -->
    <div class="itimo-produce-header">
      <div class="row items-center gap-md">
        <h3 class="">故事</h3>
        <span class="itimo-episode-badge">{{ episodeNumber }}</span>
      </div>
      <!-- Project Type Info -->
      <div class="itimo-project-type-info" style="margin-bottom: 30px">
        <div class="itimo-type-row">
          <span class="itimo-type-label">基础材质：</span>
          <span class="itimo-type-value">{{ materialTypeLabel }}</span>
        </div>
        <div class="itimo-type-row">
          <span class="itimo-type-label">核心画风：</span>
          <span class="itimo-type-value">{{ artStyleLabel }}</span>
        </div>
        <div class="itimo-type-row">
          <span class="itimo-type-label">氛围画风：</span>
          <span class="itimo-type-value">{{ moodAtmosphereLabel }}</span>
        </div>
      </div>
      <p class="itimo-produce-subtitle">输入一句话用于生成故事，或输入故事用于扩写！</p>
    </div>

    <!-- AI Generation Section (Collapsible) - MOVED TO FRONT -->
    <section class="itimo-produce-section">
      <div class="itimo-section-card">
        <div class="itimo-card-header">
          <h2 class="itimo-card-title">AI 生成故事</h2>
          <q-btn
            flat
            round
            dense
            :icon="showAiGeneration ? 'expand_less' : 'expand_more'"
            @click="showAiGeneration = !showAiGeneration"
          >
            <q-tooltip>{{ showAiGeneration ? '收起' : '展开' }}</q-tooltip>
          </q-btn>
        </div>

        <div v-show="showAiGeneration" class="itimo-card-body" style="padding: 24px">
          <div class="column q-gutter-md">
            <!-- Input for AI Generation -->
            <q-input
              v-model="aiInputText"
              type="textarea"
              outlined
              label="输入初始内容"
              placeholder="输入一句话或故事梗概..."
              class="itimo-story-textarea"
              :rows="6"
            />

            <!-- Prompt Theme Selection -->

            <!-- Action Buttons -->
            <div class="row justify-end items-center q-gutter-sm">
              <q-select
                v-model="selectedPromptTheme"
                :options="promptThemeOptions"
                option-label="label"
                option-value="id"
                outlined
                dense
                emit-value
                map-options
                label="选择提示词套件"
              >
                <template #prepend>
                  <q-icon name="description" size="xs" />
                </template>
              </q-select>

              <q-btn
                color="primary"
                unelevated
                rounded
                label="AI 生成"
                icon="auto_awesome"
                :disable="isGenerating || !selectedPromptTheme || !aiInputText.trim()"
                :loading="currentGeneratingMode === 'generate'"
                @click="generateStory('generate')"
              />
              <q-btn
                color="info"
                unelevated
                rounded
                label="AI 扩写/润色"
                icon="edit"
                :disable="isGenerating || !selectedPromptTheme || !aiInputText.trim()"
                :loading="currentGeneratingMode === 'expand'"
                @click="generateStory('expand')"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Story Input Section -->
    <section class="itimo-produce-section">
      <p style="margin: 10px 0" class="itimo-produce-subtitle">直接输入完整的故事或小说内容！</p>
      <div class="itimo-section-card">
        <div style="padding: 5px">
          <div class="row items-center justify-between full-width">
            <div style="display: flex; justify-content: left; align-items: center">
              <q-input
                v-model="editingTitle"
                :disable="!isEditingTitle"
                dense
                outlined
                class="itimo-episode-title-input"
              />
            </div>
            <q-btn
              :label="isEditingTitle ? '确定' : '编辑'"
              flat
              no-caps
              color="primary"
              @click="toggleEditTitle"
              class="q-ml-md"
            />
          </div>
        </div>
        <div class="itimo-card-body">
          <q-input
            v-model="storyInput"
            type="textarea"
            outlined
            placeholder="大明永乐二年。"
            class="itimo-story-textarea"
            :rows="6"
          />
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
import { useAutoSave } from 'src/composables/use-auto-save';
import { loadEpisodeManifestFromPath, saveEpisodeManifestFromPath } from 'src/db/project';
import { getElectronApi } from 'src/services/native-fs';
import { labelMaterialType, labelArtStyle, labelMoodAtmosphere } from 'src/constants/drama-options';
import { generateText } from 'src/services/ai';
import {
  StoryFeatureType,
  getPromptThemeOptions,
  getPromptContent,
  getPromptApiBinding,
  getStoryPromptId,
} from 'src/constants/prompt-bindings';

const route = useRoute();
const $q = useQuasar();
const workspace = useWorkspaceStore();

const storyInput = ref('大明永乐二年。');

const isEditingTitle = ref(false);
const editingTitle = ref('');

// AI Generation
const showAiGeneration = ref(false);
const isGenerating = ref(false);
const aiInputText = ref('');
const selectedPromptTheme = ref<string>('');
const currentGeneratingMode = ref<'generate' | 'expand' | null>(null);

// ── 提示词套件选择 ─────────────────────────────────────────────
/** 提示词套件选项（内置 + 用户自建） */
const promptThemeOptions = computed(() => getPromptThemeOptions());

const episodeId = computed(() => String(route.params.episodeId));

const episodeTitle = computed(() => {
  const episodes = workspace.manifest?.episodes ?? [];
  const episode = episodes.find((ep) => ep.id === episodeId.value);
  return episode?.title ?? '默认标题';
});

const episodeNumber = computed(() => {
  const episodes = workspace.manifest?.episodes ?? [];
  const episode = episodes.find((ep) => ep.id === episodeId.value);
  return episode?.episodeNumber ?? '第1集';
});

const materialTypeLabel = computed(() => {
  const materialType = workspace.manifest?.materialType;
  return materialType ? labelMaterialType(materialType) : '未设置';
});

const artStyleLabel = computed(() => {
  const artStyle = workspace.manifest?.artStyle;
  return artStyle ? labelArtStyle(artStyle) : '未设置';
});

const moodAtmosphereLabel = computed(() => {
  const moodAtmosphere = workspace.manifest?.moodAtmosphere;
  return moodAtmosphere ? labelMoodAtmosphere(moodAtmosphere) : '未设置';
});

onMounted(async () => {
  editingTitle.value = episodeTitle.value;
  await loadStoryData();
});

// 自动保存功能
useAutoSave(async () => {
  // 保存标题（如果标题有变化）
  if (editingTitle.value !== episodeTitle.value) {
    await saveTitle(true);
  }
  // 保存故事梗概（静默保存）
  await saveStoryData(true);
});

async function loadStoryData() {
  if (!workspace.rootPath) return;

  try {
    const episodes = workspace.manifest?.episodes ?? [];
    const episode = episodes.find((ep) => ep.id === episodeId.value);
    if (!episode) return;

    const api = getElectronApi();
    if (!api) return;

    const episodeManifest = await loadEpisodeManifestFromPath(workspace.rootPath, episode.folder);

    // 加载故事梗概（从第一个 script block 的 heading）
    if (episodeManifest.script && episodeManifest.script.length > 0) {
      const firstBlock = episodeManifest.script[0];
      if (firstBlock) {
        storyInput.value = firstBlock.heading || '';
      }
    }

    // 加载 AI 输入框数据
    aiInputText.value = episodeManifest.aiInputText || '';
    selectedPromptTheme.value = episodeManifest.aiPromptThemeId || '';
  } catch (e) {
    console.error('Failed to load story data:', e);
  }
}

async function saveStoryData(silent = false) {
  if (!workspace.rootPath) return;

  try {
    const episodes = workspace.manifest?.episodes ?? [];
    const episode = episodes.find((ep) => ep.id === episodeId.value);
    if (!episode) return;

    const api = getElectronApi();
    if (!api) return;

    const episodeManifest = await loadEpisodeManifestFromPath(workspace.rootPath, episode.folder);

    // 保存故事梗概到第一个 script block 的 heading
    if (!episodeManifest.script || episodeManifest.script.length === 0) {
      episodeManifest.script = [
        {
          id: crypto.randomUUID(),
          heading: storyInput.value,
          body: '',
        },
      ];
    } else if (episodeManifest.script[0]) {
      episodeManifest.script[0].heading = storyInput.value;
    }

    // 保存 AI 输入框数据
    episodeManifest.aiInputText = aiInputText.value;
    episodeManifest.aiPromptThemeId = selectedPromptTheme.value;

    await saveEpisodeManifestFromPath(workspace.rootPath, episode.folder, episodeManifest);

    if (!silent) {
      $q.notify({
        type: 'positive',
        message: '故事内容已保存',
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', timeout: 1000, message: `保存失败: ${msg}` });
  }
}

function toggleEditTitle() {
  if (isEditingTitle.value) {
    // 保存标题
    void saveTitle();
  } else {
    // 进入编辑模式
    isEditingTitle.value = true;
  }
}

async function saveTitle(silent = false) {
  if (!workspace.manifest || !workspace.rootPath) return;

  try {
    const episodes = workspace.manifest.episodes ?? [];
    const episodeIndex = episodes.findIndex((ep) => ep.id === episodeId.value);

    if (episodeIndex === -1) {
      if (!silent) {
        $q.notify({ type: 'negative', timeout: 1000, message: '未找到分集' });
      }
      return;
    }

    const episode = episodes[episodeIndex];
    if (!episode) return;

    const newTitle = editingTitle.value.trim() || '默认标题';

    // 更新项目 manifest
    const updatedEpisodes = [...episodes];
    updatedEpisodes[episodeIndex] = {
      ...episode,
      title: newTitle,
    };

    workspace.patchManifest({
      episodes: updatedEpisodes,
    });

    // patchManifest 已经内部调用了 saveToDb，无需再单独保存
    const api = (await import('src/services/native-fs')).getElectronApi();
    if (api) {
      const episodeJsonPath = await api.pathJoin(
        workspace.rootPath,
        'episodes',
        episode.folder,
        'episode.json',
      );
      const episodeData = JSON.parse(await api.fsReadTextFile(episodeJsonPath));
      episodeData.title = newTitle;
      await api.fsWriteTextFile(episodeJsonPath, JSON.stringify(episodeData, null, 2));
    }

    if (!silent) {
      $q.notify({ type: 'positive', timeout: 1000, message: '标题已更新' });
    }
    isEditingTitle.value = false;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', timeout: 1000, message: `更新标题失败: ${msg}` });
  }
}

/**
 * 生成故事
 * @param mode 'generate' 为生成新故事，'expand' 为扩写/润色
 */
async function generateStory(mode: 'generate' | 'expand') {
  if (!selectedPromptTheme.value) {
    $q.notify({ type: 'warning', message: '请先选择提示词套件' });
    return;
  }

  if (!aiInputText.value.trim()) {
    $q.notify({ type: 'warning', message: '请先输入初始内容' });
    return;
  }

  // 获取提示词ID
  const storyFeatureType = mode === 'generate' ? StoryFeatureType.GENERATE : StoryFeatureType.EXPAND;
  const promptId = getStoryPromptId(selectedPromptTheme.value, storyFeatureType);

  // 获取提示词绑定的 API 配置名称
  const apiConfigName = getPromptApiBinding(promptId);
  if (!apiConfigName) {
    $q.notify({ type: 'warning', message: '请先在设置中为该提示词绑定 API 接口' });
    return;
  }

  // 获取提示词内容
  const promptContent = getPromptContent(promptId, selectedPromptTheme.value);
  if (!promptContent) {
    $q.notify({
      type: 'warning',
      message: `请先在设置中配置"${mode === 'generate' ? 'AI 生成故事' : 'AI 扩写/润色'}"提示词`,
    });
    return;
  }

  isGenerating.value = true;
  currentGeneratingMode.value = mode;
  try {
    // 组装 prompt
    const lines: string[] = [];
    lines.push(promptContent);
    lines.push('');

    // 用户输入
    lines.push(`【该故事梗概为】`);
    lines.push(aiInputText.value.trim());
    lines.push('');

    const prompt = lines.join('\n');

    // 使用提示词绑定的 API 配置生成
    const result = await generateText({ prompt }, apiConfigName);

    // 直接填入主输入框
    storyInput.value = result.text;

    // 清空AI输入框
    aiInputText.value = '';

    // 收起AI卡片
    showAiGeneration.value = false;

    $q.notify({
      type: 'positive',
      message: mode === 'generate' ? '故事生成成功' : '故事扩写成功',
      timeout: 2000,
    });

    // 自动保存
    void saveStoryData(true);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: `生成失败：${msg}`,
      timeout: 4000,
    });
  } finally {
    isGenerating.value = false;
    currentGeneratingMode.value = null;
  }
}
</script>

<style scoped>
.itimo-produce-header {
  margin-bottom: 12px;
}

/* AI 生成故事卡片展开/收起动画 */
.itimo-card-body {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
  }
  to {
    opacity: 1;
    max-height: 1000px;
    overflow: visible;
  }
}
</style>
