<template>
  <div class="itimo-produce-page">
    <div class="itimo-produce-header">
      <div class="row items-center gap-md">
        <h3>场景生成</h3>
        <span class="itimo-episode-badge">{{ episodeNumber }}</span>
      </div>
      <p class="itimo-produce-subtitle">为项目中的场景生成图片素材</p>
    </div>

    <section class="itimo-produce-section">
      <div class="itimo-section-card">
        <div class="itimo-card-header">
          <h2 class="itimo-card-title">场景列表</h2>
          <div style="display: flex; gap: 10px; align-items: center">
            <q-select
              v-model="selectedPromptThemeForExtraction"
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
              color="info"
              unelevated
              rounded
              icon="auto_awesome"
              label="AI 提取"
              :disable="!selectedPromptThemeForExtraction"
              :loading="isExtracting"
              @click="extractScenesFromStory"
            />
            <q-btn
              color="primary"
              unelevated
              rounded
              icon="add"
              label="新增场景"
              size="sm"
              @click="showAddSceneDialog"
            />
          </div>
        </div>

        <div class="itimo-card-body">
          <div v-if="scenes.length === 0" class="itimo-empty-state">
            <q-icon name="landscape" size="64px" color="grey-5" />
            <p class="itimo-empty-text">暂无场景，点击"新增场景"按钮创建</p>
          </div>

          <div v-else class="itimo-scenes-list">
            <div v-for="scene in scenes" :key="scene.id" class="itimo-scene-item-wrapper">
              <q-btn
                round
                dense
                flat
                icon="delete"
                color="negative"
                size="sm"
                class="itimo-delete-scene-btn"
                @click="deleteScene(scene.id)"
              >
                <q-tooltip>删除场景</q-tooltip>
              </q-btn>
              <div style="display: flex; justify-items: center; gap: 10px">
                <div class="itimo-scene-info">
                  <div>
                    <h3 class="itimo-scene-name">{{ scene.name }}</h3>
                  </div>
                  <p class="itimo-scene-desc">{{ scene.description }}</p>
                </div>
                <div class="itimo-scene-preview" style="padding: 20px 0">
                  <div>
                    <div class="itimo-preview-grid">
                      <div class="itimo-preview-item">
                        <template v-if="scene.imagePath">
                          <img
                            :src="getSceneImageUrl(scene.imagePath)"
                            :alt="scene.name"
                            style="cursor: zoom-in"
                            @click="openImageViewer(getSceneImageUrl(scene.imagePath))"
                          />
                          <q-btn
                            round
                            dense
                            flat
                            icon="close"
                            color="negative"
                            size="sm"
                            class="itimo-delete-image-btn"
                            @click="deleteSceneImage(scene.id)"
                          >
                            <q-tooltip>删除图片</q-tooltip>
                          </q-btn>
                        </template>
                        <q-icon v-else name="image" size="48px" color="grey-5" />
                      </div>
                    </div>
                    <div>
                      <div style="text-align: center; margin-top: 10px">
                        <q-btn
                          color="positive"
                          outline
                          rounded
                          label="上传图片"
                          icon="upload"
                          size="sm"
                          @click="uploadSceneImage(scene.id)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center">
                <div style="display: flex; justify-content: flex-start; gap: 10px; padding: 10px">
                  <q-btn
                    color="secondary"
                    outline
                    rounded
                    label="加入场景库"
                    icon="add_photo_alternate"
                    size="sm"
                    :disable="!scene.imagePath"
                    @click="addSceneToLibrary(scene.id)"
                  />
                  <q-btn
                    color="warning"
                    outline
                    rounded
                    label="编辑"
                    icon="edit"
                    size="sm"
                    @click="editScene(scene.id)"
                  />
                </div>
                <div
                  style="
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    padding: 10px;
                    gap: 10px;
                  "
                >
                  <q-select
                    v-model="scene.promptThemeId"
                    :options="promptThemeOptions"
                    option-label="label"
                    option-value="id"
                    outlined
                    dense
                    emit-value
                    map-options
                    placeholder="选择提示词套件"
                    style="min-width: 160px"
                    @blur="onScenePromptThemeBlur(scene.id, scene.promptThemeId)"
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
                    size="md"
                    :disable="!scene.promptThemeId"
                    @click="generateSceneImage(scene.id)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 图片放大查看 -->
    <q-dialog v-model="showImageViewer" maximized transition-show="fade" transition-hide="fade">
      <div class="itimo-viewer-container" @click="showImageViewer = false">
        <q-btn
          round
          dense
          flat
          icon="close"
          color="white"
          size="lg"
          class="itimo-viewer-close-btn"
          @click.stop="showImageViewer = false"
        >
          <q-tooltip>关闭</q-tooltip>
        </q-btn>
        <div class="itimo-viewer-content" @click.stop>
          <img :src="currentViewerImage" alt="查看大图" class="itimo-viewer-image" />
        </div>
      </div>
    </q-dialog>

    <!-- Add/Edit Scene Dialog -->
    <q-dialog v-model="showSceneDialog" persistent>
      <q-card class="itimo-glass-card" style="width: min(500px, 92vw)">
        <q-card-section class="row items-center q-gutter-md">
          <q-icon name="landscape" color="primary" size="md" />
          <div class="text-h6">{{ editingSceneId ? '编辑场景' : '新增场景' }}</div>
          <q-space />
          <q-btn flat round icon="close" @click="showSceneDialog = false" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <div class="q-gutter-md">
            <q-input
              v-model="sceneForm.name"
              outlined
              label="场景名称"
              dense
              :rules="[(val) => !!val || '请输入场景名称']"
              @blur="onSceneFieldBlur"
            />
            <q-input
              v-model="sceneForm.description"
              outlined
              label="场景描述"
              type="textarea"
              rows="4"
              dense
              @blur="onSceneFieldBlur"
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" @click="showSceneDialog = false" />
          <q-btn
            unelevated
            label="保存"
            color="primary"
            @click="saveScene"
            :disable="!sceneForm.name"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { useWorkspaceStore } from 'src/stores/workspace-store';
