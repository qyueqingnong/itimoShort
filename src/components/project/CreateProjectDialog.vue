<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card class="itimo-create-dialog">
      <!-- Header -->
      <div class="itimo-dialog-header">
        <div class="itimo-dialog-title">{{ isEdit ? '编辑项目' : '新建项目' }}</div>
        <q-btn
          flat
          round
          dense
          icon="close"
          class="itimo-dialog-close"
          @click="emit('update:modelValue', false)"
        />
      </div>

      <!-- Content -->
      <q-form ref="formRef" @submit.prevent="submit" class="itimo-dialog-form">
        <div class="itimo-dialog-content">
          <!-- 封面图片 -->
          <div class="itimo-form-section">
            <div class="itimo-form-label">封面图片</div>
            <!-- 封面预览 + 选择器 -->
            <div class="itimo-cover-picker">
              <!-- 当前选中预览 -->
              <div class="itimo-cover-preview" @click="triggerUpload">
                <img
                  v-if="coverPreviewSrc"
                  :src="coverPreviewSrc"
                  alt="封面预览"
                  class="itimo-cover-preview-img"
                />
                <div v-else class="itimo-cover-preview-placeholder">
                  <q-icon name="image" size="36px" />
                  <span>点击上传封面</span>
                </div>
                <!-- 上传图标遮罩 -->
                <div class="itimo-cover-upload-overlay">
                  <q-icon name="cloud_upload" size="28px" />
                </div>
              </div>
              <!-- 内置封面网格 -->
              <div class="itimo-cover-builtins">
                <div class="itimo-cover-builtins-label">内置封面</div>
                <div class="itimo-cover-grid">
                  <div
                    v-for="(cover, i) in BUILTIN_COVERS"
                    :key="cover.src"
                    class="itimo-cover-thumb"
                    :class="{ 'itimo-cover-thumb--active': form.coverImage === cover.src }"
                    @click="selectBuiltinCover(cover.src)"
                  >
                    <img :src="cover.src" :alt="`封面${i + 1}`" />
                    <div v-if="form.coverImage === cover.src" class="itimo-cover-thumb-check">
                      <q-icon name="check_circle" size="20px" color="white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 隐藏的文件上传 input -->
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleFileChange"
            />
          </div>

          <!-- 标题 -->
          <div class="itimo-form-section">
            <div class="itimo-form-label">标题</div>
            <q-input
              v-model="form.name"
              color="primary"
              outlined
              placeholder="请输入项目标题"
              autofocus
              class="itimo-form-input"
            />
          </div>

          <!-- 描述 -->
          <div class="itimo-form-section">
            <div class="itimo-form-label">描述</div>
            <q-input
              v-model="form.description"
              color="primary"
              outlined
              type="textarea"
              rows="2"
              placeholder="请输入项目描述"
              class="itimo-form-input"
            />
          </div>

          <!-- 画面比例 -->
          <div class="itimo-form-section">
            <div class="itimo-form-label">画面比例</div>
            <q-select
              v-model="form.canvasAspectRatio"
              :options="canvasOptions"
              emit-value
              map-options
              outlined
              dense
              color="primary"
              class="itimo-form-input"
            />
          </div>

          <!-- 核心材质（一级：视觉基调） -->
          <div class="itimo-form-section">
            <div class="itimo-form-label">核心材质</div>
            <div class="itimo-visual-bases">
              <div
                v-for="base in VISUAL_BASES"
                :key="base.id"
                class="itimo-visual-base-item"
                :class="{ 'itimo-visual-base-item--active': form.visualBase === base.id }"
                @click="onBaseChange(base.id)"
              >
                {{ base.label }}
              </div>
            </div>
          </div>

          <!-- 风格流派（二级：根据 base 联动） -->
          <div class="itimo-form-section">
            <div class="itimo-form-label">风格流派</div>
            <div class="itimo-visual-styles">
              <div
                v-for="style in filteredStyles"
                :key="style.id"
                class="itimo-visual-style-item"
                :class="{ 'itimo-visual-style-item--active': form.visualStyle === style.id }"
                @click="form.visualStyle = style.id"
              >
                {{ style.label }}
              </div>
            </div>
          </div>

          <!-- 氛围与题材（三级：滤镜） -->
          <div class="itimo-form-section">
            <div class="itimo-form-label">氛围与题材</div>
            <div class="itimo-visual-atmos">
              <div
                v-for="atm in VISUAL_ATMOSPHERES"
                :key="atm.id"
                class="itimo-visual-atm-item"
                :class="{ 'itimo-visual-atm-item--active': form.atmosphere === atm.id }"
                @click="form.atmosphere = atm.id"
              >
                {{ atm.label }}
              </div>
            </div>
          </div>

          <!-- 语言 -->
          <div class="itimo-form-section">
            <div class="itimo-form-label">人物语言</div>
            <q-option-group
              v-model="form.language"
              :options="languageOptions"
              color="primary"
              inline
            />
          </div>
        </div>

        <!-- Footer -->
        <div class="itimo-dialog-footer">
          <q-btn
            flat
            label="取消"
            class="itimo-btn-secondary"
            @click="emit('update:modelValue', false)"
          />
          <q-btn type="submit" :label="submitLabel" class="itimo-btn-primary" />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  CANVAS_ASPECT_RATIOS,
  VISUAL_BASES,
  VISUAL_STYLES,
  VISUAL_ATMOSPHERES,
  stylesForBase,
} from 'src/constants/drama-options';
import type { CreateProjectInput } from 'src/db/project';
import { useProjectsStore } from 'src/stores/projects-store';

