<template>
  <div class="itimo-prompt-layout">
    <!-- 左侧：主题列表 -->
    <div class="itimo-prompt-sidebar">
      <!-- 可滚动区域 -->
      <div class="itimo-sidebar-scroll">
        <div class="itimo-sidebar-title">提示词套件</div>

        <!-- 内置主题 -->
        <div
          v-for="theme in PROMPT_THEMES"
          :key="theme.id"
          class="itimo-theme-item"
          :class="{ 'itimo-theme-active': activeThemeId === theme.id }"
          @click="activeThemeId = theme.id"
        >
          <div class="itimo-theme-label">{{ theme.label }}</div>
          <div class="itimo-theme-desc">{{ theme.description }}</div>
        </div>

        <!-- 用户自建主题 -->
        <template v-if="userThemes.length > 0">
          <div class="itimo-sidebar-divider" />
          <div
            v-for="theme in userThemes"
            :key="theme.id"
            class="itimo-theme-item"
            :class="{ 'itimo-theme-active': activeThemeId === theme.id }"
            @click="activeThemeId = theme.id"
          >
            <div class="row items-center justify-between no-wrap">
              <div class="itimo-theme-label">{{ theme.label }}</div>
              <q-btn
                flat
                round
                dense
                icon="close"
                size="xs"
                color="grey"
                @click.stop="confirmDeleteTheme(theme.id, theme.label)"
              >
                <q-tooltip>删除主题</q-tooltip>
              </q-btn>
            </div>
          </div>
        </template>
      </div>

      <!-- 固定底部：新增主题按钮 -->
      <div class="itimo-sidebar-add-theme" @click="showNewThemeInput = true">
        <q-icon name="add" size="14px" />
        <span>新建提示词套件</span>
      </div>
    </div>

    <!-- 右侧：提示词内容 -->
    <div class="itimo-prompt-content">
      <template v-if="activeTheme">
        <!-- 固定：标题栏 -->
        <div class="itimo-content-header">
          <div>
            <div class="itimo-content-title">{{ activeTheme.label }}</div>
            <div v-if="activeTheme.description" class="itimo-content-desc">
              {{ activeTheme.description }}
            </div>
          </div>
        </div>

        <!-- 固定：阶段标签页 -->
        <div class="itimo-stage-tabs">
          <div
            v-for="stage in PROMPT_STAGES"
            :key="stage"
            class="itimo-stage-tab"
            :class="{ 'itimo-stage-tab-active': activeStage === stage }"
            @click="activeStage = stage"
          >
            {{ PROMPT_STAGE_LABELS[stage] }}
          </div>
        </div>

        <!-- 可滚动：提示词列表 -->
        <div class="itimo-prompts-list">
          <template v-if="activeStagePrompts.length > 0">
            <div v-for="item in activeStagePrompts" :key="item.id" class="itimo-prompt-card">
              <div class="itimo-prompt-card-header">
                <span class="itimo-prompt-card-title">{{ item.title }}</span>
                <div class="row items-center q-gutter-xs">
                  <!-- 中英文切换开关 -->
                  <div class="itimo-lang-toggle">
                    <span class="itimo-lang-option" :class="{ active: !getPromptLang(item.id) }"
                      >中</span
                    >
                    <div
                      class="itimo-lang-switch"
                      :class="{ en: getPromptLang(item.id) }"
                      @click="togglePromptLang(item.id)"
                    />
                    <span class="itimo-lang-option" :class="{ active: getPromptLang(item.id) }"
                      >EN</span
                    >
                  </div>
                  <!-- API 绑定下拉框和锁定按钮 -->
                  <q-select
                    :model-value="getPromptApiBinding(item.id)"
                    :options="getApiOptionsForPrompt(item)"
                    option-label="name"
                    option-value="name"
                    outlined
                    dense
                    emit-value
                    map-options
                    :disable="isPromptApiLocked(item.id)"
                    placeholder="选择接口"
                    style="min-width: 120px; font-size: 0.8rem"
                    @update:model-value="(v) => setPromptApiBinding(item.id, String(v))"
                  >
                    <template #prepend>
                      <q-icon name="smart_toy" size="xs" />
                    </template>
                  </q-select>
                  <q-btn
                    flat
                    round
                    dense
                    :icon="isPromptApiLocked(item.id) ? 'lock' : 'lock_open'"
                    :color="isPromptApiLocked(item.id) ? 'warning' : 'grey'"
                    :disable="!hasApiOptionsForPrompt(item)"
                    size="sm"
                    @click="togglePromptApiLock(item.id)"
                  >
                    <q-tooltip>{{
                      !hasApiOptionsForPrompt(item)
                        ? '没有可用接口，无法锁定'
                        : isPromptApiLocked(item.id)
                          ? '已锁定，点击解锁'
                          : '未锁定，点击锁定'
                    }}</q-tooltip>
                  </q-btn>
                </div>
              </div>
              <q-input
                :model-value="getPromptContentValue(item)"
                type="textarea"
                outlined
                color="primary"
                :rows="6"
                class="itimo-prompt-textarea"
                :readonly="isBuiltinTheme(activeThemeId) && !isEditableBuiltinTheme(activeThemeId)"
                @update:model-value="(v) => onContentUpdate(item.id, String(v))"
              />
              <div
                v-if="isBuiltinTheme(activeThemeId) && !isEditableBuiltinTheme(activeThemeId)"
                class="itimo-readonly-hint"
              >
                <q-icon name="lock" size="12px" />
                内置主题只读，如需修改请新建主题后添加
              </div>
              <div
                v-else-if="isBuiltinTheme(activeThemeId) && isEditableBuiltinTheme(activeThemeId)"
                class="itimo-readonly-hint"
              >
                <q-icon name="info" size="12px" />
                内置主题提示词可编辑，但主题本身只读
              </div>
            </div>
          </template>
          <div v-else class="itimo-empty-stage">
            <q-icon name="article" size="36px" color="grey-4" />
            <div class="itimo-empty-text">该阶段暂无提示词</div>
          </div>
        </div>
      </template>
    </div>

    <!-- ── 新建主题弹窗 ── -->
    <q-dialog v-model="showNewThemeInput" persistent>
      <q-card style="min-width: 360px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">新建提示词主题</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="closeNewThemeDialog" />
        </q-card-section>
        <q-card-section class="q-pt-md">
          <q-input
            v-model="newThemeLabel"
            label="主题名称 *"
            outlined
            dense
            color="primary"
            placeholder="例如：古风短剧提示词"
            autofocus
            @keyup.enter="saveNewTheme"
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn flat label="取消" @click="closeNewThemeDialog" />
          <q-btn
            unelevated
            label="创建"
            color="primary"
            :disable="!newThemeLabel.trim()"
            @click="saveNewTheme"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ── 删除主题确认弹窗 ── -->
    <q-dialog v-model="showDeleteThemeConfirm" persistent>
      <q-card style="min-width: 320px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">删除主题</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDeleteThemeConfirm = false" />
        </q-card-section>
        <q-card-section>
          确定要删除主题「<strong>{{ pendingDeleteThemeLabel }}</strong
          >」吗？该主题下的所有提示词将一并删除，此操作无法撤销。
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn flat label="取消" @click="showDeleteThemeConfirm = false" />
          <q-btn unelevated label="删除" color="negative" @click="doDeleteTheme" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSettingsStore } from 'src/stores/settings-store';
