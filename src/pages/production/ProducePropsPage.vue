<template>
  <div class="itimo-produce-page">
    <div class="itimo-produce-header">
      <div class="row items-center gap-md">
        <h3>道具生成</h3>
        <span class="itimo-episode-badge">{{ episodeNumber }}</span>
      </div>
      <p class="itimo-produce-subtitle">为项目中的道具生成图片素材</p>
    </div>

    <section class="itimo-produce-section">
      <div class="itimo-section-card">
        <div class="itimo-card-header">
          <h2 class="itimo-card-title">道具列表</h2>
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
              @click="extractPropsFromStory"
            />
            <q-btn
              color="primary"
              unelevated
              rounded
              icon="add"
              label="新增道具"
              size="sm"
              @click="showAddPropDialog"
            />
          </div>
        </div>

        <div class="itimo-card-body">
          <div v-if="props.length === 0" class="itimo-empty-state">
            <q-icon name="inventory_2" size="64px" color="grey-5" />
            <p class="itimo-empty-text">暂无道具，点击"新增道具"按钮创建</p>
          </div>

          <div v-else class="itimo-props-list">
            <div v-for="prop in props" :key="prop.id" class="itimo-prop-item-wrapper">
              <q-btn
                round
                dense
                flat
                icon="delete"
                color="negative"
                size="sm"
                class="itimo-delete-prop-btn"
                @click="deleteProp(prop.id)"
              >
                <q-tooltip>删除道具</q-tooltip>
              </q-btn>
              <div class="itimo-prop-item">
                <div class="itimo-prop-info">
                  <div>
                    <h3 class="itimo-prop-name">{{ prop.name }}</h3>
                  </div>
                  <p class="itimo-prop-desc">{{ prop.description }}</p>
                </div>

                <div class="itimo-prop-preview" style="padding: 20px 0">
                  <div>
                    <div class="itimo-preview-grid">
                      <div class="itimo-preview-item">
                        <template v-if="prop.imagePath">
                          <img
                            :src="getPropImageUrl(prop.imagePath)"
                            :alt="prop.name"
                            style="cursor: zoom-in"
                            @click="openImageViewer(getPropImageUrl(prop.imagePath))"
                          />
                          <q-btn
                            round
                            dense
                            flat
                            icon="close"
                            color="negative"
                            size="sm"
                            class="itimo-delete-image-btn"
                            @click="deletePropImage(prop.id)"
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
                          @click="uploadPropImage(prop.id)"
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
                    label="加入道具库"
                    icon="add_photo_alternate"
                    size="sm"
                    :disable="!prop.imagePath"
                    @click="addPropToLibrary(prop.id)"
                  />
                  <q-btn
                    color="warning"
                    outline
                    rounded
                    label="编辑"
                    icon="edit"
                    size="sm"
                    @click="editProp(prop.id)"
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
                    v-model="prop.promptThemeId"
                    :options="promptThemeOptions"
                    option-label="label"
                    option-value="id"
                    outlined
                    dense
                    emit-value
                    map-options
                    placeholder="选择提示词套件"
                    style="min-width: 160px"
                    @blur="onPropPromptThemeBlur(prop.id, prop.promptThemeId)"
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
                    :disable="!prop.promptThemeId"
                    @click="generatePropImage(prop.id)"
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

    <!-- Add/Edit Prop Dialog -->
    <q-dialog v-model="showPropDialog" persistent>
      <q-card class="itimo-glass-card" style="width: min(500px, 92vw)">
        <q-card-section class="row items-center q-gutter-md">
          <q-icon name="inventory_2" color="primary" size="md" />
          <div class="text-h6">{{ editingPropId ? '编辑道具' : '新增道具' }}</div>
          <q-space />
          <q-btn flat round icon="close" @click="showPropDialog = false" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <div class="q-gutter-md">
            <q-input
              v-model="propForm.name"
              outlined
              label="道具名称"
              dense
              :rules="[(val) => !!val || '请输入道具名称']"
              @blur="onPropFieldBlur"
            />
            <q-input
              v-model="propForm.description"
              outlined
              label="道具描述"
              type="textarea"
              rows="4"
              dense
              @blur="onPropFieldBlur"
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" @click="showPropDialog = false" />
          <q-btn
            unelevated
            label="保存"
            color="primary"
            @click="saveProp"
            :disable="!propForm.name"
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
import type { Prop } from 'src/core/types/project';

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

const props = computed(() => workspace.props);

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

// 自动保存功能 - 道具数据通过 workspace store 实时保存到数据库

