<template>
  <div class="itimo-produce-page">
    <!-- Page Header -->
    <div class="itimo-produce-header">
      <div class="row items-center gap-md">
        <h3 class="">剧本</h3>
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
      <p class="itimo-produce-subtitle">管理角色、配置生成参数、生成和编辑剧本</p>
    </div>

    <!-- Character Management Section -->
    <section class="itimo-produce-section">
      <div class="itimo-section-card">
        <div class="itimo-card-header">
          <h2 class="itimo-card-title">角色管理</h2>
          <div class="itimo-card-actions">
            <q-btn
              color="primary"
              outline
              rounded
              icon="people"
              label="选择已有角色"
              @click="showCharacterList = !showCharacterList"
            />
            <q-btn
              color="primary"
              unelevated
              rounded
              icon="person_add"
              label="创建角色"
              @click="goToCharactersPage"
            />
          </div>
        </div>

        <div v-if="showCharacterList" class="itimo-card-body">
          <div v-if="characters.length === 0" class="itimo-empty-state-small">
            <q-icon name="face" size="48px" color="grey-5" />
            <p class="itimo-empty-text">暂无角色，点击上方按钮创建角色</p>
          </div>

          <div v-else>
            <div class="itimo-character-avatars">
              <div
                v-for="character in characters"
                :key="character.id"
                class="itimo-character-avatar-item"
                :class="{ 'itimo-character-selected': isCharacterSelected(character.id) }"
                @click="toggleCharacterSelection(character.id)"
              >
                <div class="itimo-avatar-wrapper">
                  <div class="itimo-avatar-icon">
                    <img
                      :src="getCharacterAvatarImage(character)"
                      :alt="character.name"
                      class="itimo-avatar-img"
                    />
                  </div>
                  <div v-if="isCharacterSelected(character.id)" class="itimo-avatar-check">
                    <q-icon name="check_circle" size="24px" color="positive" />
                  </div>
                </div>
                <div class="itimo-avatar-name">{{ character.name }}</div>
              </div>
            </div>

            <div class="itimo-character-selection-summary">
              <span class="itimo-selection-text">
                已选择 {{ selectedCharacterIds.length }} 个角色
              </span>
              <q-btn
                v-if="selectedCharacterIds.length > 0"
                flat
                dense
                label="清除选择"
                color="grey-7"
                size="sm"
                @click="clearSelection"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Generation Options -->
    <section class="itimo-produce-section">
      <div class="itimo-section-card">
        <div class="itimo-card-header">
          <h2 class="itimo-card-title">生成设置</h2>
        </div>
        <div class="itimo-card-body" style="padding: 24px">
          <div class="column q-gutter-md">
            <q-input
              v-model="emotionalHighlight"
              label="情绪看点"
              outlined
              dense
              placeholder="例如：极致的憋屈转为打脸的爽"
            >
              <template v-slot:hint>
                <div class="text-caption">
                  提示：极致的憋屈转为打脸的"爽"，意乱情迷的"拉扯感"，细思极恐的"反转"，命悬一线的"紧张感"，久别重逢的"温情"，绝地反击的"燃"，身份揭秘的"震撼"，误会解开的"释然"，复仇成功的"畅快"，牺牲奉献的"感动"
                </div>
              </template>
              <template v-slot:append>
                <q-icon name="help_outline" color="grey-6">
                  <q-tooltip max-width="400px">
                    <div class="text-body2">
                      <div class="text-weight-bold q-mb-xs">爆款情绪看点示例：</div>
                      <div>• 极致的憋屈转为打脸的"爽"</div>
                      <div>• 意乱情迷的"拉扯感"</div>
                      <div>• 细思极恐的"反转"</div>
                      <div>• 命悬一线的"紧张感"</div>
                      <div>• 久别重逢的"温情"</div>
                      <div>• 绝地反击的"燃"</div>
                      <div>• 身份揭秘的"震撼"</div>
                      <div>• 误会解开的"释然"</div>
                      <div>• 复仇成功的"畅快"</div>
                      <div>• 牺牲奉献的"感动"</div>
                    </div>
                  </q-tooltip>
                </q-icon>
              </template>
            </q-input>

            <q-select v-model="pacing" :options="pacingOptions" label="节奏" outlined dense />

            <div class="row justify-end items-center q-gutter-sm">
              <q-select
                v-model="selectedApiConfig"
                :options="textApiOptions"
                option-label="name"
                option-value="name"
                outlined
                dense
                emit-value
                map-options
                placeholder="选择 AI 接口"
                style="min-width: 180px"
                :disable="isGenerating"
              >
                <template #prepend>
                  <q-icon name="smart_toy" size="xs" />
                </template>
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey text-caption">
                      请先在设置中添加文本 API
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
              <q-btn
                color="primary"
                unelevated
                rounded
                :label="isGenerating ? '生成中…' : '生成剧本'"
                :icon="isGenerating ? 'hourglass_top' : 'auto_awesome'"
                :disable="isGenerating || !selectedApiConfig"
                :loading="isGenerating"
                @click="generateScript"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Generated Script Section -->
    <section class="itimo-produce-section">
      <div class="itimo-section-card">
        <div class="itimo-card-header">
          <h2 class="itimo-card-title">剧本内容</h2>
        </div>
        <div class="itimo-card-body" style="padding: 24px">
          <q-input
            v-model="scriptContent"
            type="textarea"
            outlined
            placeholder="点击上方【生成剧本】按钮，AI 将根据故事梗概、角色信息和情绪看点生成剧本内容..."
            class="itimo-script-editor"
            :rows="20"
          />
        </div>
        <div class="itimo-card-footer">
          <div class="text-caption text-grey-6">
            已自动保存
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useWorkspaceStore } from 'src/stores/workspace-store';
import { useSettingsStore } from 'src/stores/settings-store';
import { useAutoSave } from 'src/composables/use-auto-save';
import { loadEpisodeManifestFromPath, saveEpisodeManifestFromPath } from 'src/db/project';
import { getElectronApi } from 'src/services/native-fs';
import { labelMaterialType, labelArtStyle, labelMoodAtmosphere } from 'src/constants/drama-options';
import { generateText } from 'src/services/ai';
import type { Character } from 'src/core/types/project';