import { PROMPT_THEMES, PROMPT_STAGES, PROMPT_STAGE_LABELS } from 'src/services/prompt';
import type { PromptStage, PromptItem } from 'src/services/prompt/types';
import type { UserPromptTheme, UserPromptItem } from 'src/core/types/settings';

const settings = useSettingsStore();

// ── 内置主题 ──────────────────────────────────────────────────
const BUILTIN_IDS = new Set(PROMPT_THEMES.map((t) => t.id));
const EDITABLE_BUILTIN_IDS = new Set(['promp_google']); // 只有谷歌提示词可编辑

function isBuiltinTheme(id: string) {
  return BUILTIN_IDS.has(id);
}

function isEditableBuiltinTheme(id: string) {
  return EDITABLE_BUILTIN_IDS.has(id);
}

// ── 用户主题 ──────────────────────────────────────────────────
const userThemes = computed<UserPromptTheme[]>(() => settings.settings.prompt.userThemes ?? []);

// ── 当前选中主题 ──────────────────────────────────────────────
const activeThemeId = ref<string>(PROMPT_THEMES[0]?.id ?? '');

interface UnifiedTheme {
  id: string;
  label: string;
  description?: string;
  prompts: PromptItem[];
}

const activeTheme = computed<UnifiedTheme | undefined>(() => {
  const builtin = PROMPT_THEMES.find((t) => t.id === activeThemeId.value);
  if (builtin) {
    // 只对可编辑的内置主题应用用户的编辑覆盖
    if (isEditableBuiltinTheme(activeThemeId.value)) {
      const overridesZh =
        settings.settings.prompt.builtinThemeOverridesZh?.[activeThemeId.value] ?? {};
      const overridesEn =
        settings.settings.prompt.builtinThemeOverridesEn?.[activeThemeId.value] ?? {};
      const newPromptsZh =
        settings.settings.prompt.builtinThemeNewPromptsZh?.[activeThemeId.value] ?? [];
      const newPromptsEn =
        settings.settings.prompt.builtinThemeNewPromptsEn?.[activeThemeId.value] ?? [];

      // 处理原始提示词的内容覆盖
      const originalPrompts = builtin.prompts.map((p) => ({
        ...p,
        contentZh: overridesZh[p.id] ?? p.contentZh,
        contentEn: overridesEn[p.id] ?? p.contentEn,
      }));

      // 添加新增的提示词
      const convertedNewPrompts: PromptItem[] = [...newPromptsZh, ...newPromptsEn].map((p) => ({
        id: p.id,
        stage: p.stage as PromptStage,
        title: p.title,
        contentZh: p.contentZh,
        contentEn: p.contentEn,
        apiType: p.apiType ?? 'text',
      }));

      return {
        ...builtin,
        prompts: [...originalPrompts, ...convertedNewPrompts],
      };
    }
    return builtin;
  }
  const user = userThemes.value.find((t) => t.id === activeThemeId.value);
  if (user) {
    return {
      id: user.id,
      label: user.label,
      prompts: user.prompts.map((p) => ({
        id: p.id,
        stage: p.stage as PromptStage,
        title: p.title,
        contentZh: p.contentZh,
        contentEn: p.contentEn,
        apiType: p.apiType ?? 'text',
      })),
    };
  }
  return undefined;
});