const showPropDialog = ref(false);
const editingPropId = ref<string | null>(null);
const propForm = ref({
  name: '',
  description: '',
});

// 跟踪表单是否有修改
const propFormDirty = ref(false);

function showAddPropDialog() {
  editingPropId.value = null;
  propForm.value = {
    name: '',
    description: '',
  };
  propFormDirty.value = false;
  showPropDialog.value = true;
}

async function editProp(propId: string) {
  const prop = props.value.find((p) => p.id === propId);
  if (!prop) return;

  editingPropId.value = propId;
  propForm.value = {
    name: prop.name,
    description: prop.description,
  };
  propFormDirty.value = false;
  showPropDialog.value = true;
}

function markPropDirty() {
  propFormDirty.value = true;
}

// 离开输入框时自动保存
const debouncedPropSave = useDebounceFn(() => {
  void autoSaveProp();
}, 300);

async function onPropFieldBlur() {
  markPropDirty();
  if (!propFormDirty.value) return;

  // 如果是新建道具（没有 editingPropId），先创建道具
  if (!editingPropId.value) {
    if (!propForm.value.name.trim()) return;
    try {
      const newProp = await workspace.addProp({
        name: propForm.value.name,
        description: propForm.value.description,
      });
      if (newProp) {
        editingPropId.value = newProp.id;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      $q.notify({ type: 'negative', timeout: 1000, message: `创建道具失败: ${msg}` });
      return;
    }
  }

  debouncedPropSave();
}

async function autoSaveProp() {
  if (!editingPropId.value) return;
  try {
    await workspace.updateProp(editingPropId.value, {
      name: propForm.value.name,
      description: propForm.value.description,
    });
    propFormDirty.value = false;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', timeout: 1000, message: `保存失败: ${msg}` });
  }
}

async function onPropPromptThemeBlur(propId: string, promptThemeId: string | undefined) {
  if (!workspace.projectId) return;
  try {
    await workspace.updateProp(propId, promptThemeId !== undefined ? { promptThemeId } : {});
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', timeout: 1000, message: `保存失败: ${msg}` });
  }
}

async function saveProp() {
  if (!propForm.value.name) {
    $q.notify({
      type: 'warning',
      message: '请输入道具名称',
    });
    return;
  }

  try {
    if (editingPropId.value) {
      await workspace.updateProp(editingPropId.value, {
        name: propForm.value.name,
        description: propForm.value.description,
      });
    } else {
      await workspace.addProp({
        name: propForm.value.name,
        description: propForm.value.description,
      });
    }

    $q.notify({
      type: 'positive',
      message: editingPropId.value ? '道具已更新' : '道具已创建',
    });

    showPropDialog.value = false;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: '保存失败',
      caption: msg,
    });
  }
}

function getPropImageUrl(relativePath: string): string {
  const api = getElectronApi();
  if (!api || !workspace.rootPath) return '';
  const fullPath = `${workspace.rootPath}/${relativePath}`;
  return toLocalFileUrl(fullPath);
}

