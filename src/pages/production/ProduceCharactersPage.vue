<template>
  <div class="itimo-produce-page">
    <div class="itimo-produce-header">
      <div class="row items-center gap-md">
        <h3>角色生成</h3>
        <span class="itimo-episode-badge">{{ episodeNumber }}</span>
      </div>
      <p class="itimo-produce-subtitle">为项目中的角色生成图片素材</p>
    </div>

    <section class="itimo-produce-section">
      <div class="itimo-section-card">
        <div class="itimo-card-header">
          <h2 class="itimo-card-title">角色列表</h2>
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
              @click="extractCharactersFromStory"
            />
            <q-btn
              color="primary"
              unelevated
              rounded
              icon="person_add"
              label="新建角色"
              @click="openCharacterDialog()"
            />
          </div>
        </div>

        <div class="itimo-card-body">
          <div v-if="characters.length === 0" class="itimo-empty-state">
            <q-icon name="face" size="64px" color="grey-5" />
            <p class="itimo-empty-text">暂无角色，请先前往"故事生成"页面创建角色</p>
          </div>

          <div v-else class="itimo-characters-list">
            <div v-for="character in characters" :key="character.id" class="itimo-character-item">
              <q-btn
                round
                dense
                flat
                icon="delete"
                color="negative"
                size="sm"
                class="itimo-delete-character-btn"
                @click="deleteCharacter(character.id)"
              >
                <q-tooltip>删除角色</q-tooltip>
              </q-btn>
              <div class="itimo-prop-item">
                <div class="itimo-character-info">
                  <div>
                    <h3 class="itimo-character-name">{{ character.name }}</h3>
                    <div class="itimo-character-tags">
                      <q-chip size="sm" color="primary" text-color="white">
                        {{ character.role }}
                      </q-chip>
                      <q-chip size="sm" outline>
                        {{ character.gender }} · {{ character.age }}
                      </q-chip>
                    </div>
                  </div>
                  <p class="itimo-character-desc">{{ formatCharacterDescription(character) }}</p>
                </div>

                <div class="itimo-character-preview">
                  <div>
                    <div class="itimo-preview-grid">
                      <div class="itimo-preview-item">
                        <template v-if="character.imagePath">
                          <img
                            :src="getCharacterImageUrl(character.imagePath)"
                            :alt="character.name"
                            style="cursor: zoom-in"
                            @click="openImageViewer(getCharacterImageUrl(character.imagePath))"
                          />
                          <q-btn
                            round
                            dense
                            flat
                            icon="close"
                            color="negative"
                            size="sm"
                            class="itimo-delete-image-btn"
                            @click="deleteCharacterImage(character.id)"
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
                          @click="uploadCharacterImage(character.id)"
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
                    label="加入角色库"
                    icon="add_photo_alternate"
                    size="sm"
                    :disable="!character.imagePath"
                    @click="addToLibrary(character.id)"
                  />
                  <q-btn
                    color="warning"
                    outline
                    rounded
                    label="编辑"
                    icon="edit"
                    size="sm"
                    @click="editCharacter(character)"
                  />
                </div>
                <div style="display: flex; justify-content: flex-end; align-items: center; padding: 10px; gap: 10px">
                  <q-select
                    v-model="character.promptThemeId"
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
                    label="AI 生成"
                    icon="auto_awesome"
                    size="md"
                    :disable="!character.promptThemeId"
                    @click="generateCharacterImage(character.id)"
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { useWorkspaceStore } from 'src/stores/workspace-store';
import { useSettingsStore } from 'src/stores/settings-store';
import { useAutoSave } from 'src/composables/use-auto-save';
import { ensureGlobalLibraryDir } from 'src/services/library-paths';
import { getElectronApi } from 'src/services/native-fs';
import { toLocalFileUrl } from 'src/composables/use-local-file-url';
import { generateText, generateImage } from 'src/services/ai';
import { PROMPT_THEMES } from 'src/services/prompt';
import {
  PageType,
  FeatureType,
  getPromptThemeOptions,
  getPromptApiBinding,
  getPromptIdForPage,
} from 'src/constants/prompt-bindings';
import { MATERIAL_TYPES, ART_STYLES, MOOD_ATMOSPHERES } from 'src/constants/drama-options';
import CharacterDialog from 'src/components/character/CharacterDialog.vue';
import type { Character } from 'src/core/types/project';

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

const characters = computed(() => workspace.characters);

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

// 自动保存功能 - 角色数据通过 workspace store 实时保存到数据库

