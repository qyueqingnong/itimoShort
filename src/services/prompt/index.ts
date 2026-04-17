import { promp_currency } from './promp_currency';
import { promp_google } from './promp_google';
import type { PromptTheme } from './types';

export type { PromptTheme, PromptItem, PromptStage } from './types';
export { PROMPT_STAGE_LABELS, PROMPT_STAGES } from './types';

/** 所有内置提示词主题，顺序即左侧列表顺序 */
export const PROMPT_THEMES: PromptTheme[] = [promp_currency, promp_google];
