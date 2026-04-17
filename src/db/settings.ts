/**
 * 设置数据库 CRUD 服务
 */
import { db, type DbSettings } from './index';

function nowIso(): string {
  return new Date().toISOString();
}

// ── 加载 ─────────────────────────────────────────────────────────

/** 从数据库加载应用设置 */
export async function loadDbSettings(): Promise<DbSettings> {
  const record = await db.settings.get('app');
  if (!record) {
    throw new Error('[loadDbSettings] 数据库中没有设置数据，请确保已在 boot 阶段调用 initializeDatabase()');
  }
  return record;
}

// ── 保存 ─────────────────────────────────────────────────────────

/** 保存应用设置到数据库 */
export async function saveDbSettings(partial: Partial<DbSettings>): Promise<void> {
  await db.settings.update('app', {
    ...partial,
    updatedAt: nowIso(),
  });
}

/** 保存完整的应用设置 */
export async function saveFullDbSettings(settings: DbSettings): Promise<void> {
  await db.settings.put({
    ...settings,
    updatedAt: nowIso(),
  });
}

// ── 便捷更新方法 ────────────────────────────────────────────────

/** 更新提示词相关的设置 */
export async function updatePromptSettings(updates: Partial<DbSettings['prompt']>): Promise<void> {
  const current = await loadDbSettings();
  await saveDbSettings({
    prompt: {
      ...current.prompt,
      ...updates,
    },
  });
}

/** 更新 API 配置 */
export async function updateApiSettings(updates: Partial<DbSettings['api']>): Promise<void> {
  const current = await loadDbSettings();
  await saveDbSettings({
    api: {
      ...current.api,
      ...updates,
    },
  });
}

/** 设置提示词绑定的 API */
export async function setPromptApiBinding(promptId: string, apiConfigName: string): Promise<void> {
  const current = await loadDbSettings();
  const bindings = { ...current.prompt.promptApiBindings };
  bindings[promptId] = apiConfigName;
  await updatePromptSettings({ promptApiBindings: bindings });
}

/** 获取提示词绑定的 API */
export async function getPromptApiBinding(promptId: string): Promise<string> {
  const current = await loadDbSettings();
  return current.prompt.promptApiBindings?.[promptId] ?? '';
}

/** 设置提示词 API 锁定状态 */
export async function setPromptApiLocked(promptId: string, locked: boolean): Promise<void> {
  const current = await loadDbSettings();
  const lockedMap = { ...current.prompt.promptApiLocked };
  lockedMap[promptId] = locked;
  await updatePromptSettings({ promptApiLocked: lockedMap });
}

/** 获取提示词 API 锁定状态 */
export async function isPromptApiLocked(promptId: string): Promise<boolean> {
  const current = await loadDbSettings();
  return current.prompt.promptApiLocked?.[promptId] ?? false;
}

/** 设置提示词语言状态 */
export async function setPromptLangState(promptId: string, isEnglish: boolean): Promise<void> {
  const current = await loadDbSettings();
  const langState = { ...current.prompt.promptLangState };
  langState[promptId] = isEnglish;
  await updatePromptSettings({ promptLangState: langState });
}

/** 获取提示词语言状态 */
export async function getPromptLangState(promptId: string): Promise<boolean> {
  const current = await loadDbSettings();
  return current.prompt.promptLangState?.[promptId] ?? false;
}

/** 保存提示词内容覆盖 */
export async function savePromptOverride(
  themeId: string,
  promptId: string,
  lang: 'zh' | 'en',
  content: string,
): Promise<void> {
  const current = await loadDbSettings();
  const overridesKey = lang === 'zh' ? 'builtinThemeOverridesZh' : 'builtinThemeOverridesEn';
  const themeOverrides = { ...(current.prompt[overridesKey]?.[themeId] ?? {}) };
  themeOverrides[promptId] = content;
  const allOverrides = { ...current.prompt[overridesKey] };
  allOverrides[themeId] = themeOverrides;
  await updatePromptSettings({ [overridesKey]: allOverrides } as Partial<DbSettings['prompt']>);
}

/** 获取提示词覆盖内容 */
export async function getPromptOverride(
  themeId: string,
  promptId: string,
  lang: 'zh' | 'en',
): Promise<string | null> {
  const current = await loadDbSettings();
  const overridesKey = lang === 'zh' ? 'builtinThemeOverridesZh' : 'builtinThemeOverridesEn';
  return current.prompt[overridesKey]?.[themeId]?.[promptId] ?? null;
}

/** 添加用户自建提示词主题 */
export async function addUserPromptTheme(theme: DbSettings['prompt']['userThemes'][0]): Promise<void> {
  const current = await loadDbSettings();
  const themes = [...current.prompt.userThemes, theme];
  await updatePromptSettings({ userThemes: themes });
}

/** 更新用户自建提示词主题 */
export async function updateUserPromptTheme(
  themeId: string,
  updates: Partial<DbSettings['prompt']['userThemes'][0]>,
): Promise<void> {
  const current = await loadDbSettings();
  const themes = current.prompt.userThemes.map((t) =>
    t.id === themeId ? { ...t, ...updates } : t,
  );
  await updatePromptSettings({ userThemes: themes });
}

/** 删除用户自建提示词主题 */
export async function deleteUserPromptTheme(themeId: string): Promise<void> {
  const current = await loadDbSettings();
  const themes = current.prompt.userThemes.filter((t) => t.id !== themeId);
  await updatePromptSettings({ userThemes: themes });
}

/** 添加自定义 API 配置 */
export async function addApiConfig(
  config: DbSettings['api']['customConfigs'][0],
): Promise<void> {
  const current = await loadDbSettings();
  const configs = [...current.api.customConfigs, config];
  await updateApiSettings({ customConfigs: configs });
}

/** 更新自定义 API 配置 */
export async function updateApiConfig(
  name: string,
  updates: Partial<DbSettings['api']['customConfigs'][0]>,
): Promise<void> {
  const current = await loadDbSettings();
  const configs = current.api.customConfigs.map((c) =>
    c.name === name ? { ...c, ...updates } : c,
  );
  await updateApiSettings({ customConfigs: configs });
}

/** 删除自定义 API 配置 */
export async function deleteApiConfig(name: string): Promise<void> {
  const current = await loadDbSettings();
  const configs = current.api.customConfigs.filter((c) => c.name !== name);
  await updateApiSettings({ customConfigs: configs });
}

/** 保存主题配置（通用更新） */
export async function saveThemeConfig(
  theme: Partial<Pick<DbSettings, 'theme' | 'fontSizePreset' | 'projectsRootPath' | 'reopenLastProjectOnStartup'>>,
): Promise<void> {
  await db.settings.update('app', {
    ...theme,
    updatedAt: nowIso(),
  });
}