function formatCharacterDescription(character: Character): string {
  const parts: string[] = [];
  parts.push(`我是${character.name}`);
  if (character.gender) {
    parts.push(`性别：${character.gender}`);
  }
  if (character.age) {
    parts.push(`年龄：${character.age}岁`);
  }

  if (character.height) {
    parts.push(`身高：${character.height}cm`);
  }

  if (character.weight) {
    parts.push(`体重：${character.weight}kg`);
  }

  if (character.bodyType) {
    parts.push(`体型${character.bodyType}`);
  }

  if (character.facialFeatures) {
    parts.push(`面容：${character.facialFeatures}`);
  }

  if (character.identity) {
    parts.push(`身份是${character.identity}`);
  }

  if (character.personality) {
    parts.push(`性格${character.personality}`);
  }

  if (character.speakingStyle) {
    parts.push(`说话方式${character.speakingStyle}`);
  }

  if (character.interests) {
    parts.push(`兴趣特长：${character.interests}`);
  }

  return parts.join('，') || '暂无描述';
}

function getCharacterImageUrl(relativePath: string): string {
  const api = getElectronApi();
  if (!api || !workspace.rootPath) return '';
  const fullPath = `${workspace.rootPath}/${relativePath}`;
  return toLocalFileUrl(fullPath);
}

function editCharacter(character?: Character) {
  $q.dialog({
    component: CharacterDialog,
    componentProps: {
      character,
    },
  }).onOk((characterData: Character) => {
    void saveCharacter(characterData);
  });
}

function openCharacterDialog(character?: Character) {
  $q.dialog({
    component: CharacterDialog,
    componentProps: {
      character,
    },
  }).onOk((characterData: Character) => {
    void saveCharacter(characterData);
  });
}

