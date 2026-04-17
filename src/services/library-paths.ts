import { useSettingsStore } from 'src/stores/settings-store';
import { getLibrariesPath } from './app-paths';
import { requireElectronApi } from './native-fs';

export type GlobalLibraryKind = 'characters' | 'scenes' | 'props' | 'storyboards';

const SUBDIR: Record<GlobalLibraryKind, string> = {
  characters: 'characters',
  scenes: 'scenes',
  props: 'props',
  storyboards: 'storyboards',
};

/**
 * 全局资源库目录：`<projectsRootPath>/itimoAiDrama/libraries/<kind>/`
 */
export async function ensureGlobalLibraryDir(kind: GlobalLibraryKind): Promise<string> {
  const api = requireElectronApi();
  const settings = useSettingsStore();
  const libRoot = await getLibrariesPath(settings.settings.projectsRootPath);
  const dir = await api.pathJoin(libRoot, SUBDIR[kind]);
  await api.fsEnsureDir(dir);
  return dir;
}
