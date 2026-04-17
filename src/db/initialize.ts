/**
 * 数据库初始化模块
 * 在首次启动时填充默认数据（应用设置 + 内置提示词）
 */
import { db, type DbSettings } from './index';
import { PROMPT_THEMES } from 'src/services/prompt';
import { DEFAULT_DB_SETTINGS } from './index';
import { checkNeedsMigration, runMigration } from './migration';

function nowIso(): string {
  return new Date().toISOString();
}

/** 检查数据库是否已完成首次初始化 */
async function isDatabaseInitialized(): Promise<boolean> {
  const record = await db.settings.get('app');
  return record !== undefined;
}

/**
 * 将内置 PromptTheme 转换为用户提示词主题格式
 */
function convertBuiltinThemeToUserTheme(
  theme: (typeof PROMPT_THEMES)[number],
): DbSettings['prompt']['userThemes'][0] {
  const prompts = theme.prompts.map((p) => ({
    id: p.id,
    stage: p.stage,
    title: p.title,
    contentZh: p.contentZh,
    contentEn: p.contentEn,
    apiType: p.apiType,
  }));

  return {
    id: theme.id,
    label: theme.label,
    prompts,
  };
}

/**
 * 初始化数据库
 * 仅在首次启动时执行（检测数据库是否为空）
 */
export async function initializeDatabase(): Promise<boolean> {
  // 如果数据库已经有数据，跳过初始化
  if (await isDatabaseInitialized()) {
    console.log('[db-init] 数据库已初始化，跳过');

    // 检查是否需要迁移旧数据
    if (await checkNeedsMigration()) {
      console.log('[db-init] 检测到需要迁移的旧数据，开始迁移...');
      const result = await runMigration();
      console.log('[db-init] 迁移完成:', result);
    }

    return false;
  }

  console.log('[db-init] 首次启动，开始初始化数据库...');

  // 初始化数据：从 DEFAULT_DB_SETTINGS 开始
  const initialSettings = { ...DEFAULT_DB_SETTINGS };

  // 将内置提示词主题转换为用户提示词主题格式
  // 这样用户在提示词编辑器中可以直接看到和编辑内置提示词
  const builtinThemesAsUserThemes = PROMPT_THEMES.map(convertBuiltinThemeToUserTheme);
  initialSettings.prompt.userThemes = builtinThemesAsUserThemes;

  // 设置初始更新时间
  initialSettings.updatedAt = nowIso();

  // 写入数据库
  await db.settings.put(initialSettings);

  console.log('[db-init] 数据库初始化完成，内置提示词已填充');
  return true;
}
