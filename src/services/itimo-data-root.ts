import { getProjectsDataRoot, getProjectsParentPath, getLibrariesPath } from './app-paths';
import type { AppSettings } from 'src/core/types/settings';

/** 解析「新建项目默认父目录」绝对路径（与设置、默认值一致） */
export async function resolveProjectsParentPath(
  settings: Pick<AppSettings, 'projectsRootPath'>,
): Promise<string> {
  return getProjectsParentPath(settings.projectsRootPath);
}

/** itimo 数据根：projectsRootPath/itimoAiDrama（其下含 projects、libraries 等） */
export async function getItimoDataRoot(
  settings: Pick<AppSettings, 'projectsRootPath'>,
): Promise<string> {
  return getProjectsDataRoot(settings.projectsRootPath);
}

/** 全局资源库根：`<itimo 数据根>/libraries` */
export async function getGlobalLibrariesRootPath(
  settings: Pick<AppSettings, 'projectsRootPath'>,
): Promise<string> {
  return getLibrariesPath(settings.projectsRootPath);
}
