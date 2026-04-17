<template>
  <div>
    <q-page padding :class="pageTone">
      <div class="column q-gutter-y-md" style="max-width: 1180px; margin: 0 auto">
        <section class="column q-gutter-y-md">
          <div class="itimo-hero-chip self-start">AI短剧助手</div>
          <div class="itimo-display-hero">
            <span class="itimo-brand-text">本地AI短剧</span>
            <span :class="heroLine2Tone" class="q-ml-sm">itimoAiDrama</span>
          </div>
          <p class="itimo-body-text text-grey-5" style="max-width: 52rem">
            一个本地的短剧资产管理与自动化生成工具
          </p>
          <div class="row q-gutter-sm q-mt-sm q-mb-sm">
            <q-btn
              unelevated
              no-caps
              class="itimo-link-pill itimo-link-pill--filled"
              icon="add"
              text-color="white"
              label="新建项目"
              @click="openCreate"
            />
            <q-btn
              flat
              no-caps
              class="itimo-link-pill itimo-link-pill--outline"
              icon="refresh"
              label="刷新"
              :loading="projects.loading"
              @click="refresh(true)"
            />
          </div>
        </section>

        <div class="itimo-section-divider"></div>

        <div class="itimo-projects-section">
          <div v-if="projects.items.length === 0" class="text-grey-5 q-py-xl text-center">
            暂无项目，点击「新建项目」开始创建
          </div>

          <div v-else>
            <div class="row q-col-gutter-lg">
              <div v-for="p in projects.items" :key="p.id" class="col-12 col-sm-6 col-md-4 col-lg-3">

                <!-- 卡片主体 -->
                <div class="project-card" :class="{ 'project-card--dark': isDark }">
                  <!-- 封面图片区域 -->
                  <div class="project-card__cover" @click="router.push(`/project/${p.id}`)">
                    <img
                      v-if="getCoverSrc(p.id)"
                      :src="getCoverSrc(p.id)!"
                      alt="项目封面"
                      class="project-card__cover-img"
                    />
                    <div v-else class="project-card__cover-bg">
                      <q-icon name="movie" size="52px" class="project-card__cover-icon" />
                    </div>

                    <!-- 左上角：画面比例 -->
                    <div class="project-card__ratio-badge">
                      <q-icon name="aspect_ratio" size="11px" />
                      {{ labelCanvas(manifestFor(p.id)?.canvasAspectRatio) }}
                    </div>

                    <!-- 右上角：操作按钮 -->
                    <div class="project-card__actions">
                      <q-btn
                        flat
                        round
                        dense
                        icon="edit"
                        color="white"
                        size="10px"
                        class="project-card__action-btn"
                        aria-label="编辑项目"
                        @click.stop="openEdit(p.id)"
                      />
                      <q-btn
                        flat
                        round
                        dense
                        icon="delete"
                        color="white"
                        size="10px"
                        class="project-card__action-btn"
                        aria-label="删除项目"
                        @click.stop="confirmDelete(p.id)"
                      />
                    </div>

                    <!-- 底部标题遮罩 -->
                    <div class="project-card__title-bar">
                      <div class="project-card__title-text">
                        {{ manifestFor(p.id)?.name ?? p.name }}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateProjectDialog
        v-model="dialogOpen"
        :edit-project-id="editProjectId"
        @created="onCreated"
        @updated="onUpdated"
      />
    </q-page>

    <!-- Footer -->
    <div class="itimo-footer">
      <div class="itimo-footer-content">
        <div class="itimo-footer-main">
          <div class="itimo-footer-brand">
            <div class="itimo-footer-logo">
              <q-icon name="movie" size="32px" color="primary" />
            </div>
            <div>
              <div class="itimo-footer-title">
                itimoAiDrama
                <span class="itimo-footer-version">v1.1.3</span>
              </div>
              <p class="itimo-footer-subtitle">本地AI短剧创作助手</p>
            </div>
          </div>
          <div class="itimo-footer-description">
            <p class="itimo-footer-text">
              使用AI技术，帮助创作者快速生成。从故事梗概到完整剧本视频，自动生成···
            </p>
          </div>
        </div>
        <div class="itimo-footer-divider"></div>
        <div class="itimo-footer-bottom">
          <div class="itimo-footer-bottom-left">
            <p class="itimo-footer-copyright">© 2026 itimoAiDrama. All rights reserved.</p>
          </div>
          <div class="itimo-footer-bottom-right">
            <span class="itimo-footer-link-text">
              更多信息：
              <a
                href="#"
                @click.prevent="openExternalLink('https://itimo.cc')"
                class="itimo-footer-link"
              >
                itimo.cc
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import CreateProjectDialog from 'src/components/project/CreateProjectDialog.vue';
import {
  labelCanvasRatio,
} from 'src/constants/drama-options';
import type { CreateProjectInput } from 'src/db/project';
import { useProjectsStore } from 'src/stores/projects-store';

