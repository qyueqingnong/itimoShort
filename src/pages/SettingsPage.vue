<template>
  <q-page padding class="itimo-text-primary">
    <div class="column q-gutter-y-md" style="max-width: 980px; margin: 0 auto; width: 100%">
      <div class="row items-center justify-between q-mb-sm">
        <div class="itimo-section-heading itimo-text-brand">设置</div>
        <div class="text-caption itimo-text-secondary">修改后点击确定保存</div>
      </div>

      <q-tabs
        v-model="tab"
        dense
        class="itimo-text-secondary"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab name="basic" label="基础" icon="tune" />
        <q-tab name="prompt" label="提示词" icon="edit_note" />
        <q-tab name="api" label="接口" icon="hub" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated class="bg-transparent itimo-tab-panels">
        <q-tab-panel name="basic" class="q-px-none">
          <SettingsBasicTab @apply="applyUi" />
        </q-tab-panel>
        <q-tab-panel name="prompt" class="q-px-none">
          <SettingsPromptTab @apply="applyUi" />
        </q-tab-panel>
        <q-tab-panel name="api" class="q-px-none">
          <SettingsApiTab @apply="applyUi" />
        </q-tab-panel>
      </q-tab-panels>

      <q-separator />

      <!-- 数据库导出/导入 -->
      <div class="row items-center q-gutter-xs">
        <span class="text-caption itimo-text-secondary q-mr-sm">数据库：</span>
        <q-btn flat no-caps icon="database" label="数据库状态" @click="showDatabaseStats" />
        <q-btn flat no-caps icon="upload" label="导出数据库" @click="doExportDatabase" />
        <q-btn flat no-caps icon="download" label="导入数据库" @click="doImportDatabase" />
        <q-btn flat no-caps icon="delete_forever" label="清空数据库" color="negative" @click="confirmClearDatabase" />
      </div>

      <div class="row flex-wrap items-center q-gutter-sm q-mt-sm">
        <q-btn
          unelevated
          no-caps
          class="itimo-link-pill itimo-link-pill--filled"
          icon="check"
          label="确定"
          @click="confirmAndExit"
        />
        <q-btn
          flat
          no-caps
          class="itimo-link-pill itimo-link-pill--outline"
          icon="restart_alt"
          label="重置"
          @click="confirmReset"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import SettingsBasicTab from 'src/components/settings/SettingsBasicTab.vue';
import SettingsPromptTab from 'src/components/settings/SettingsPromptTab.vue';
import SettingsApiTab from 'src/components/settings/SettingsApiTab.vue';
import { DEFAULT_APP_SETTINGS, type AppSettings } from 'src/core/types/settings';
import { useSettingsStore } from 'src/stores/settings-store';
import { getElectronApi } from 'src/services/native-fs';
import { getProjectsDataRoot } from 'src/services/app-paths';
import { exportDatabase, importDatabase, getDatabaseStats } from 'src/db/export-import';

const $q = useQuasar();
const router = useRouter();
const settings = useSettingsStore();

const tab = ref<'basic' | 'prompt' | 'api'>('basic');

function applyUi() {
  settings.applyToQuasar();
}

