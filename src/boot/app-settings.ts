import { boot } from 'quasar/wrappers';
import { useSettingsStore } from 'src/stores/settings-store';
import { initializeDatabase } from 'src/db/initialize';

export default boot(async () => {
  try {
    // 首次启动时初始化数据库（填充默认设置和内置提示词）
    await initializeDatabase();

    const settings = useSettingsStore();

    // 等待 settings 完全加载
    await settings.load();

    // 应用设置到 Quasar
    settings.applyToQuasar();

    console.log(
      '[boot] Settings loaded successfully, projectsRootPath:',
      settings.settings.projectsRootPath,
    );

    // Listen for system theme changes when in auto mode
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', () => {
        if (settings.settings.theme === 'auto') {
          settings.applyToQuasar();
        }
      });
    }
  } catch (e) {
    console.error('[boot] app-settings failed', e);
  }
});
