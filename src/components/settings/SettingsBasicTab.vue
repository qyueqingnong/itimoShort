<template>
  <div class="column q-gutter-y-md" style="min-height: 400px">
    <div class="text-subtitle2 itimo-text-secondary">界面主题与字号</div>
    <div>
      <div style="width: 300px">
        <q-select
          v-model="settings.settings.theme"
          :options="themeOptions"
          emit-value
          map-options
          label="主题模式"
          outlined
          dense
          color="primary"
        >
          <template #prepend>
            <q-icon :name="themeIcon" />
          </template>
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <q-icon :name="getThemeIcon(scope.opt.value)" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
                <q-item-label caption>{{ scope.opt.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <div class="text-caption itimo-text-secondary q-mt-sm">
        <q-icon name="info" class="q-mr-xs" />
        "跟随系统"模式会根据操作系统的明暗模式自动切换。
      </div>
    </div>

    <div>
      <div style="width: 300px">
        <q-select
          v-model="settings.settings.fontSizePreset"
          :options="fontOptions"
          emit-value
          map-options
          label="界面字号"
          outlined
          dense
          color="primary"
        >
          <template #prepend>
            <q-icon name="text_fields" />
          </template>
        </q-select>
      </div>
    </div>

    <q-separator />

    <div class="text-subtitle2 itimo-text-secondary">数据目录</div>
    <div class="row items-center">
      <q-input
        class="col itimo-default-path-input"
        :model-value="projectsRootDisplay"
        label="数据存储目录"
        outlined
        dense
        color="primary"
        readonly
      />
      <q-btn
        outline
        dense
        icon="folder_open"
        label="更改"
        @click="pickProjectsRoot"
        style="margin-left: 20px"
      />
    </div>
    <div class="text-caption itimo-text-secondary q-mb-md">
      项目和资源库的存储位置。更改目录后，点击"确定"时会自动移动 itimoAiDrama 文件夹到新位置。
    </div>

    <q-separator />

    <div class="text-subtitle2 itimo-text-secondary">数据库备份</div>

    <!-- 数据库状态 -->
    <div v-if="dbStats" class="row q-gutter-x-md q-mb-sm">
      <div class="itimo-db-stat">
        <q-icon name="folder_special" size="18px" class="itimo-db-stat-icon" />
        <span class="itimo-db-stat-label">项目</span>
        <span class="itimo-db-stat-value">{{ dbStats.projectCount }}</span>
      </div>
      <div class="itimo-db-stat">
        <q-icon name="video_library" size="18px" class="itimo-db-stat-icon" />
        <span class="itimo-db-stat-label">剧集</span>
        <span class="itimo-db-stat-value">{{ dbStats.episodeCount }}</span>
      </div>
      <div class="itimo-db-stat">
        <q-icon name="view_quilt" size="18px" class="itimo-db-stat-icon" />
        <span class="itimo-db-stat-label">分镜</span>
        <span class="itimo-db-stat-value">{{ dbStats.storyboardCount }}</span>
      </div>
      <div class="itimo-db-stat">
        <q-icon name="image" size="18px" class="itimo-db-stat-icon" />
        <span class="itimo-db-stat-label">AI 资产</span>
        <span class="itimo-db-stat-value">{{ dbStats.aiAssetCount }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="row q-gutter-sm">
      <q-btn
        unelevated
        dense
        no-caps
        icon="backup"
        label="一键备份"
        color="primary"
        :loading="exporting"
        @click="handleExport"
      />
      <q-btn
        outline
        dense
        no-caps
        icon="restore"
        label="导入备份"
        color="primary"
        :loading="importing"
        @click="openImportDialog"
      />
      <q-btn
        flat
        dense
        no-caps
        icon="refresh"
        label="刷新"
        color="grey-6"
        @click="loadDbStats"
      />
    </div>
    <div class="text-caption itimo-text-secondary q-mb-md">
      <q-icon name="info" class="q-mr-xs" />
      备份保存在「{{ dataRootDisplay }}/backups/」目录下。复制整个数据目录到新电脑，指定相同路径后导入即可恢复。
    </div>

    <!-- 导入选择对话框 -->
    <q-dialog v-model="showImportDialog" persistent>
      <q-card class="itimo-glass-card" style="width: min(580px, 92vw)">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="restore" color="primary" size="md" />
          <span class="text-h6">选择备份文件</span>
          <q-space />
          <q-btn flat round icon="close" @click="showImportDialog = false" />
        </q-card-section>
        <q-separator />
        <q-card-section style="max-height: 60vh; overflow-y: auto">
          <div v-if="loadingBackups" class="flex flex-center q-pa-xl">
            <q-spinner color="primary" size="2em" />
          </div>
          <div v-else-if="backupFiles.length === 0" class="text-grey-5 q-pa-md text-center">
            暂无备份文件。<br />请先点击「一键备份」创建备份。
          </div>
          <q-list v-else separator>
            <q-item
              v-for="file in backupFiles"
              :key="file.fullPath"
              clickable
              v-close-popup
              @click="handleImport(file.fullPath)"
              class="itimo-backup-item"
            >
              <q-item-section avatar>
                <q-icon name="description" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ file.name }}</q-item-label>
                <q-item-label caption>{{ formatDate(file.mtimeMs) }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-5" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="取消" color="grey-6" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useSettingsStore } from 'src/stores/settings-store';
import { getProjectsDataRoot } from 'src/services/app-paths';
import { getElectronApi } from 'src/services/native-fs';
import {
  exportDatabaseToDefaultPath,
  importDatabase,
  getBackupFiles,
  getDatabaseStats,
} from 'src/db/export-import';

const $q = useQuasar();
const settings = useSettingsStore();

const emit = defineEmits<{
  apply: [];
}>();

const themeOptions = [
  {
    label: '浅色模式',
    value: 'light',
    description: '始终使用浅色主题',
  },
  {
    label: '深色模式',
    value: 'dark',
    description: '始终使用深色主题',
  },
  {
    label: '跟随系统',
    value: 'auto',
    description: '根据系统设置自动切换',
  },
];

const themeIcon = computed(() => {
  const mode = settings.settings.theme;
  return getThemeIcon(mode);
});

function getThemeIcon(mode: string) {
  if (mode === 'dark') return 'dark_mode';
  if (mode === 'light') return 'light_mode';
  return 'brightness_auto';
}

const fontOptions = [
  { label: '小号', value: 'sm' },
  { label: '中号', value: 'md' },
  { label: '大号', value: 'lg' },
];

const resolvedDefaultPath = ref('');

const dbStats = ref<{
  projectCount: number;
  episodeCount: number;
  storyboardCount: number;
  aiAssetCount: number;
} | null>(null);

const exporting = ref(false);
const importing = ref(false);

// 导入对话框
const showImportDialog = ref(false);
const backupFiles = ref<Array<{ name: string; fullPath: string; mtimeMs: number }>>([]);
const loadingBackups = ref(false);

onMounted(async () => {
  const api = getElectronApi();
  if (api) {
    try {
      const dataRoot = await getProjectsDataRoot(settings.settings.projectsRootPath);
      resolvedDefaultPath.value = dataRoot;
    } catch {
      resolvedDefaultPath.value = '';
    }
  } else {
    resolvedDefaultPath.value = '（浏览器预览）D:\\itimoAiDrama';
  }
  await loadDbStats();
});

async function loadDbStats() {
  try {
    dbStats.value = await getDatabaseStats();
  } catch (e) {
    console.error('[SettingsBasicTab] Failed to load db stats:', e);
  }
}

const projectsRootDisplay = computed(() => {
  if (settings.settings.projectsRootPath) {
    return settings.settings.projectsRootPath;
  }
  return resolvedDefaultPath.value || '…';
});

const dataRootDisplay = computed(() => {
  if (settings.settings.projectsRootPath) {
    return `${settings.settings.projectsRootPath}\\itimoAiDrama`;
  }
  return resolvedDefaultPath.value || '…';
});

async function pickProjectsRoot() {
  const api = getElectronApi();
  if (!api) {
    $q.notify({ type: 'warning', message: '仅在 Electron 桌面端可选择目录。' });
    return;
  }

  let start: string | undefined;
  try {
    start = settings.settings.projectsRootPath ?? undefined;
  } catch {
    start = undefined;
  }

  const dir = start
    ? await api.dialogOpenDirectory({ defaultPath: start })
    : await api.dialogOpenDirectory();
  if (!dir) return;

  console.log('[SettingsBasicTab] Selected directory:', dir);
  settings.settings.projectsRootPath = dir;
  emit('apply');
}

async function handleExport() {
  exporting.value = true;
  try {
    const filePath = await exportDatabaseToDefaultPath();
    await loadDbStats();
    $q.notify({
      type: 'positive',
      message: '备份成功',
      caption: filePath,
      timeout: 4000,
      position: 'top',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', message: `备份失败: ${msg}`, timeout: 3000, position: 'top' });
  } finally {
    exporting.value = false;
  }
}

async function openImportDialog() {
  showImportDialog.value = true;
  loadingBackups.value = true;
  try {
    backupFiles.value = await getBackupFiles();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', message: `读取备份失败: ${msg}`, timeout: 3000, position: 'top' });
    showImportDialog.value = false;
  } finally {
    loadingBackups.value = false;
  }
}

async function handleImport(filePath: string) {
  $q.dialog({
    title: '确认导入',
    message: '导入将覆盖所有现有数据（设置、提示词、项目等全部替换），是否继续？',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    importing.value = true;
    showImportDialog.value = false;
    try {
      await importDatabase(filePath);
      await loadDbStats();
      $q.notify({
        type: 'positive',
        message: '导入成功，请重启应用使所有数据生效',
        timeout: 4000,
        position: 'top',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      $q.notify({ type: 'negative', message: `导入失败: ${msg}`, timeout: 3000, position: 'top' });
    } finally {
      importing.value = false;
    }
  });
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
</script>

<style scoped>
.itimo-db-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--itimo-surface-border);
  border-radius: 8px;
  background: var(--itimo-surface-elevated);
}

.itimo-db-stat-icon {
  color: var(--itimo-brand);
}

.itimo-db-stat-label {
  font-family: var(--itimo-font-body);
  font-size: 0.78rem;
  color: var(--itimo-text-secondary);
}

.itimo-db-stat-value {
  font-family: var(--itimo-font-display);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--itimo-text-primary);
}

.itimo-backup-item {
  border-radius: 8px;
  margin-bottom: 4px;
  transition: background 0.15s;
}

.itimo-backup-item:hover {
  background: color-mix(in srgb, var(--itimo-brand) 10%, transparent);
}
</style>