import { useSettingsStore } from 'src/stores/settings-store';
import { useDebounceFn } from 'src/composables/use-field-auto-save';
import { getElectronApi } from 'src/services/native-fs';
import { toLocalFileUrl } from 'src/composables/use-local-file-url';
import { ensureGlobalLibraryDir } from 'src/services/library-paths';
import { generateText, generateImage } from 'src/services/ai';
import {
  PageType,
  FeatureType,
  getPromptThemeOptions,
  getPromptApiBinding,
  getPromptIdForPage,
  getPromptContent,
} from 'src/constants/prompt-bindings';
import type { Scene } from 'src/core/types/project';

// 图片查看器状态
const showImageViewer = ref(false);
const currentViewerImage = ref('');

function openImageViewer(imagePath: string) {
  currentViewerImage.value = imagePath;
  showImageViewer.value = true;
}

const $q = useQuasar();
const route = useRoute();
const workspace = useWorkspaceStore();
const settingsStore = useSettingsStore();

const scenes = computed(() => workspace.scenes);

const episodeNumber = computed(() => {
  const episodes = workspace.manifest?.episodes ?? [];
  const episode = episodes.find((ep) => ep.id === String(route.params.episodeId));
  return episode?.episodeNumber ?? '第1集';
});

// ── 提示词套件选择（用于 AI 提取功能）──────────────────────────
/** 提示词套件选项（内置 + 用户自建） */
const promptThemeOptions = computed(() => getPromptThemeOptions());
/** 提取用的提示词套件选择 */
const selectedPromptThemeForExtraction = ref<string>('');

// ── 图片生成用的提示词套件选择 ────────────────────────────────
/** 当前选中的图片生成提示词套件ID */
const selectedPromptTheme = ref<string>('');
/** 是否正在提取 */
const isExtracting = ref(false);

// 自动保存功能 - 场景数据通过 workspace store 实时保存到数据库

const showSceneDialog = ref(false);
const editingSceneId = ref<string | null>(null);
const sceneForm = ref({
  name: '',
  description: '',
});

// 跟踪表单是否有修改
const sceneFormDirty = ref(false);

function showAddSceneDialog() {
  editingSceneId.value = null;
  sceneForm.value = {
    name: '',
    description: '',
  };
  sceneFormDirty.value = false;
  showSceneDialog.value = true;
}

async function editScene(sceneId: string) {
  const scene = scenes.value.find((s) => s.id === sceneId);
  if (!scene) return;

  editingSceneId.value = sceneId;
  sceneForm.value = {
    name: scene.name,
    description: scene.description,
  };
  sceneFormDirty.value = false;
  showSceneDialog.value = true;
}

function markSceneDirty() {
  sceneFormDirty.value = true;
}