// ── 阶段标签 ─────────────────────────────────────────────────────
const activeStage = ref<PromptStage>('story');

const activeStagePrompts = computed<PromptItem[]>(() =>
  (activeTheme.value?.prompts ?? []).filter((p) => p.stage === activeStage.value),
);

// ── 中英文切换状态管理 ────────────────────────────────────────
/**
 * 获取提示词的语言切换状态（false=中文, true=英文）
 */
function getPromptLang(promptId: string): boolean {
  return settings.settings.prompt.promptLangState?.[promptId] ?? false;
}

/**
 * 切换提示词的语言状态
 */
function togglePromptLang(promptId: string) {
  if (!settings.settings.prompt.promptLangState) {
    settings.settings.prompt.promptLangState = {};
  }
  settings.settings.prompt.promptLangState[promptId] = !getPromptLang(promptId);
  // 立即保存设置
  void settings.save();
}

/**
 * 获取提示词的当前内容值（根据语言状态返回对应内容）
 */
function getPromptContentValue(item: PromptItem): string {
  const isEn = getPromptLang(item.id);
  return isEn ? item.contentEn : item.contentZh;
}

// ── 新建主题 ──────────────────────────────────────────────────
const showNewThemeInput = ref(false);
const newThemeLabel = ref('');

function closeNewThemeDialog() {
  showNewThemeInput.value = false;
  newThemeLabel.value = '';
}