async function confirmAndExit() {
  const api = getElectronApi();

  try {
    // 检查 projectsRootPath 是否改变
    const pathChanged =
      settings.settings.projectsRootPath &&
      settings.persistedProjectsRootSnapshot &&
      settings.settings.projectsRootPath !== settings.persistedProjectsRootSnapshot;

    // 如果路径改变了，需要先执行数据移动
    if (pathChanged && api && settings.settings.projectsRootPath) {
      const oldDataRoot = await getProjectsDataRoot(settings.persistedProjectsRootSnapshot);
      const newDataRoot = await api.pathJoin(settings.settings.projectsRootPath, 'itimoAiDrama');

      console.log('[SettingsPage] Path changed, checking data migration:', {
        oldDataRoot,
        newDataRoot,
      });

      const hasOldData = await api.fsExists(oldDataRoot);
      const hasNewData = await api.fsExists(newDataRoot);

      if (hasOldData && hasNewData) {
        // 目标位置已存在数据，无法移动
        $q.notify({
          type: 'negative',
          message:
            '目标位置已存在 itimoAiDrama 文件夹，无法移动数据。请选择其他位置或手动处理冲突。',
          timeout: 2000,
          position: 'top',
        });
        // 恢复原设置
        settings.settings.projectsRootPath = settings.persistedProjectsRootSnapshot;
        return;
      }

      if (hasOldData) {
        // 需要移动数据
        const confirmed = await new Promise<boolean>((resolve) => {
          $q.dialog({
            title: '确认移动数据',
            message: `即将把数据文件夹从：\n${oldDataRoot}\n\n移动到：\n${newDataRoot}\n\n是否继续？`,
            cancel: {
              label: '取消',
              color: 'primary',
              flat: true,
            },
            ok: {
              label: '移动',
              color: 'primary',
            },
          })
            .onOk(() => resolve(true))
            .onCancel(() => resolve(false));
        });

        if (!confirmed) {
          // 用户取消，恢复原设置
          settings.settings.projectsRootPath = settings.persistedProjectsRootSnapshot;
          return;
        }

        try {
          // 执行移动操作
          console.log('[SettingsPage] Moving data folder...');
          await api.fsEnsureDir(settings.settings.projectsRootPath);
          await api.fsRename(oldDataRoot, newDataRoot);

          $q.notify({
            type: 'positive',
            message: '数据文件夹移动成功',
            timeout: 1500,
            position: 'top',
          });
        } catch (err) {
          console.error('[SettingsPage] Error moving data folder:', err);
          $q.notify({
            type: 'negative',
            message: `数据移动失败：${err instanceof Error ? err.message : String(err)}`,
            timeout: 2000,
            position: 'top',
          });
          // 移动失败，恢复原设置
          settings.settings.projectsRootPath = settings.persistedProjectsRootSnapshot;
          return;
        }
      }
    }

    await settings.save();

    if (pathChanged) {
      // 数据目录改变了，提示用户重启应用
      $q.dialog({
        title: '设置已保存',
        message: `数据目录已更改为：${settings.settings.projectsRootPath}\\itimoAiDrama\n\n请重启应用以确保所有功能正常工作。`,
        persistent: true,
        ok: {
          label: '我知道了',
          color: 'primary',
        },
      });
    } else {
      $q.notify({
        type: 'positive',
        message: '设置已保存',
        timeout: 1500,
        position: 'top',
      });
      await router.push({ name: 'home' });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: `操作失败：${msg}`,
      timeout: 2000,
      position: 'top',
    });
    // 发生错误，恢复原设置
    settings.settings.projectsRootPath = settings.persistedProjectsRootSnapshot;
    return;
  }
}

function confirmReset() {
  $q.dialog({
    title: '重置设置',
    message: '确定要重置所有设置到默认值吗？',
    cancel: true,
    persistent: true,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
  }).onOk(async () => {
    settings.settings = structuredClone(DEFAULT_APP_SETTINGS);
    settings.applyToQuasar();
    await settings.save();
    $q.notify({
      type: 'positive',
      message: '设置已重置',
      timeout: 1500,
      position: 'top',
    });
  });
}

async function exportSettings() {
  const payload = JSON.stringify(settings.settings, null, 2);
  const api = getElectronApi();
  if (api) {
    const path = await api.dialogSaveFile({
      defaultPath: 'itimoAiDrama-settings.json',
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!path) return;
    await api.fsWriteTextFile(path, payload);
    $q.notify({
      type: 'positive',
      message: '设置已导出',
      timeout: 1500,
      position: 'top',
    });
    return;
  }
  const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'itimoAiDrama-settings.json';
  a.click();
  URL.revokeObjectURL(url);
  $q.notify({
    type: 'positive',
    message: '设置已下载',
    timeout: 1500,
    position: 'top',
  });
}

async function importSettings() {
  const api = getElectronApi();
  if (api) {
    const path = await api.dialogOpenFile({
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!path) return;
    const raw = await api.fsReadTextFile(path);
    await applyImportedJson(raw);
    return;
  }
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : '';
      void applyImportedJson(raw);
    };
    reader.readAsText(file);
  };
  input.click();
}