// 离开输入框时自动保存
const debouncedSceneSave = useDebounceFn(() => {
  void autoSaveScene();
}, 300);

async function onSceneFieldBlur() {
  markSceneDirty();
  if (!sceneFormDirty.value) return;

  // 如果是新建场景（没有 editingSceneId），先创建场景
  if (!editingSceneId.value) {
    if (!sceneForm.value.name.trim()) return;
    try {
      const newScene = await workspace.addScene({
        name: sceneForm.value.name,
        description: sceneForm.value.description,
      });
      if (newScene) {
        editingSceneId.value = newScene.id;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      $q.notify({ type: 'negative', timeout: 1000, message: `创建场景失败: ${msg}` });
      return;
    }
  }

  debouncedSceneSave();
}

async function autoSaveScene() {
  if (!editingSceneId.value) return;
  try {
    await workspace.updateScene(editingSceneId.value, {
      name: sceneForm.value.name,
      description: sceneForm.value.description,
    });
    sceneFormDirty.value = false;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', timeout: 1000, message: `保存失败: ${msg}` });
  }
}

async function onScenePromptThemeBlur(sceneId: string, promptThemeId: string | undefined) {
  if (!workspace.projectId) return;
  try {
    await workspace.updateScene(sceneId, promptThemeId !== undefined ? { promptThemeId } : {});
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', timeout: 1000, message: `保存失败: ${msg}` });
  }
}

async function saveScene() {
  if (!sceneForm.value.name) {
    $q.notify({
      type: 'warning',
      message: '请输入场景名称',
    });
    return;
  }

  try {
    if (editingSceneId.value) {
      await workspace.updateScene(editingSceneId.value, {
        name: sceneForm.value.name,
        description: sceneForm.value.description,
      });
    } else {
      await workspace.addScene({
        name: sceneForm.value.name,
        description: sceneForm.value.description,
      });
    }

    $q.notify({
      type: 'positive',
      message: editingSceneId.value ? '场景已更新' : '场景已创建',
    });

    showSceneDialog.value = false;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: '保存失败',
      caption: msg,
    });
  }
}

function getSceneImageUrl(relativePath: string): string {
  const api = getElectronApi();
  if (!api || !workspace.rootPath) return '';
  const fullPath = `${workspace.rootPath}/${relativePath}`;
  return toLocalFileUrl(fullPath);
}

