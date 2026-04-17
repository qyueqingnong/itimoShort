import { requireElectronApi } from './native-fs';

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|avif)$/i;

export interface ImageFileEntry {
  name: string;
  fullPath: string;
}

export async function listImageFilesInDir(absDir: string): Promise<ImageFileEntry[]> {
  const api = requireElectronApi();
  if (!(await api.fsExists(absDir))) {
    return [];
  }
  const entries = await api.fsListDir(absDir);
  const out: ImageFileEntry[] = [];
  for (const e of entries) {
    if (!e.isFile) {
      continue;
    }
    if (!IMAGE_EXT.test(e.name)) {
      continue;
    }
    const fullPath = await api.pathJoin(absDir, e.name);
    out.push({ name: e.name, fullPath });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}