const $q = useQuasar();
const router = useRouter();
const projects = useProjectsStore();

const pageTone = computed(() => ($q.dark.isActive ? 'text-white' : 'text-grey-9'));
const heroLine2Tone = computed(() => ($q.dark.isActive ? 'text-white' : 'text-grey-9'));
const isDark = computed(() => $q.dark.isActive);

const dialogOpen = ref(false);
const editProjectId = ref<string | null>(null);

onMounted(() => void refresh());

function manifestFor(id: string) {
  return projects.manifestsById[id];
}

function getCoverSrc(id: string): string | null {
  const m = manifestFor(id);
  return m?.coverImage ?? null;
}

function labelCanvas(id: string | undefined) {
  return id ? labelCanvasRatio(id) : '—';
}

async function refresh(showNotification = false) {
  try {
    await projects.refresh();
    if (showNotification) {
      $q.notify({
        type: 'positive',
        message: '刷新成功',
        timeout: 1000,
        position: 'top',
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    if (showNotification) {
      $q.notify({
        type: 'negative',
        message: '刷新失败',
        timeout: 2000,
        position: 'top',
      });
    }
  }
}

function openCreate() {
  editProjectId.value = null;
  dialogOpen.value = true;
}

function openEdit(id: string) {
  editProjectId.value = id;
  dialogOpen.value = true;
}

async function onCreated(payload: CreateProjectInput) {
  try {
    await projects.createProject(payload);
    dialogOpen.value = false;
    $q.notify({
      type: 'positive',
      message: '项目已创建',
      timeout: 1500,
      position: 'top',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', message: msg });
  }
}

async function onUpdated(payload: CreateProjectInput) {
  const id = editProjectId.value;
  if (!id) return;
  try {
    await projects.updateProject(id, payload);
    dialogOpen.value = false;
    $q.notify({
      type: 'positive',
      message: '项目已更新',
      timeout: 1500,
      position: 'top',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', message: msg });
  }
}

function confirmDelete(id: string) {
  $q.dialog({
    title: '确认删除',
    message: '确定要删除这个项目吗？此操作无法撤销。',
    cancel: true,
    persistent: true,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
  }).onOk(async () => {
    try {
      await projects.deleteProject(id);
      $q.notify({
        type: 'positive',
        message: '项目已删除',
        timeout: 1500,
        position: 'top',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      $q.notify({
        type: 'negative',
        message: msg,
        timeout: 2000,
        position: 'top',
      });
    }
  });
}

async function openExternalLink(url: string) {
  try {
    if (window.electronAPI) {
      await window.electronAPI.shellOpenExternal(url);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: `打开链接失败: ${msg}`,
      timeout: 2000,
    });
  }
}
</script>

<style scoped>
.itimo-section-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    var(--itimo-surface-border) 20%,
    var(--itimo-surface-border) 80%,
    transparent
  );
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.itimo-projects-section {
  margin-top: 32px;
}

.itimo-section-header {
  margin-bottom: 24px;
}

/* ── 项目卡片 ─────────────────────────────────────────── */
.project-card {
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
  background: var(--itimo-bg-secondary);
  border: 1px solid var(--itimo-surface-border);
  box-shadow: var(--itimo-shadow-card);
}
.project-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: var(--itimo-shadow-elevated);
}

/* 封面图区域 */
.project-card__cover {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  cursor: pointer;
}
.project-card__cover-bg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    #1a1a2e 0%,
    #16213e 50%,
    #0f3460 100%
  );
}
/* 封面图片 */
.project-card__cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.22s ease;
}
.project-card:hover .project-card__cover-img {
  transform: scale(1.05);
}
/* 暗色主题下封面 */
.project-card--dark .project-card__cover-bg {
  background: linear-gradient(
    135deg,
    #1e1e2f 0%,
    #2d2d44 50%,
    #1a1a2e 100%
  );
}
.project-card__cover-icon {
  color: rgba(255, 255, 255, 0.15);
}
.project-card:hover .project-card__cover-icon {
  color: rgba(255, 255, 255, 0.25);
}

/* 左上角画面比例 */
.project-card__ratio-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 7px;
  border-radius: 5px;
  font-family: var(--itimo-font-body);
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

/* 右上角操作按钮 */
.project-card__actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 3px;
  opacity: 0;
  transform: translateY(-3px);
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.project-card:hover .project-card__actions {
  opacity: 1;
  transform: translateY(0);
}
.project-card__action-btn {
  width: 26px !important;
  height: 26px !important;
  background: rgba(0, 0, 0, 0.45) !important;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
}
.project-card__action-btn:hover {
  background: rgba(0, 0, 0, 0.65) !important;
}

/* 底部标题栏 */
.project-card__title-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.project-card__title-text {
  font-family: var(--itimo-font-display);
  font-size: 0.95rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

/* Footer Styles */
.itimo-footer {
  margin-top: 80px;
  padding: 0 10px;
  border-top: 1px solid var(--itimo-surface-border);
  background: linear-gradient(
    135deg,
    var(--itimo-bg-secondary) 0%,
    color-mix(in srgb, var(--itimo-brand) 3%, var(--itimo-bg-secondary)) 100%
  );
  position: relative;
  overflow: hidden;
}

.itimo-footer::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 400px;
  height: 400px;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--itimo-brand) 8%, transparent) 0%,
    transparent 70%
  );
  pointer-events: none;
}