async function saveCharacter(characterData: Character) {
  if (!workspace.projectId) return;

  try {
    const existingIndex = workspace.characters.findIndex((c) => c.id === characterData.id);

    if (existingIndex >= 0) {
      await workspace.updateCharacter(characterData.id, characterData);
    } else {
      const newCharacter = await workspace.addCharacter(characterData);
      if (newCharacter) {
        characterData = newCharacter;
      }
    }

    $q.notify({
      type: 'positive',
      timeout: 1000,
      message: existingIndex >= 0 ? '角色已更新' : '角色已添加',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', timeout: 1000, message: `保存角色失败: ${msg}` });
  }
}

async function generateCharacterImage(characterId: string) {
  const character = characters.value.find((c: Character) => c.id === characterId);
  if (!character) {
    $q.notify({ type: 'negative', message: '未找到角色信息' });
    return;
  }

  const themeId = character.promptThemeId;
  if (!themeId) {
    $q.notify({ type: 'warning', message: '请先为该角色选择提示词套件' });
    return;
  }

  // 获取对应的提示词ID
  const promptId = getPromptIdForPage(themeId, PageType.CHARACTER);

  // 获取提示词绑定的 API 配置名称
  const apiConfigName = getPromptApiBinding(promptId);
  if (!apiConfigName) {
    $q.notify({ type: 'warning', message: '请先在设置中为该提示词绑定 API 接口' });
    return;
  }

  try {
    // 显示开始提示
    $q.notify({
      type: 'info',
      message: '正在构建提示词...',
      timeout: 1000,
    });

    // 构建完整的提示词（包含翻译）
    const isEnglish = character.promptLangEn ?? false;
    const fullPrompt = await buildCharacterPrompt(character, promptId, themeId, isEnglish);

    console.log('Generate image for character:', characterId);
    console.log('Using prompt ID:', promptId);
    console.log('Using API config:', apiConfigName);
    console.log('Full prompt:', fullPrompt);

    // 显示生成中提示
    $q.notify({
      type: 'info',
      message: '正在生成图片...',
      timeout: 2000,
    });

    // 调用 AI 接口生成图片（使用提示词绑定的 API 配置）
    const imageResponse = await generateImage(
      {
        prompt: fullPrompt,
        n: 1,
        width: 1024,
        height: 1024,
      },
      apiConfigName,
    );

    if (!imageResponse.images || imageResponse.images.length === 0) {
      throw new Error('AI 接口未返回图片');
    }

    // 获取生成的图片（base64 或 URL）
    const imageData = imageResponse.images[0];
    if (!imageData) {
      throw new Error('无法获取生成的图片数据');
    }

    // 保存图片到本地
    const imagePath = await saveCharacterImage(character, imageData);

    // 更新角色的 imagePath
    await workspace.updateCharacter(characterId, {
      imagePath,
    });

    $q.notify({
      type: 'positive',
      message: '图片生成成功',
      timeout: 3000,
    });
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

/**
 * 保存生成的角色图片到本地
 * @param character 角色信息
 * @param imageData base64 或 URL 格式的图片数据
 * @returns 相对于项目根目录的图片路径
 */
async function saveCharacterImage(character: Character, imageData: string): Promise<string> {
  const api = getElectronApi();
  if (!api || !workspace.rootPath) {
    throw new Error('无法访问文件系统');
  }

  try {
    // 创建 characters 目录
    const charactersDir = await api.pathJoin(workspace.rootPath, 'characters');
    await api.fsEnsureDir(charactersDir);

    // 生成文件名
    const timestamp = Date.now();
    const fileName = `${character.name}_${timestamp}.png`;
    const filePath = await api.pathJoin(charactersDir, fileName);

    // 处理 base64 数据
    let base64String: string;

    if (imageData.startsWith('data:image')) {
      // base64 格式：data:image/png;base64,xxxxx
      const parts = imageData.split(',');
      base64String = parts[1] || '';
      if (!base64String) {
        throw new Error('无效的 base64 图片数据');
      }
    } else if (imageData.startsWith('http')) {
      // URL 格式：需要下载
      const response = await fetch(imageData);
      if (!response.ok) {
        throw new Error(`下载图片失败：${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      base64String = btoa(String.fromCharCode(...Array.from(bytes)));
    } else {
      // 假设是 base64 字符串
      base64String = imageData;
    }

    // 使用 fsWriteBase64File 写入 base64 数据
    await api.fsWriteBase64File(filePath, base64String);

    console.log('Image saved to:', filePath);

    // 返回相对路径
    return `characters/${fileName}`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`保存图片失败：${msg}`);
  }
}

/**
 * 将中文文本翻译为英文
 * @param text 中文文本
 * @returns 英文文本
 */
async function translateToEnglish(text: string): Promise<string> {
  if (!text.trim()) return '';

  try {
    // 使用当前选择的文本 AI 接口进行翻译
    const configs = settingsStore.settings.api.customConfigs ?? [];
    const textConfig = configs.find((c) => c.serviceType === 'text');

    if (!textConfig) {
      console.warn('No text API configured for translation');
      return text; // 如果没有配置文本接口，返回原文
    }

    // 临时将翻译配置排到第一位
    const otherConfigs = configs.filter((c) => c.name !== textConfig.name);
    settingsStore.settings.api.customConfigs = [textConfig, ...otherConfigs];

    const prompt = `Translate the following Chinese text to English. Only return the translated text, no explanations:

${text}`;

    const result = await generateText({ prompt });

    // 恢复原始顺序
    settingsStore.settings.api.customConfigs = configs;

    return result.text.trim();
  } catch (e) {
    console.error('Translation failed:', e);
    return text; // 翻译失败时返回原文
  }
}

/**
 * 构建角色图片生成的完整提示词
 * @param character 角色信息
 * @param promptId 提示词ID
 * @param themeId 提示词套件ID
 * @param isEnglish 是否使用英文提示词
 * @returns 完整的英文提示词
 */
async function buildCharacterPrompt(
  character: Character,
  promptId: string,
  themeId: string,
  isEnglish: boolean = false,
): Promise<string> {
  const lines: string[] = [];

  // 1. 项目风格（英文）
  const manifest = workspace.manifest;
  if (manifest) {
    const materialType = manifest.materialType;
    const artStyle = manifest.artStyle;
    const moodAtmosphere = manifest.moodAtmosphere;

    if (materialType) {
      const material = MATERIAL_TYPES.find((m) => m.id === materialType);
      if (material) {
        lines.push(`Material: ${material.label}`);
      }
    }

    if (artStyle) {
      const art = ART_STYLES.find((a) => a.id === artStyle);
      if (art) {
        lines.push(`Art Style: ${art.label}`);
      }
    }

    if (moodAtmosphere) {
      const mood = MOOD_ATMOSPHERES.find((m) => m.id === moodAtmosphere);
      if (mood) {
        lines.push(`Mood: ${mood.label}`);
      }
    }
  }

  // 2. 固定的角色四视图规则（英文）
  lines.push('');
  lines.push(
    'Character orthographic sheet — image only, no text reply. ONE image: 2×2 grid. TL=head close-up (top of head to collarbone). TR=front full body. BL=left profile full body (90°). BR=back full body (180°). Panels 2–4: full figure head-to-toe, upright stance, arms at sides, empty hands, neutral face (closed lips). Solid white only (RGB 255,255,255). No text/labels/watermarks, no environment/ground/shadows, no handheld props. Same character in all panels; soft even lighting; high detail.',
  );

  // 3. 提示词套件中的内容
  const promptContent = getPromptContent(promptId, themeId, isEnglish);
  if (promptContent) {
    lines.push('');
    if (isEnglish) {
      // 英文模式：直接使用英文提示词
      lines.push(promptContent);
    } else {
      // 中文模式：提取英文部分并翻译
      const englishContent = extractEnglishContent(promptContent);
      if (englishContent) {
        lines.push(englishContent);
      }
    }
  }

  // 4. 角色描述（翻译为英文）
  lines.push('');
  lines.push('Character Description:');
  const characterDesc = formatCharacterDescription(character);

  // 翻译角色描述为英文
  const englishDesc = await translateToEnglish(characterDesc);
  lines.push(englishDesc);

  return lines.join('\n');
}

/**
 * 从提示词内容中提取英文部分
 * @param content 提示词内容（可能包含中英文）
 * @returns 只包含英文的部分
 */
function extractEnglishContent(content: string): string {
  // 按行分割
  const lines = content.split('\n');
  const englishLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 检查是否包含英文字符
    if (/[a-zA-Z]/.test(trimmed)) {
      // 如果这一行主要是英文（英文字符占比超过50%）
      const englishChars = (trimmed.match(/[a-zA-Z]/g) || []).length;
      const totalChars = trimmed.length;
      if (englishChars / totalChars > 0.3) {
        englishLines.push(trimmed);
      }
    }
  }

  return englishLines.join('\n');
}

/**
 * 获取提示词内容（支持语言切换）
 * @param promptId 提示词ID
 * @param themeId 提示词套件ID
 * @param isEnglish 是否使用英文版本
 */
function getPromptContent(promptId: string, themeId: string, isEnglish: boolean = false): string | null {
  // 先从内置主题中查找
  for (const theme of PROMPT_THEMES) {
    if (theme.id === themeId) {
      const prompt = theme.prompts.find((p) => p.id === promptId);
      if (prompt) {
        return isEnglish ? prompt.contentEn : prompt.contentZh;
      }
    }
  }

  // 再从用户自建主题中查找
  const userThemes = settingsStore.settings.prompt.userThemes ?? [];
  for (const theme of userThemes) {
    if (theme.id === themeId) {
      const prompt = theme.prompts.find((p) => p.id === promptId);
      if (prompt) {
        return isEnglish ? prompt.contentEn : prompt.contentZh;
      }
    }
  }

  // 如果是可编辑的内置主题，检查是否有覆盖内容
  const overridesKey = isEnglish ? 'builtinThemeOverridesEn' : 'builtinThemeOverridesZh';
  const overrides = settingsStore.settings.prompt[overridesKey]?.[themeId];
  if (overrides && overrides[promptId]) {
    return overrides[promptId];
  }

  return null;
}

async function uploadCharacterImage(characterId: string) {
  const api = getElectronApi();
  if (!api) {
    $q.notify({
      type: 'warning',
      message: '此功能仅在桌面端可用',
    });
    return;
  }

  const character = characters.value.find((c: Character) => c.id === characterId);
  if (!character) {
    $q.notify({
      type: 'negative',
      message: '未找到角色信息',
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

    const charactersDir = await api.pathJoin(projectRoot, 'characters');
    await api.fsEnsureDir(charactersDir);

    const ext = sourcePath.split('.').pop() || 'png';
    const timestamp = Date.now();
    const fileName = `${character.name}_${timestamp}.${ext}`;
    const targetPath = await api.pathJoin(charactersDir, fileName);

    await api.fsCopyFile(sourcePath, targetPath);

    await workspace.updateCharacter(characterId, {
      imagePath: `characters/${fileName}`,
    });

    $q.notify({
      type: 'positive',
      message: `已上传 ${character.name} 的图片`,
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

function deleteCharacterImage(characterId: string) {
  const api = getElectronApi();
  if (!api) {
    $q.notify({
      type: 'warning',
      message: '此功能仅在桌面端可用',
    });
    return;
  }

  const character = characters.value.find((c: Character) => c.id === characterId);
  if (!character || !character.imagePath) {
    return;
  }

  const imagePath = character.imagePath;

  $q.dialog({
    title: '确认删除',
    message: `确定要删除 ${character.name} 的图片吗？`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void deleteImageAsync(imagePath, character);
  });
}

async function deleteImageAsync(imagePath: string, character: Character) {
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

    await workspace.updateCharacter(character.id, {
      imagePath: undefined,
    });

    $q.notify({
      type: 'positive',
      message: `已删除 ${character.name} 的图片`,
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

async function addToLibrary(characterId: string) {
  const api = getElectronApi();
  if (!api) {
    $q.notify({
      type: 'warning',
      message: '此功能仅在桌面端可用',
    });
    return;
  }

  const character = characters.value.find((c: Character) => c.id === characterId);
  if (!character || !character.imagePath) {
    $q.notify({
      type: 'negative',
      message: '请先上传角色图片',
    });
    return;
  }

  try {
    const projectRoot = workspace.rootPath;
    if (!projectRoot) {
      throw new Error('项目路径未找到');
    }

    const sourcePath = await api.pathJoin(projectRoot, character.imagePath);
    const libraryDir = await ensureGlobalLibraryDir('characters');

    const ext = character.imagePath.split('.').pop() || 'png';
    const timestamp = Date.now();
    const fileName = `${character.name}_${timestamp}.${ext}`;
    const targetPath = await api.pathJoin(libraryDir, fileName);

    await api.fsCopyFile(sourcePath, targetPath);

    $q.notify({
      type: 'positive',
      message: `已将 ${character.name} 的图片加入角色库`,
      caption: fileName,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: '加入角色库失败',
      caption: msg,
    });
  }
}

function deleteCharacter(characterId: string) {
  const character = characters.value.find((c: Character) => c.id === characterId);
  if (!character) return;

  $q.dialog({
    title: '确认删除',
    message: `确定要删除角色"${character.name}"吗？`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void deleteCharacterAsync(characterId);
  });
}

async function deleteCharacterAsync(characterId: string) {
  try {
    await workspace.deleteCharacter(characterId);

    $q.notify({
      type: 'positive',
      message: '角色已删除',
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
 * 从故事页面的输入框中提取角色
 */
async function extractCharactersFromStory() {
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

    // 获取提示词ID
    const promptId = getPromptIdForPage(
      selectedPromptThemeForExtraction.value,
      PageType.CHARACTER,
      FeatureType.EXTRACTION,
    );

    // 获取提示词内容
    const promptContent = getPromptContent(promptId, selectedPromptThemeForExtraction.value);
    if (!promptContent) {
      $q.notify({ type: 'warning', message: '请先在设置中配置角色提取提示词' });
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
    let extractedCharacters: Array<{
      name: string;
      role: '主角' | '配角' | '次要角色';
      appearance: string;
      description: string;
    }> = [];

    try {
      // 清理 markdown 代码块标记
      let cleanText = result.text.trim();
      // 移除首尾的 ```json 和 ``` 标记
      const jsonMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        cleanText = jsonMatch[1].trim();
      }
      extractedCharacters = JSON.parse(cleanText);
    } catch {
      console.error('解析失败，原始返回:', result.text);
      $q.notify({
        type: 'warning',
        message: '提取结果格式错误，请检查提示词配置',
        timeout: 3000,
      });
      return;
    }

    // 将提取的角色添加到项目
    if (!workspace.projectId) {
      $q.notify({ type: 'negative', message: '项目信息未加载' });
      return;
    }

    let addedCount = 0;
    for (const extractedChar of extractedCharacters) {
      const existingIndex = workspace.characters.findIndex(
        (c) => c.name === extractedChar.name,
      );

      if (existingIndex < 0) {
        await workspace.addCharacter({
          name: extractedChar.name,
          description: extractedChar.description,
          role: extractedChar.role,
          gender: '',
          age: '',
          height: '',
          weight: '',
          bodyType: '',
          facialFeatures: extractedChar.appearance,
          identity: '',
          personality: '',
          speakingStyle: '',
          interests: '',
        });
        addedCount++;
      }
    }

    $q.notify({
      type: 'positive',
      message: `成功提取 ${addedCount} 个新角色`,
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
.itimo-character-desc {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 6;
  line-clamp: 6;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: calc(1.5em * 6); /* 确保始终占据6行的高度，假设行高为1.5em */
  line-height: 1.5em;
  margin: 0;
}

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

/* 中英文切换开关 */
.itimo-lang-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 14px;
  background: var(--itimo-surface-border);
  cursor: pointer;
  transition: background 0.2s ease;
}

.itimo-lang-toggle:hover {
  background: color-mix(in srgb, var(--itimo-brand) 15%, var(--itimo-surface-border));
}

.itimo-lang-option {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--itimo-text-secondary);
  transition: color 0.2s ease;
}

.itimo-lang-option.active {
  color: var(--itimo-text-primary);
}

.itimo-lang-switch {
  width: 28px;
  height: 16px;
  border-radius: 8px;
  background: var(--itimo-brand);
  position: relative;
  transition: background 0.2s ease;
}

.itimo-lang-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s ease;
}

.itimo-lang-switch.en {
  background: var(--itimo-brand);
}

.itimo-lang-switch.en::after {
  transform: translateX(12px);
}
</style>