async function generatePropImage(propId: string) {
  const prop = props.value.find((p) => p.id === propId);
  if (!prop) {
    $q.notify({ type: 'negative', message: '未找到道具信息' });
    return;
  }

  const themeId = prop.promptThemeId;
  if (!themeId) {
    $q.notify({ type: 'warning', message: '请先为该道具选择提示词套件' });
    return;
  }

  // 获取对应的提示词ID
  const promptId = getPromptIdForPage(themeId, PageType.PROP);

  // 获取提示词绑定的 API 配置名称
  const apiConfigName = getPromptApiBinding(promptId);
  if (!apiConfigName) {
    $q.notify({ type: 'warning', message: '请先在设置中为该提示词绑定 API 接口' });
    return;
  }

  // 获取当前语言状态
  const isEnglish = prop.promptLangEn ?? false;

  // 获取提示词内容
  const promptContent = getPromptContent(promptId, themeId, isEnglish);
  if (!promptContent) {
    $q.notify({ type: 'warning', message: '请先在设置中配置道具图片提示词' });
    return;
  }

  if (!prop.description.trim()) {
    $q.notify({ type: 'warning', message: '请先输入道具描述' });
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
    lines.push('【道具描述】');
    lines.push(prop.description.trim());

    const fullPrompt = lines.join('\n');

    console.log('Generate image for prop:', propId);
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
      await workspace.updateProp(propId, {
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

async function uploadPropImage(propId: string) {
  const api = getElectronApi();
  if (!api) {
    $q.notify({
      type: 'warning',
      message: '此功能仅在桌面端可用',
    });
    return;
  }

  const prop = props.value.find((p) => p.id === propId);
  if (!prop) {
    $q.notify({
      type: 'negative',
      message: '未找到道具信息',
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

    const propsDir = await api.pathJoin(projectRoot, 'props');
    await api.fsEnsureDir(propsDir);

    const ext = sourcePath.split('.').pop() || 'png';
    const timestamp = Date.now();
    const fileName = `${prop.name}_${timestamp}.${ext}`;
    const targetPath = await api.pathJoin(propsDir, fileName);

    await api.fsCopyFile(sourcePath, targetPath);

    await workspace.updateProp(propId, {
      imagePath: `props/${fileName}`,
    });

    $q.notify({
      type: 'positive',
      message: `已上传 ${prop.name} 的图片`,
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

function deletePropImage(propId: string) {
  const api = getElectronApi();
  if (!api) {
    $q.notify({
      type: 'warning',
      message: '此功能仅在桌面端可用',
    });
    return;
  }

  const prop = props.value.find((p) => p.id === propId);
  if (!prop || !prop.imagePath) {
    return;
  }

  const imagePath = prop.imagePath;

  $q.dialog({
    title: '确认删除',
    message: `确定要删除 ${prop.name} 的图片吗？`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void deletePropImageAsync(imagePath, prop);
  });
}

async function deletePropImageAsync(imagePath: string, prop: Prop) {
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

    await workspace.updateProp(prop.id, {
      imagePath: undefined,
    });

    $q.notify({
      type: 'positive',
      message: `已删除 ${prop.name} 的图片`,
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

async function addPropToLibrary(propId: string) {
  const api = getElectronApi();
  if (!api) {
    $q.notify({
      type: 'warning',
      message: '此功能仅在桌面端可用',
    });
    return;
  }

  const prop = props.value.find((p) => p.id === propId);
  if (!prop || !prop.imagePath) {
    $q.notify({
      type: 'negative',
      message: '请先上传道具图片',
    });
    return;
  }

  try {
    const projectRoot = workspace.rootPath;
    if (!projectRoot) {
      throw new Error('项目路径未找到');
    }

    const sourcePath = await api.pathJoin(projectRoot, prop.imagePath);
    const libraryDir = await ensureGlobalLibraryDir('props');

    const ext = prop.imagePath.split('.').pop() || 'png';
    const timestamp = Date.now();
    const fileName = `${prop.name}_${timestamp}.${ext}`;
    const targetPath = await api.pathJoin(libraryDir, fileName);

    await api.fsCopyFile(sourcePath, targetPath);

    $q.notify({
      type: 'positive',
      message: `已将 ${prop.name} 的图片加入道具库`,
      caption: fileName,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: '加入道具库失败',
      caption: msg,
    });
  }
}

function deleteProp(propId: string) {
  const prop = props.value.find((p) => p.id === propId);
  if (!prop) return;

  $q.dialog({
    title: '确认删除',
    message: `确定要删除道具"${prop.name}"吗？`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void deletePropAsync(propId);
  });
}

async function deletePropAsync(propId: string) {
  try {
    await workspace.deleteProp(propId);

    $q.notify({
      type: 'positive',
      message: '道具已删除',
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
 * 从故事页面的输入框中提取道具
 */
async function extractPropsFromStory() {
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
      PageType.PROP,
      FeatureType.EXTRACTION,
    );
    const promptContent = getPromptContent(promptId, selectedPromptThemeForExtraction.value);
    if (!promptContent) {
      $q.notify({ type: 'warning', message: '请先在设置中配置道具提取提示词' });
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
    let extractedProps: Array<{
      name: string;
      type: string;
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
      extractedProps = JSON.parse(cleanText);
    } catch {
      console.error('解析失败，原始返回:', result.text);
      $q.notify({
        type: 'warning',
        message: '提取结果格式错误，请检查提示词配置',
        timeout: 3000,
      });
      return;
    }

    // 将提取的道具添加到项目
    if (!workspace.projectId) {
      $q.notify({ type: 'negative', message: '项目信息未加载' });
      return;
    }

    let addedCount = 0;
    for (const extractedProp of extractedProps) {
      const existingIndex = workspace.props.findIndex(
        (p) => p.name === extractedProp.name,
      );

      if (existingIndex < 0) {
        await workspace.addProp({
          name: extractedProp.name,
          description: extractedProp.description,
        });
        addedCount++;
      }
    }

    $q.notify({
      type: 'positive',
      message: `成功提取 ${addedCount} 个新道具`,
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