// Import character avatar images
import heroineAvatar from 'src/assets/character/heroine.png';
import leadingActorAvatar from 'src/assets/character/leading_actor.png';
import supportingActressAvatar from 'src/assets/character/SupportingActress.png';
import supportingActorAvatar from 'src/assets/character/SupportingActor.png';
import femaleMinorAvatar from 'src/assets/character/Female_minor_character.png';
import maleSecondaryAvatar from 'src/assets/character/Male_secondary_character.png';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const workspace = useWorkspaceStore();
const settingsStore = useSettingsStore();

const emotionalHighlight = ref('');
const pacing = ref('从容');
const scriptContent = ref('');
const showCharacterList = ref(false);
const selectedCharacterIds = ref<string[]>([]);
const isGenerating = ref(false);

// ── AI 接口选择 ───────────────────────────────────────────────
/** 只显示 serviceType === 'text' 的配置 */
const textApiOptions = computed(() =>
  (settingsStore.settings.api.customConfigs ?? []).filter((c) => c.serviceType === 'text'),
);
/** 当前选中的接口名称（用 name 作为唯一标识） */
const selectedApiConfig = ref<string>('');

const pacingOptions = ['急促', '较快', '从容', '较慢', '缓慢'];

const episodeId = computed(() => String(route.params.episodeId));

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

const characters = computed(() => workspace.characters);

function getCharacterAvatarImage(character: Character): string {
  const isFemale = character.gender === '女';
  const role = character.role;

  if (role === '主角') {
    return isFemale ? heroineAvatar : leadingActorAvatar;
  } else if (role === '配角') {
    return isFemale ? supportingActressAvatar : supportingActorAvatar;
  } else {
    // 次要角色
    return isFemale ? femaleMinorAvatar : maleSecondaryAvatar;
  }
}

let storyInputValue = '';

onMounted(async () => {
  await loadSelectedCharacters();
  await loadScriptData();
});

// 自动保存功能
useAutoSave(async () => {
  // 保存选中的角色（静默保存）
  if (selectedCharacterIds.value.length > 0) {
    await saveSelectedCharacters(true);
  }
  // 保存剧本（静默保存）
  await saveScriptData(true);
});

