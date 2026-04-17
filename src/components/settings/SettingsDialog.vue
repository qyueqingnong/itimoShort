<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card
      class="itimo-settings-dialog"
      style="
        width: 80vw;
        height: 80vh;
        max-width: 1200px;
        max-height: 800px;
        display: flex;
        flex-direction: column;
      "
    >
      <!-- Header with Tabs -->
      <div style="flex-shrink: 0; border-bottom: 1px solid var(--itimo-surface-border)">
        <div
          class="row items-center justify-between q-pa-md"
          style="border-bottom: 1px solid var(--itimo-surface-border)"
        >
          <div class="text-h6 text-weight-medium itimo-text-primary">设置</div>
          <q-btn flat round dense icon="close" @click="emit('update:modelValue', false)" />
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
          <q-tab name="basic" label="基础" />
          <q-tab name="prompt" label="提示词" />
          <q-tab name="api" label="接口" />
        </q-tabs>
      </div>

      <!-- Content -->
      <q-card-section class="q-pa-none" style="flex: 1; overflow-y: auto">
        <q-tab-panels v-model="tab" animated class="bg-transparent q-pa-md">
          <q-tab-panel name="basic" class="q-pa-none">
            <SettingsBasicTab @apply="applyUi" />
          </q-tab-panel>
          <q-tab-panel name="prompt" class="q-pa-none">
            <SettingsPromptTab @apply="applyUi" />
          </q-tab-panel>
          <q-tab-panel name="api" class="q-pa-none">
            <SettingsApiTab @apply="applyUi" />
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <!-- Footer with Buttons -->
      <div
        style="
          flex-shrink: 0;
          border-top: 1px solid var(--itimo-surface-border);
          padding: 16px 28px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        "
      >
        <q-btn flat label="取消" color="primary" @click="emit('update:modelValue', false)" />
        <q-btn unelevated label="确定" color="primary" @click="saveSettings" />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import SettingsBasicTab from 'src/components/settings/SettingsBasicTab.vue';
import SettingsPromptTab from 'src/components/settings/SettingsPromptTab.vue';
import SettingsApiTab from 'src/components/settings/SettingsApiTab.vue';
import { useSettingsStore } from 'src/stores/settings-store';
import { getProjectsDataRoot } from 'src/services/app-paths';
import { getElectronApi } from 'src/services/native-fs';

const $q = useQuasar();
const settings = useSettingsStore();

const tab = ref<'basic' | 'prompt' | 'api'>('basic');

defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

function applyUi() {
  settings.applyToQuasar();
}

async function saveSettings() {
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

      console.log('[SettingsDialog] Path changed, checking data migration:', {
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
          timeout: 5000,
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
          console.log('[SettingsDialog] Moving data folder...');
          await api.fsEnsureDir(settings.settings.projectsRootPath);
          await api.fsRename(oldDataRoot, newDataRoot);

          $q.notify({
            type: 'positive',
            message: '数据文件夹移动成功！',
            timeout: 3000,
          });
        } catch (err) {
          console.error('[SettingsDialog] Error moving data folder:', err);
          $q.notify({
            type: 'negative',
            message: `数据移动失败：${err instanceof Error ? err.message : String(err)}`,
            timeout: 5000,
          });
          // 移动失败，恢复原设置
          settings.settings.projectsRootPath = settings.persistedProjectsRootSnapshot;
          return;
        }
      }
    }

    // 应用设置到 UI
    settings.applyToQuasar();
    // 保存设置到文件
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
      // 显示成功提示
      $q.notify({
        type: 'positive',
        message: '设置已保存',
        timeout: 1000,
        position: 'top',
      });
      // 关闭对话框
      emit('update:modelValue', false);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: `保存失败: ${msg}`,
      position: 'top',
    });
    // 发生错误，恢复原设置
    settings.settings.projectsRootPath = settings.persistedProjectsRootSnapshot;
  }
}
</script>

<style scoped>
.itimo-settings-dialog {
  background: var(--itimo-bg-primary);
}
</style>