/** 内置封面列表 */
const BUILTIN_COVERS = [
  { src: '/src/assets/cover/cover1.jpeg' },
  { src: '/src/assets/cover/cover2.jpeg' },
  { src: '/src/assets/cover/cover3.jpeg' },
  { src: '/src/assets/cover/cover4.jpeg' },
  { src: '/src/assets/cover/cover5.jpeg' },
  { src: '/src/assets/cover/cover6.jpeg' },
  { src: '/src/assets/cover/cover7.jpeg' },
  { src: '/src/assets/cover/cover8.jpeg' },
];

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    editProjectId?: string | null;
  }>(),
  { editProjectId: null },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  created: [payload: CreateProjectInput];
  updated: [payload: CreateProjectInput];
}>();

const $q = useQuasar();
const projects = useProjectsStore();
const formRef = ref<{ validate: () => Promise<boolean>; resetValidation: () => void } | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const isEdit = computed(() => props.editProjectId != null);
const submitLabel = computed(() => (isEdit.value ? '保存' : '创建'));

const canvasOptions = CANVAS_ASPECT_RATIOS.map((x) => ({
  label: `${x.label} - ${x.desc}`,
  value: x.id,
}));

const languageOptions = [
  { label: '中文', value: 'zh' },
  { label: 'English', value: 'en' },
];

interface ProjectFormState {
  name: string;
  description: string;
  canvasAspectRatio: string;
  /** 第一级：视觉材质基调 */
  visualBase: string;
  /** 第二级：风格流派 */
  visualStyle: string;
  /** 第三级：氛围与题材 */
  atmosphere: string;
  language: 'en' | 'zh';
  /** 封面图片路径 */
  coverImage: string;
  /** 上传后的文件相对路径（保存到项目目录中） */
  coverRelativePath: string;
  /** 当前预览用的 src */
  _coverPreview: string;
}

const form = reactive<ProjectFormState>({
  name: '',
  description: '',
  canvasAspectRatio: '9:16',
  visualBase: '2d_anime',
  visualStyle: 'anime_style',
  atmosphere: 'healing',
  language: 'zh',
  coverImage: '',
  coverRelativePath: '',
  _coverPreview: '',
});

