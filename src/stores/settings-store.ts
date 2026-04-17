/**
 * 应用设置 Store
 */
import { defineStore } from 'pinia';
import { toRaw } from 'vue';
import { useQuasar } from 'quasar';
import langZh from 'quasar/lang/zh-CN';
import { DEFAULT_APP_SETTINGS, FONT_PRESET_PX, createDefaultApiSettings, type AppSettings } from 'src/core/types/settings';
import { syncTheme, setupThemeListener } from 'src/core/themes/apple-theme';
import { loadDbSettings, saveDbSettings } from 'src/db/settings';
import { type DbSettings } from 'src/db/index';

let themeCleanup: (() => void) | null = null;

/** 将数据库格式转换为 AppSettings */
function dbToAppSettings(db: DbSettings): AppSettings {
  const defaults = createDefaultApiSettings();

  if (!db.api) {
    return {
      theme: db.theme,
      fontSizePreset: db.fontSizePreset,
      projectsRootPath: db.projectsRootPath,
      reopenLastProjectOnStartup: db.reopenLastProjectOnStartup,
      prompt: db.prompt as unknown as AppSettings['prompt'],
      api: defaults,
    };
  }

  const customConfigs = db.api.customConfigs ?? [];
  const textConfig = customConfigs.find((c) => c.serviceType === 'text');
  const imageConfig = customConfigs.find((c) => c.serviceType === 'image');
  const videoConfig = customConfigs.find((c) => c.serviceType === 'video');
  const audioConfig = customConfigs.find((c) => c.serviceType === 'audio');

  return {
    theme: db.theme,
    fontSizePreset: db.fontSizePreset,
    projectsRootPath: db.projectsRootPath,
    reopenLastProjectOnStartup: db.reopenLastProjectOnStartup,
    prompt: db.prompt as unknown as AppSettings['prompt'],
    api: {
      text: {
        provider: textConfig?.provider ?? defaults.text.provider,
        baseUrl: textConfig?.baseUrl ?? '',
        apiKey: textConfig?.apiKey ?? '',
        model: textConfig?.model ?? defaults.text.model,
        maxConcurrency: 1,
        timeoutMs: 300000,
      },
      image: {
        provider: imageConfig?.provider ?? defaults.image.provider,
        baseUrl: imageConfig?.baseUrl ?? '',
        apiKey: imageConfig?.apiKey ?? '',
        model: imageConfig?.model ?? defaults.image.model,
        maxConcurrency: 1,
        timeoutMs: 300000,
      },
      video: {
        provider: videoConfig?.provider ?? defaults.video.provider,
        baseUrl: videoConfig?.baseUrl ?? '',
        apiKey: videoConfig?.apiKey ?? '',
        model: videoConfig?.model ?? defaults.video.model,
        maxConcurrency: 1,
        timeoutMs: 300000,
      },
      audio: {
        provider: audioConfig?.provider ?? defaults.audio.provider,
        baseUrl: audioConfig?.baseUrl ?? '',
        apiKey: audioConfig?.apiKey ?? '',
        model: audioConfig?.model ?? defaults.audio.model,
        maxConcurrency: 1,
        timeoutMs: 300000,
      },
      customConfigs,
    },
  };
}

/** 将 AppSettings 转换为数据库格式 */
function appSettingsToDb(settings: AppSettings): DbSettings {
  return {
    id: 'app',
    theme: settings.theme,
    fontSizePreset: settings.fontSizePreset,
    projectsRootPath: settings.projectsRootPath,
    reopenLastProjectOnStartup: settings.reopenLastProjectOnStartup,
    prompt: settings.prompt as unknown as DbSettings['prompt'],
    api: {
      customConfigs: settings.api.customConfigs ?? [],
    },
    updatedAt: new Date().toISOString(),
  };
}

export const useSettingsStore = defineStore('settings', {
  state: (): {
    settings: AppSettings;
    loaded: boolean;
    persistedProjectsRootSnapshot: string | null;
  } => ({
    settings: structuredClone(DEFAULT_APP_SETTINGS),
    loaded: false,
    persistedProjectsRootSnapshot: null,
  }),
  actions: {
    async load() {
      const dbSettings = await loadDbSettings();
      this.settings = dbToAppSettings(dbSettings);
      this.persistedProjectsRootSnapshot = this.settings.projectsRootPath;
      this.loaded = true;
    },

    async save() {
      const raw = toRaw(this.settings);
      await saveDbSettings(appSettingsToDb(raw));
      this.persistedProjectsRootSnapshot = this.settings.projectsRootPath;
    },

    applyToQuasar() {
      try {
        const $q = useQuasar();

        syncTheme(this.settings.theme);

        const fontSize = `${FONT_PRESET_PX[this.settings.fontSizePreset]}px`;
        document.documentElement.style.fontSize = fontSize;
        document.body.style.fontSize = fontSize;
        document.documentElement.setAttribute('lang', 'zh-CN');

        if ($q && $q.lang) {
          $q.lang.set(langZh);
        }

        if (themeCleanup) {
          themeCleanup();
        }

        themeCleanup = setupThemeListener(() => {
          if (this.settings.theme === 'auto') {
            syncTheme(this.settings.theme);
          }
        });
      } catch (e) {
        console.error('[settings] Failed to apply settings to Quasar:', e);
      }
    },
  },
});