function saveNewTheme() {
  const label = newThemeLabel.value.trim();
  if (!label) return;
  const now = new Date().toISOString();

  // 从第一个内置主题获取提示词结构模板
  const templatePrompts: UserPromptItem[] = [];
  if (PROMPT_THEMES.length > 0) {
    const firstTheme = PROMPT_THEMES[0];
    if (firstTheme) {
      templatePrompts.push(
        ...firstTheme.prompts.map((p) => ({
          id: p.id,
          stage: p.stage,
          title: p.title,
          apiType: p.apiType,
          contentZh: p.contentZh,
          contentEn: p.contentEn,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }
  }

  const newTheme: UserPromptTheme = {
    id: `theme_${Date.now()}`,
    label,
    prompts: templatePrompts,
    createdAt: now,
  };
  if (!settings.settings.prompt.userThemes) settings.settings.prompt.userThemes = [];
  settings.settings.prompt.userThemes.push(newTheme);
  activeThemeId.value = newTheme.id;
  closeNewThemeDialog();
  // 立即保存设置
  void settings.save();
}

// ── 删除主题（带确认）────────────────────────────────────────
const showDeleteThemeConfirm = ref(false);
const pendingDeleteThemeId = ref('');
const pendingDeleteThemeLabel = ref('');

function confirmDeleteTheme(id: string, label: string) {
  pendingDeleteThemeId.value = id;
  pendingDeleteThemeLabel.value = label;
  showDeleteThemeConfirm.value = true;
}

function doDeleteTheme() {
  const themes = settings.settings.prompt.userThemes ?? [];
  const idx = themes.findIndex((t) => t.id === pendingDeleteThemeId.value);
  if (idx >= 0) themes.splice(idx, 1);
  if (activeThemeId.value === pendingDeleteThemeId.value) {
    activeThemeId.value = PROMPT_THEMES[0]?.id ?? '';
  }
  showDeleteThemeConfirm.value = false;
  // 立即保存设置
  void settings.save();
}

// ── 编辑提示词内容 ────────────────────────────────────────────
function onContentUpdate(itemId: string, value: string) {
  const isBuiltin = isBuiltinTheme(activeThemeId.value);
  const isEditable = isEditableBuiltinTheme(activeThemeId.value);
  const isEn = getPromptLang(itemId);

  if (isBuiltin && !isEditable) {
    return;
  }

  if (isBuiltin && isEditable) {
    const targetKey = isEn ? 'builtinThemeOverridesEn' : 'builtinThemeOverridesZh';
    const target = settings.settings.prompt as Record<string, unknown>;
    if (!target[targetKey]) {
      target[targetKey] = {};
    }
    const overrides = target[targetKey] as Record<string, Record<string, string>>;
    if (!overrides[activeThemeId.value]) {
      overrides[activeThemeId.value] = {};
    }
    overrides[activeThemeId.value]![itemId] = value;
  } else {
    const theme = userThemes.value.find((t) => t.id === activeThemeId.value);
    if (!theme) return;
    const item = theme.prompts.find((p) => p.id === itemId);
    if (item) {
      if (isEn) {
        item.contentEn = value;
      } else {
        item.contentZh = value;
      }
      item.updatedAt = new Date().toISOString();
    }
  }
  // 立即保存设置
  void settings.save();
}

// ── API 绑定管理 ────────────────────────────────────────────────
function getPromptApiBinding(promptId: string): string {
  return settings.settings.prompt.promptApiBindings?.[promptId] ?? '';
}

function setPromptApiBinding(promptId: string, apiConfigName: string) {
  if (!settings.settings.prompt.promptApiBindings) {
    settings.settings.prompt.promptApiBindings = {};
  }
  settings.settings.prompt.promptApiBindings[promptId] = apiConfigName;
  // 立即保存设置
  void settings.save();
}

function isPromptApiLocked(promptId: string): boolean {
  return settings.settings.prompt.promptApiLocked?.[promptId] ?? false;
}

function togglePromptApiLock(promptId: string) {
  if (!settings.settings.prompt.promptApiLocked) {
    settings.settings.prompt.promptApiLocked = {};
  }
  settings.settings.prompt.promptApiLocked[promptId] = !isPromptApiLocked(promptId);
}

function getApiOptionsForPrompt(item: PromptItem): Array<{ name: string; serviceType: string }> {
  const customConfigs = settings.settings.api.customConfigs ?? [];
  return customConfigs.filter((c) => c.serviceType === item.apiType);
}

function hasApiOptionsForPrompt(item: PromptItem): boolean {
  return getApiOptionsForPrompt(item).length > 0;
}
</script>

<style scoped>
/* 关键：外层必须有确定高度，两列才能各自独立滚动 */
.itimo-prompt-layout {
  display: flex;
  height: 430px;
  border: 1px solid var(--itimo-surface-border);
  border-radius: 10px;
  overflow: hidden;
}

/* ── 左侧 ── */
.itimo-prompt-sidebar {
  width: 180px;
  flex-shrink: 0;
  background: var(--itimo-bg-secondary);
  border-right: 1px solid var(--itimo-surface-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 主题列表：独立滚动 */
.itimo-sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.itimo-sidebar-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--itimo-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 12px 14px 10px;
  position: sticky;
  top: 0;
  background: var(--itimo-bg-secondary);
  z-index: 1;
}

.itimo-theme-item {
  padding: 10px 14px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.15s ease;
  &:hover {
    background: color-mix(in srgb, var(--itimo-brand) 6%, var(--itimo-bg-secondary));
  }
}

.itimo-theme-active {
  border-left-color: var(--itimo-brand);
  background: color-mix(in srgb, var(--itimo-brand) 10%, var(--itimo-bg-secondary));
}

.itimo-theme-label {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--itimo-text-primary);
  line-height: 1.3;
}

.itimo-theme-desc {
  font-size: 0.75rem;
  color: var(--itimo-text-secondary);
  margin-top: 2px;
  line-height: 1.3;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.itimo-sidebar-divider {
  height: 1px;
  background: var(--itimo-surface-border);
  margin: 8px 14px;
}

/* 新建主题按钮：固定在左侧底部，不随列表滚动 */
.itimo-sidebar-add-theme {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  font-size: 0.82rem;
  color: var(--itimo-text-secondary);
  cursor: pointer;
  border-top: 1px solid var(--itimo-surface-border);
  transition: all 0.15s ease;
  &:hover {
    color: var(--itimo-brand);
    background: color-mix(in srgb, var(--itimo-brand) 5%, var(--itimo-bg-secondary));
  }
}

/* ── 右侧 ── */
.itimo-prompt-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--itimo-bg-primary);
}

/* 标题栏：固定 */
.itimo-content-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px 12px;
  border-bottom: 1px solid var(--itimo-surface-border);
}

.itimo-content-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--itimo-text-primary);
}