/** 根据当前选中的 base 过滤二级风格 */
const filteredStyles = computed(() => stylesForBase(form.visualBase));

/** 切换一级材质时，自动选择该材质下第一个风格 */
function onBaseChange(baseId: string) {
  form.visualBase = baseId;
  const first = filteredStyles.value[0];
  if (first) form.visualStyle = first.id;
}

/** 当前用于 <img> 渲染的 src */
const coverPreviewSrc = computed(() => form._coverPreview);

function selectBuiltinCover(src: string) {
  form.coverImage = src;
  form.coverRelativePath = '';
  form._coverPreview = src;
}

function triggerUpload() {
  fileInputRef.value?.click();
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    form._coverPreview = e.target?.result as string;
  };
  reader.readAsDataURL(file);

  form.coverImage = file.name;
  form.coverRelativePath = '';

  input.value = '';
}

function resetFormForCreate() {
  form.name = '';
  form.description = '';
  form.canvasAspectRatio = '9:16';
  form.visualBase = '2d_anime';
  form.visualStyle = 'anime_style';
  form.atmosphere = 'healing';
  form.language = 'zh';
  form.coverImage = '';
  form.coverRelativePath = '';
  form._coverPreview = '';
}

function loadFromManifest(projectId: string) {
  const m = projects.manifestsById[projectId];
  if (!m) {
    $q.notify({ type: 'warning', message: '未加载到项目信息，请稍后重试。' });
    return;
  }
  form.name = m.name;
  form.description = m.description;
  form.canvasAspectRatio = m.canvasAspectRatio;
  form.visualBase = m.materialType || '2d_anime';
  form.visualStyle = m.artStyle || 'anime_style';
  form.atmosphere = m.moodAtmosphere || 'healing';
  form.language = m.language || 'zh';
  const ci = m.coverImage || '';
  form.coverImage = ci;
  form.coverRelativePath = '';
  form._coverPreview = ci;
}

watch(
  () => [props.modelValue, props.editProjectId] as const,
  ([open, editId]) => {
    if (!open) return;
    if (editId) {
      loadFromManifest(editId);
    } else {
      resetFormForCreate();
    }
    void formRef.value?.resetValidation();
  },
);

async function submit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;

  const payload: CreateProjectInput = {
    name: form.name.trim() || '未命名项目',
    description: form.description.trim(),
    canvasAspectRatio: form.canvasAspectRatio,
    visualStyle: form.visualStyle,
    materialType: form.visualBase,
    artStyle: form.visualStyle,
    moodAtmosphere: form.atmosphere,
    language: form.language,
    novelGenres: [],
    filmAspectRatio: '16:9',
    coverImage: form.coverImage,
  };

  if (props.editProjectId != null) {
    emit('updated', payload);
  } else {
    emit('created', payload);
  }
}
</script>

<style scoped>
.itimo-create-dialog {
  width: min(800px, 90vw);
  max-height: 90vh;
  background: var(--itimo-bg-primary);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: rgba(0, 0, 0, 0.22) 3px 5px 30px 0px;
}

.itimo-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
  border-bottom: 1px solid var(--itimo-surface-border);
}

.itimo-dialog-title {
  font-family: var(--itimo-font-display);
  font-size: 1.31rem;
  font-weight: 700;
  color: var(--itimo-text-primary);
  letter-spacing: 0.231px;
}

.itimo-dialog-close {
  color: var(--itimo-text-secondary);
  transition: color 0.2s ease;

  &:hover {
    color: var(--itimo-text-primary);
  }
}