async function loadSelectedCharacters() {
  if (!workspace.rootPath) return;

  try {
    const episodes = workspace.manifest?.episodes ?? [];
    const episode = episodes.find((ep) => ep.id === episodeId.value);
    if (!episode) return;

    const api = getElectronApi();
    if (!api) return;

    const episodeManifest = await loadEpisodeManifestFromPath(workspace.rootPath, episode.folder);
    selectedCharacterIds.value = episodeManifest.selectedCharacterIds ?? [];
  } catch (e) {
    console.error('Failed to load selected characters:', e);
  }
}

async function loadScriptData() {
  if (!workspace.rootPath) return;

  try {
    const episodes = workspace.manifest?.episodes ?? [];
    const episode = episodes.find((ep) => ep.id === episodeId.value);
    if (!episode) return;

    const api = getElectronApi();
    if (!api) return;

    const episodeManifest = await loadEpisodeManifestFromPath(workspace.rootPath, episode.folder);

    // 加载故事梗概和剧本（从第一个 script block）
    if (episodeManifest.script && episodeManifest.script.length > 0) {
      const firstBlock = episodeManifest.script[0];
      if (firstBlock) {
        storyInputValue = firstBlock.heading || '';
        scriptContent.value = firstBlock.body || '';
      }
    }
  } catch (e) {
    console.error('Failed to load script data:', e);
  }
}