async function generateSceneImage(sceneId: string) {
  const scene = scenes.value.find((s) => s.id === sceneId);
  if (!scene) {
    $q.notify({ type: 'negative', message: '未找到场景信息' });
    return;
  }

  const themeId = scene.promptThemeId;
  if (!themeId) {
    $q.notify({ type: 'warning', message: '请先为该场景选择提示词套件' });
    return;
  }

  // 获取对应的提示词ID
  const promptId = getPromptIdForPage(themeId, PageType.SCENE);

  // 获取提示词绑定的 API 配置名称
  const apiConfigName = getPromptApiBinding(promptId);
  if (!apiConfigName) {
    $q.notify({ type: 'warning', message: '请先在设置中为该提示词绑定 API 接口' });
    return;
  }

  // 获取当前语言状态
  const isEnglish = scene.promptLangEn ?? false;

  // 获取提示词内容
  const promptContent = getPromptContent(promptId, themeId, isEnglish);
  if (!promptContent) {
    $q.notify({ type: 'warning', message: '请先在设置中配置场景图片提示词' });
    return;
  }

  if (!scene.description.trim()) {
    $q.notify({ type: 'warning', message: '请先输入场景描述' });
    return;
  }

  try {
    // 显示开始提示
    $q.notify({
      type: 'info',
      message: '正在构建提示词...',
      timeout: 1000,
    });

    // 拼接提示词
    const lines: string[] = [];
    lines.push(promptContent);
    lines.push('');
    lines.push('【场景描述】');
    lines.push(scene.description.trim());

    const fullPrompt = lines.join('\n');

    console.log('Generate image for scene:', sceneId);
    console.log('Using prompt ID:', promptId);
    console.log('Using API config:', apiConfigName);
    console.log('Full prompt:', fullPrompt);

    // 调用 AI 接口生成图片（使用提示词绑定的 API 配置）
    const imageResponse = await generateImage(
      {
        prompt: fullPrompt,
      },
      apiConfigName,
    );

    if (imageResponse.images && imageResponse.images.length > 0) {
      // 保存生成的图片
      const imageUrl = imageResponse.images[0] as string;
      await workspace.updateScene(sceneId, {
        imagePath: imageUrl,
      });

      $q.notify({
        type: 'positive',
        message: '图片生成成功',
      });
    } else {
      $q.notify({
        type: 'warning',
        message: '未获取到生成的图片',
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Generate image failed:', e);
    $q.notify({
      type: 'negative',
      message: '图片生成失败',
      caption: msg,
      timeout: 5000,
    });
  }
}

async function uploadSceneImage(sceneId: string) {
  const api = getElectronApi();
  if (!api) {
    $q.notify({
      type: 'warning',
      message: '此功能仅在桌面端可用',
    });
    return;
  }

  const scene = scenes.value.find((s) => s.id === sceneId);
  if (!scene) {
    $q.notify({
      type: 'negative',
      message: '未找到场景信息',
    });
    return;
  }

  try {
    const sourcePath = await api.dialogOpenFile({
      filters: [
        { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });

    if (!sourcePath) {
      return;
    }

    const projectRoot = workspace.rootPath;
    if (!projectRoot) {
      throw new Error('项目路径未找到');
    }

    const scenesDir = await api.pathJoin(projectRoot, 'scenes');
    await api.fsEnsureDir(scenesDir);

    const ext = sourcePath.split('.').pop() || 'png';
    const timestamp = Date.now();
    const fileName = `${scene.name}_${timestamp}.${ext}`;
    const targetPath = await api.pathJoin(scenesDir, fileName);

    await api.fsCopyFile(sourcePath, targetPath);

    await workspace.updateScene(sceneId, {
      imagePath: `scenes/${fileName}`,
    });

    $q.notify({
      type: 'positive',
      message: `已上传 ${scene.name} 的图片`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: '上传图片失败',
      caption: msg,
    });
  }
}

function deleteSceneImage(sceneId: string) {
  const api = getElectronApi();
  if (!api) {
    $q.notify({
      type: 'warning',
      message: '此功能仅在桌面端可用',
    });
    return;
  }

  const scene = scenes.value.find((s) => s.id === sceneId);
  if (!scene || !scene.imagePath) {
    return;
  }

  const imagePath = scene.imagePath;

  $q.dialog({
    title: '确认删除',
    message: `确定要删除 ${scene.name} 的图片吗？`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void deleteSceneImageAsync(imagePath, scene);
  });
}

async function deleteSceneImageAsync(imagePath: string, scene: Scene) {
  const api = getElectronApi();
  if (!api) return;

  try {
    const projectRoot = workspace.rootPath;
    if (!projectRoot) {
      throw new Error('项目路径未找到');
    }

    const fullPath = await api.pathJoin(projectRoot, imagePath);
    const exists = await api.fsExists(fullPath);
    if (exists) {
      await api.fsRemove(fullPath);
    }

    await workspace.updateScene(scene.id, {
      imagePath: undefined,
    });

    $q.notify({
      type: 'positive',
      message: `已删除 ${scene.name} 的图片`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: '删除图片失败',
      caption: msg,
    });
  }
}

async function addSceneToLibrary(sceneId: string) {
  const api = getElectronApi();
  if (!api) {
    $q.notify({
      type: 'warning',
      message: '此功能仅在桌面端可用',
    });
    return;
  }

  const scene = scenes.value.find((s) => s.id === sceneId);
  if (!scene || !scene.imagePath) {
    $q.notify({
      type: 'negative',
      message: '请先上传场景图片',
    });
    return;
  }

  try {
    const projectRoot = workspace.rootPath;
    if (!projectRoot) {
      throw new Error('项目路径未找到');
    }

    const sourcePath = await api.pathJoin(projectRoot, scene.imagePath);
    const libraryDir = await ensureGlobalLibraryDir('scenes');

    const ext = scene.imagePath.split('.').pop() || 'png';
    const timestamp = Date.now();
    const fileName = `${scene.name}_${timestamp}.${ext}`;
    const targetPath = await api.pathJoin(libraryDir, fileName);

    await api.fsCopyFile(sourcePath, targetPath);

    $q.notify({
      type: 'positive',
      message: `已将 ${scene.name} 的图片加入场景库`,
      caption: fileName,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: '加入场景库失败',
      caption: msg,
    });
  }
}

function deleteScene(sceneId: string) {
  const scene = scenes.value.find((s) => s.id === sceneId);
  if (!scene) return;

  $q.dialog({
    title: '确认删除',
    message: `确定要删除场景"${scene.name}"吗？`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void deleteSceneAsync(sceneId);
  });
}

async function deleteSceneAsync(sceneId: string) {
  try {
    await workspace.deleteScene(sceneId);

    $q.notify({
      type: 'positive',
      message: '场景已删除',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: '删除失败',
      caption: msg,
    });
  }
}

/**
 * 从故事页面的输入框中提取场景
 */
async function extractScenesFromStory() {
  if (!selectedPromptThemeForExtraction.value) {
    $q.notify({ type: 'warning', message: '请先选择提示词套件' });
    return;
  }

  try {
    // 获取故事页面的输入内容
    const storyContent = await getStoryContent();
    if (!storyContent) {
      $q.notify({ type: 'warning', message: '故事内容为空，请先在故事页面输入内容' });
      return;
    }

    // 获取提示词
    const promptId = getPromptIdForPage(
      selectedPromptThemeForExtraction.value,
      PageType.SCENE,
      FeatureType.EXTRACTION,
    );
    const promptContent = getPromptContent(promptId, selectedPromptThemeForExtraction.value);
    if (!promptContent) {
      $q.notify({ type: 'warning', message: '请先在设置中配置场景提取提示词' });
      return;
    }

    // 获取提示词绑定的 API 配置
    const apiConfigName = getPromptApiBinding(promptId);
    if (!apiConfigName) {
      $q.notify({ type: 'warning', message: '请先在设置中为该提示词绑定 API 接口' });
      return;
    }

    isExtracting.value = true;

    // 组装提示词
    const prompt = `${promptContent}\n\n【故事内容】\n${storyContent}`;

    // 调用AI进行提取（使用提示词绑定的 API）
    const result = await generateText({ prompt }, apiConfigName);

    // 解析JSON结果
    let extractedScenes: Array<{
      name: string;
      description: string;
      image_prompt: string;
    }> = [];

    try {
      // 清理 markdown 代码块标记
      let cleanText = result.text.trim();
      // 移除首尾的 ```json 和 ``` 标记
      const jsonMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        cleanText = jsonMatch[1].trim();
      }
      extractedScenes = JSON.parse(cleanText);
    } catch {
      console.error('解析失败，原始返回:', result.text);
      $q.notify({
        type: 'warning',
        message: '提取结果格式错误，请检查提示词配置',
        timeout: 3000,
      });
      return;
    }

    // 将提取的场景添加到项目
    if (!workspace.projectId) {
      $q.notify({ type: 'negative', message: '项目数据未加载' });
      return;
    }

    let addedCount = 0;
    for (const extractedScene of extractedScenes) {
      const existingIndex = workspace.scenes.findIndex(
        (s) => s.name === extractedScene.name,
      );

      if (existingIndex < 0) {
        await workspace.addScene({
          name: extractedScene.name,
          description: extractedScene.description,
        });
        addedCount++;
      }
    }

    $q.notify({
      type: 'positive',
      message: `成功提取 ${addedCount} 个新场景`,
      timeout: 2000,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: `提取失败：${msg}`,
      timeout: 4000,
    });
  } finally {
    isExtracting.value = false;
    // 恢复原始顺序
    const configs = settingsStore.settings.api.customConfigs ?? [];
    settingsStore.settings.api.customConfigs = configs;
  }
}

/**
 * 获取故事页面的输入内容
 */
async function getStoryContent(): Promise<string> {
  try {
    const episodes = workspace.manifest?.episodes ?? [];
    const episode = episodes.find((ep) => ep.id === String(route.params.episodeId));
    if (!episode) return '';

    const api = getElectronApi();
    if (!api) return '';

    const { loadEpisodeManifestFromPath } = await import('src/db/project');
    const episodeManifest = await loadEpisodeManifestFromPath(workspace.rootPath!, episode.folder);

    // 获取故事梗概（从第一个 script block 的 heading）
    if (episodeManifest.script && episodeManifest.script.length > 0) {
      const firstBlock = episodeManifest.script[0];
      if (firstBlock) {
        return firstBlock.heading || '';
      }
    }
    return '';
  } catch (e) {
    console.error('Failed to get story content:', e);
    return '';
  }
}
</script>

<style scoped>
/* 图片预览项中的图片 */
.itimo-preview-item img {
  cursor: zoom-in;
}

/* 图片放大查看器样式 */
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
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}
</style>