.itimo-content-desc {
  font-size: 0.78rem;
  color: var(--itimo-text-secondary);
  margin-top: 2px;
}

/* 阶段标签：固定 */
.itimo-stage-tabs {
  flex-shrink: 0;
  display: flex;
  padding: 0 20px;
  border-bottom: 1px solid var(--itimo-surface-border);
  background: var(--itimo-bg-secondary);
}

.itimo-stage-tab {
  padding: 8px 14px;
  font-size: 0.82rem;
  color: var(--itimo-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s ease;
  white-space: nowrap;
  &:hover {
    color: var(--itimo-brand);
  }
}

.itimo-stage-tab-active {
  color: var(--itimo-brand);
  border-bottom-color: var(--itimo-brand);
  font-weight: 500;
}

/* 提示词列表：独立滚动 */
.itimo-prompts-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.itimo-prompt-card {
  flex-shrink: 0;
  border: 1px solid var(--itimo-surface-border);
  border-radius: 8px;
  overflow: hidden;
}

.itimo-prompt-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--itimo-bg-secondary);
  border-bottom: 1px solid var(--itimo-surface-border);
}

.itimo-prompt-card-title {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--itimo-text-primary);
}

/* 中英文切换开关 */
.itimo-lang-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 12px;
  background: var(--itimo-surface-border);
}

.itimo-lang-option {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--itimo-text-secondary);
  transition: color 0.2s ease;
  &.active {
    color: var(--itimo-text-primary);
  }
}

.itimo-lang-switch {
  width: 28px;
  height: 16px;
  border-radius: 8px;
  background: var(--itimo-brand);
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  &::after {
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
  &.en {
    background: var(--itimo-brand);
    &::after {
      transform: translateX(12px);
    }
  }
}

.itimo-stage-badge {
  font-size: 0.72rem;
}

.itimo-prompt-textarea {
  :deep(.q-field__control) {
    border-radius: 0;
  }
  :deep(.q-field__native) {
    font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
    font-size: 0.82rem;
    line-height: 1.6;
    color: var(--itimo-text-primary) !important;
  }
  :deep(.q-field--outlined .q-field__control) {
    border: none;
    border-radius: 0;
  }
  :deep(.q-field--outlined .q-field__control:before) {
    border: none;
  }
}

.itimo-readonly-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: 0.72rem;
  color: var(--itimo-text-secondary);
  background: var(--itimo-bg-secondary);
  border-top: 1px solid var(--itimo-surface-border);
  opacity: 0.8;
}

.itimo-empty-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 0;
  color: var(--itimo-text-secondary);
}

.itimo-empty-text {
  font-size: 0.88rem;
}
</style>