async function saveScriptData(silent = false) {
  if (!workspace.rootPath) return;

  try {
    const episodes = workspace.manifest?.episodes ?? [];
    const episode = episodes.find((ep) => ep.id === episodeId.value);
    if (!episode) return;

    const api = getElectronApi();
    if (!api) return;

    const episodeManifest = await loadEpisodeManifestFromPath(workspace.rootPath, episode.folder);

    // 确保 script 字段存在
    if (!episodeManifest.script) {
      episodeManifest.script = [];
    }

    // 保存剧本到第一个 script block 的 body
    if (episodeManifest.script.length === 0) {
      episodeManifest.script = [
        {
          id: crypto.randomUUID(),
          heading: storyInputValue,
          body: scriptContent.value,
        },
      ];
    } else if (episodeManifest.script[0]) {
      episodeManifest.script[0].body = scriptContent.value;
    }

    await saveEpisodeManifestFromPath(workspace.rootPath, episode.folder, episodeManifest);

    if (!silent) {
      $q.notify({
        type: 'positive',
        message: '剧本已保存',
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', timeout: 1000, message: `保存失败: ${msg}` });
  }
}

async function generateScript() {
  if (!selectedApiConfig.value) {
    $q.notify({ type: 'warning', message: '请先选择 AI 接口' });
    return;
  }

  // 找到选中的配置，临时注入到 settings 让 ai/index.ts 能读到
  const configs = settingsStore.settings.api.customConfigs ?? [];
  const targetConfig = configs.find((c) => c.name === selectedApiConfig.value);
  if (!targetConfig) {
    $q.notify({ type: 'negative', message: '未找到对应的 API 配置' });
    return;
  }

  // ── 组装 prompt ──────────────────────────────────────────
  const lines: string[] = [];

  lines.push('你是一位专业的短剧剧本创作者，请根据以下信息创作一集完整的短剧剧本。');
  lines.push('');

  // 项目风格
  lines.push(`【项目风格】`);
  lines.push(`基础材质：${materialTypeLabel.value}`);
  lines.push(`核心画风：${artStyleLabel.value}`);
  lines.push(`氛围画风：${moodAtmosphereLabel.value}`);
  lines.push('');

  // 故事梗概
  lines.push(`【故事梗概】`);
  lines.push(storyInputValue.trim() || '（无）');
  lines.push('');

  // 角色信息（仅选中的）
  if (selectedCharacterIds.value.length > 0) {
    const selectedChars = characters.value.filter((c) => selectedCharacterIds.value.includes(c.id));
    if (selectedChars.length > 0) {
      lines.push(`【角色信息】`);
      for (const char of selectedChars) {
        const parts = [`${char.name}（${char.role}，${char.gender}`];
        if (char.age) parts.push(`，${char.age}岁`);
        parts.push('）');
        if (char.identity) parts.push(`  身份：${char.identity}`);
        if (char.personality) parts.push(`  性格：${char.personality}`);
        if (char.speakingStyle) parts.push(`  说话风格：${char.speakingStyle}`);
        lines.push(parts.join(''));
      }
      lines.push('');
    }
  }

  // 生成设置（有填写才加入）
  const hasSettings = emotionalHighlight.value.trim() || pacing.value;
  if (hasSettings) {
    lines.push(`【生成设置】`);
    if (emotionalHighlight.value.trim()) {
      lines.push(`情绪看点：${emotionalHighlight.value.trim()}`);
    }
    if (pacing.value) {
      lines.push(`节奏：${pacing.value}`);
    }
    lines.push('');
  }

  lines.push('请输出完整剧本，包含场景描述、人物对白和动作指示，格式清晰易读。');

  const prompt = lines.join('\n');

  // ── 调用 AI ──────────────────────────────────────────────
  isGenerating.value = true;
  try {
    // 临时将选中配置排到第一位，让 resolveConfig 能找到它
    const otherConfigs = configs.filter((c) => c.name !== targetConfig.name);
    settingsStore.settings.api.customConfigs = [targetConfig, ...otherConfigs];

    const result = await generateText({ prompt });
    scriptContent.value = result.text;

    $q.notify({ type: 'positive', message: '剧本生成成功', timeout: 2000 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', message: `生成失败：${msg}`, timeout: 4000 });
  } finally {
    isGenerating.value = false;
    // 恢复原始顺序
    settingsStore.settings.api.customConfigs = configs;
  }
}

function goToCharactersPage() {
  const projectId = String(route.params.projectId);
  void router.push(`/project/${projectId}/produce/${episodeId.value}/characters`);
}

function isCharacterSelected(characterId: string): boolean {
  return selectedCharacterIds.value.includes(characterId);
}

function toggleCharacterSelection(characterId: string) {
  const index = selectedCharacterIds.value.indexOf(characterId);
  if (index >= 0) {
    selectedCharacterIds.value.splice(index, 1);
  } else {
    selectedCharacterIds.value.push(characterId);
  }
  void saveSelectedCharacters();
}

function clearSelection() {
  selectedCharacterIds.value = [];
  void saveSelectedCharacters();
}

async function saveSelectedCharacters(silent = false) {
  if (!workspace.rootPath) return;

  try {
    const episodes = workspace.manifest?.episodes ?? [];
    const episode = episodes.find((ep) => ep.id === episodeId.value);
    if (!episode) return;

    const api = getElectronApi();
    if (!api) return;

    const episodeManifest = await loadEpisodeManifestFromPath(workspace.rootPath, episode.folder);
    episodeManifest.selectedCharacterIds = selectedCharacterIds.value;
    await saveEpisodeManifestFromPath(workspace.rootPath, episode.folder, episodeManifest);

    if (!silent) {
      $q.notify({
        type: 'positive',
        message: `已选择 ${selectedCharacterIds.value.length} 个角色`,
        timeout: 1000,
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', timeout: 1000, message: `保存选择失败: ${msg}` });
  }
}
</script>

<style scoped>
.itimo-produce-header {
  margin-bottom: 12px;
}

.itimo-character-avatars {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.itimo-character-avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: var(--itimo-bg-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.itimo-character-avatar-item:hover {
  background: color-mix(in srgb, var(--itimo-brand) 5%, var(--itimo-bg-secondary));
  border-color: var(--itimo-brand);
}

.itimo-character-selected {
  background: color-mix(in srgb, var(--itimo-brand) 10%, var(--itimo-bg-secondary));
  border-color: var(--itimo-brand);
}

.itimo-avatar-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.itimo-avatar-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--itimo-bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--itimo-surface-border);
  overflow: hidden;
}

.itimo-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.itimo-avatar-check {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.itimo-avatar-name {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--itimo-text-primary);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.itimo-avatar-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.itimo-character-avatar-item:hover .itimo-avatar-actions {
  opacity: 1;
}

.itimo-character-selection-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--itimo-bg-secondary);
  border-radius: 8px;
  margin-top: 16px;
}

.itimo-selection-text {
  font-size: 0.88rem;
  color: var(--itimo-text-secondary);
  font-weight: 500;
}
</style>