.itimo-dialog-form {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.itimo-dialog-content {
  flex: 1;
  min-height: 0;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  overflow-y: auto;
}

.itimo-form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.itimo-form-label {
  font-family: var(--itimo-font-body);
  font-size: 0.94rem;
  font-weight: 600;
  color: var(--itimo-text-primary);
  letter-spacing: -0.374px;
}

.itimo-form-input {
  :deep(.q-field__control) {
    font-size: inherit;
  }

  :deep(.q-field__native),
  :deep(.q-field__input) {
    background-color: var(--itimo-bg-secondary);
    color: var(--itimo-text-primary);
  }

  :deep(.q-field--filled .q-field__control) {
    background-color: var(--itimo-bg-secondary);
    border-radius: 8px;
  }

  :deep(.q-field--filled .q-field__control::before) {
    border-bottom: 1px solid var(--itimo-surface-border);
  }

  :deep(.q-field--filled .q-field__control::after) {
    border-bottom: 2px solid var(--itimo-brand);
  }
}

.itimo-option-group-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.itimo-mood-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.itimo-mood-card-image {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  aspect-ratio: 16 / 9;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &--active {
    border-color: var(--itimo-brand);
    box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3);
  }
}

.itimo-mood-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;

  .itimo-mood-card-image:hover & {
    transform: scale(1.02);
  }
}

.itimo-mood-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: background 0.3s ease;

  .itimo-mood-card-image:hover & {
    background: rgba(0, 0, 0, 0.65);
  }
}

.itimo-mood-check {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--itimo-brand);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: checkIn 0.3s ease;
}

@keyframes checkIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.itimo-mood-overlay-title {
  font-family: var(--itimo-font-body);
  font-size: 0.94rem;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: -0.374px;
}

.itimo-mood-overlay-desc {
  font-family: var(--itimo-font-body);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  white-space: pre-line;
  line-height: 1.4;
}

.itimo-mood-card {
  padding: 16px;
  border: 1px solid var(--itimo-surface-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--itimo-bg-secondary);
  text-align: center;
  user-select: none;

  &:hover {
    border-color: var(--itimo-brand);
    background: color-mix(in srgb, var(--itimo-brand) 8%, var(--itimo-bg-secondary));
  }

  &--active {
    border: 2px solid var(--itimo-brand);
    background: color-mix(in srgb, var(--itimo-brand) 12%, var(--itimo-bg-secondary));
    box-shadow:
      0 0 0 1px var(--itimo-bg-primary),
      0 0 0 3px var(--itimo-brand);
  }
}

.itimo-mood-card-title {
  font-family: var(--itimo-font-body);
  font-size: 0.94rem;
  font-weight: 600;
  color: var(--itimo-text-primary);
  margin-bottom: 4px;
}

.itimo-mood-card-desc {
  font-family: var(--itimo-font-body);
  font-size: 0.75rem;
  color: var(--itimo-text-secondary);
  white-space: pre-line;
  line-height: 1.4;
}

.itimo-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 28px;
  border-top: 1px solid var(--itimo-surface-border);
}