async function applyImportedJson(raw: string) {
  try {
    const parsed = JSON.parse(raw) as AppSettings;
    settings.settings = parsed;
    settings.applyToQuasar();
    await settings.save();
    $q.notify({
      type: 'positive',
      message: '设置已导入',
      timeout: 1500,
      position: 'top',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: `导入失败：${msg}`,
      timeout: 2000,
      position: 'top',
    });
  }
}

// ── 数据库导出/导入 ────────────────────────────────────────────────

async function showDatabaseStats() {
  try {
    const stats = await getDatabaseStats();
    $q.notify({
      type: 'info',
      message: `数据库状态：${stats.projectCount} 个项目，${stats.episodeCount} 个分集，${stats.storyboardCount} 个分镜`,
      timeout: 3000,
      position: 'top',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: `获取数据库状态失败：${msg}`,
      timeout: 2000,
      position: 'top',
    });
  }
}

async function doExportDatabase() {
  const api = getElectronApi();
  if (!api) {
    $q.notify({
      type: 'warning',
      message: '此功能仅在桌面端可用',
      position: 'top',
    });
    return;
  }

  try {
    const path = await api.dialogSaveFile({
      defaultPath: `itimoAiDrama-db-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: '数据库备份', extensions: ['json'] }],
    });
    if (!path) return;

    await exportDatabase(path);
    $q.notify({
      type: 'positive',
      message: '数据库导出成功',
      timeout: 2000,
      position: 'top',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: `导出失败：${msg}`,
      timeout: 3000,
      position: 'top',
    });
  }
}

async function doImportDatabase() {
  const api = getElectronApi();
  if (!api) {
    $q.notify({
      type: 'warning',
      message: '此功能仅在桌面端可用',
      position: 'top',
    });
    return;
  }

  try {
    const path = await api.dialogOpenFile({
      filters: [{ name: '数据库备份', extensions: ['json'] }],
    });
    if (!path) return;

    $q.dialog({
      title: '导入确认',
      message: '导入数据库将覆盖现有数据。是否继续？',
      ok: { label: '确认导入', color: 'primary' },
      cancel: { label: '取消', flat: true },
    }).onOk(async () => {
      try {
        await importDatabase(path);
        $q.notify({
          type: 'positive',
          message: '数据库导入成功，请刷新页面',
          timeout: 3000,
          position: 'top',
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        $q.notify({
          type: 'negative',
          message: `导入失败：${msg}`,
          timeout: 3000,
          position: 'top',
        });
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: `操作失败：${msg}`,
      timeout: 2000,
      position: 'top',
    });
  }
}

function confirmClearDatabase() {
  $q.dialog({
    title: '危险操作确认',
    message: '清空数据库将删除所有项目、分集和设置数据，且无法恢复！\n\n强烈建议先导出数据库备份。是否继续？',
    ok: { label: '确认清空', color: 'negative' },
    cancel: { label: '取消', flat: true },
  }).onOk(async () => {
    try {
      const { clearAllData } = await import('src/db/export-import');
      await clearAllData();
      $q.notify({
        type: 'positive',
        message: '数据库已清空，请刷新页面',
        timeout: 3000,
        position: 'top',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      $q.notify({
        type: 'negative',
        message: `清空失败：${msg}`,
        timeout: 2000,
        position: 'top',
      });
    }
  });
}
</script>

<style scoped>
.itimo-tab-panels {
  min-height: 400px;
}
</style>