.itimo-footer-content {
  max-width: 1180px;
  padding: 60px 16px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.itimo-footer-main {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 32px;
  margin-bottom: 24px;
  align-items: center;
}

@media (max-width: 768px) {
  .itimo-footer-main {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}

.itimo-footer-brand {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.itimo-footer-logo {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--itimo-brand) 12%, var(--itimo-bg-primary));
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--itimo-brand) 20%, transparent);
}

.itimo-footer-title {
  font-family: var(--itimo-font-display);
  font-size: 1.38rem;
  font-weight: 700;
  color: var(--itimo-text-primary);
  letter-spacing: 0.231px;
  margin: 0 0 4px 0;
}

.itimo-footer-subtitle {
  font-family: var(--itimo-font-body);
  font-size: 0.88rem;
  color: var(--itimo-brand);
  letter-spacing: -0.374px;
  margin: 0;
  font-weight: 500;
}

.itimo-footer-link-text {
  font-family: var(--itimo-font-body);
  font-size: 0.81rem;
  color: var(--itimo-text-secondary);
  letter-spacing: -0.374px;
  margin: 4px 0 0 0;
}

.itimo-footer-link {
  color: var(--itimo-brand);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.itimo-footer-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.itimo-footer-description {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.itimo-footer-text {
  font-family: var(--itimo-font-body);
  font-size: 0.94rem;
  color: var(--itimo-text-secondary);
  letter-spacing: -0.374px;
  line-height: 1.67;
  margin: 0;
}

.itimo-footer-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    var(--itimo-surface-border) 20%,
    var(--itimo-surface-border) 80%,
    transparent
  );
  margin: 20px 0;
}

.itimo-footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

@media (max-width: 640px) {
  .itimo-footer-bottom {
    flex-direction: column;
    text-align: center;
  }
}

.itimo-footer-bottom-left {
  flex: 1;
}

.itimo-footer-bottom-right {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .itimo-footer-bottom-right {
    justify-content: center;
  }
}

.itimo-footer-copyright {
  font-family: var(--itimo-font-body);
  font-size: 0.81rem;
  color: var(--itimo-text-secondary);
  letter-spacing: -0.374px;
  margin: 0;
  opacity: 0.7;
}

.itimo-footer-version {
  font-family: var(--itimo-font-body);
  font-size: 0.81rem;
  color: var(--itimo-brand);
  letter-spacing: -0.374px;
  margin: 0;
  font-weight: 500;
  opacity: 0.8;
}
</style>