.itimo-btn-primary {
  background: var(--itimo-brand);
  color: #ffffff;
  padding: 8px 24px;
  border-radius: 8px;
  font-family: var(--itimo-font-body);
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: -0.374px;
  transition: all 0.2s ease;

  &:hover {
    background: color-mix(in srgb, var(--itimo-brand) 90%, #000000);
  }

  &:active {
    background: color-mix(in srgb, var(--itimo-brand) 80%, #000000);
  }
}

.itimo-btn-secondary {
  color: var(--itimo-text-secondary);
  padding: 8px 24px;
  border-radius: 8px;
  font-family: var(--itimo-font-body);
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: -0.374px;
  transition: color 0.2s ease;

  &:hover {
    color: var(--itimo-text-primary);
  }
}

@media (max-width: 600px) {
  .itimo-mood-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .itimo-dialog-header,
  .itimo-dialog-content,
  .itimo-dialog-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}

/* ── 封面选择器 ─────────────────────────────────────────── */
.itimo-cover-picker {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

/* 预览区 */
.itimo-cover-preview {
  position: relative;
  flex-shrink: 0;
  width: 120px;
  aspect-ratio: 4 / 3;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid var(--itimo-surface-border);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  background: var(--itimo-bg-secondary);
}
.itimo-cover-preview:hover {
  border-color: var(--itimo-brand);
  box-shadow: 0 4px 16px rgba(0, 113, 227, 0.2);
}
.itimo-cover-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.itimo-cover-preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--itimo-text-tertiary);
  font-family: var(--itimo-font-body);
  font-size: 0.72rem;
  text-align: center;
  padding: 8px;
}
.itimo-cover-upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.itimo-cover-preview:hover .itimo-cover-upload-overlay {
  opacity: 1;
}

/* 内置封面区 */
.itimo-cover-builtins {
  flex: 1;
  min-width: 0;
}
.itimo-cover-builtins-label {
  font-family: var(--itimo-font-body);
  font-size: 0.78rem;
  color: var(--itimo-text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
}
.itimo-cover-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}
.itimo-cover-thumb {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.itimo-cover-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.itimo-cover-thumb:hover {
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.itimo-cover-thumb--active {
  border-color: var(--itimo-brand) !important;
  box-shadow:
    0 0 0 2px var(--itimo-brand),
    0 4px 12px rgba(0, 113, 227, 0.3) !important;
}
.itimo-cover-thumb-check {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--itimo-brand);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 700px) {
  .itimo-cover-picker {
    flex-direction: column;
  }
  .itimo-cover-preview {
    width: 100%;
    max-width: 200px;
    margin: 0 auto;
  }
  .itimo-cover-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* ── 视觉三级选择器 ─────────────────────────────────────── */

/* 一级：核心材质 */
.itimo-visual-bases {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.itimo-visual-base-item {
  padding: 6px 14px;
  border-radius: 8px;
  font-family: var(--itimo-font-body);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--itimo-surface-border);
  background: var(--itimo-bg-secondary);
  color: var(--itimo-text-secondary);
  transition: all 0.15s ease;
  user-select: none;
}
.itimo-visual-base-item:hover {
  border-color: var(--itimo-brand);
  color: var(--itimo-brand);
  background: color-mix(in srgb, var(--itimo-brand) 8%, var(--itimo-bg-secondary));
}
.itimo-visual-base-item--active {
  background: var(--itimo-brand);
  border-color: var(--itimo-brand);
  color: #ffffff;
  font-weight: 600;
}

/* 二级：风格流派 */
.itimo-visual-styles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.itimo-visual-style-item {
  padding: 5px 12px;
  border-radius: 6px;
  font-family: var(--itimo-font-body);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--itimo-surface-border);
  background: var(--itimo-bg-secondary);
  color: var(--itimo-text-secondary);
  transition: all 0.15s ease;
  user-select: none;
}
.itimo-visual-style-item:hover {
  border-color: var(--itimo-brand);
  color: var(--itimo-brand);
  background: color-mix(in srgb, var(--itimo-brand) 8%, var(--itimo-bg-secondary));
}
.itimo-visual-style-item--active {
  background: color-mix(in srgb, var(--itimo-brand) 14%, var(--itimo-bg-secondary));
  border-color: var(--itimo-brand);
  color: var(--itimo-brand);
  font-weight: 600;
}

/* 三级：氛围与题材 */
.itimo-visual-atmos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.itimo-visual-atm-item {
  padding: 5px 12px;
  border-radius: 6px;
  font-family: var(--itimo-font-body);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--itimo-surface-border);
  background: var(--itimo-bg-secondary);
  color: var(--itimo-text-secondary);
  transition: all 0.15s ease;
  user-select: none;
}
.itimo-visual-atm-item:hover {
  border-color: #ff9500;
  color: #ff9500;
  background: color-mix(in srgb, #ff9500 8%, var(--itimo-bg-secondary));
}
.itimo-visual-atm-item--active {
  background: color-mix(in srgb, #ff9500 14%, var(--itimo-bg-secondary));
  border-color: #ff9500;
  color: #ff9500;
  font-weight: 600;
}
</style>
