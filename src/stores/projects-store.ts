import { defineStore } from 'pinia';
import {
  createProjectOnDisk,
  deleteProjectOnDisk,
  loadProjectManifest,
  scanAndRebuildProjectsIndex,
  updateProjectOnDisk,
  type CreateProjectInput,
} from 'src/db/project';
import type { ProjectManifest, ProjectsIndexEntry } from 'src/core/types';
import { useSettingsStore } from './settings-store';

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    items: [] as ProjectsIndexEntry[],
    /** 用于首页卡片展示的 manifest 缓存（按项目 id） */
    manifestsById: {} as Record<string, ProjectManifest | undefined>,
    loading: false as boolean,
  }),
  actions: {
    async refresh() {
      this.loading = true;
      try {
        // 扫描 projects 文件夹并重建索引
        const idx = await scanAndRebuildProjectsIndex();
        this.items = idx.projects;
        const map: Record<string, ProjectManifest | undefined> = {};
        await Promise.all(
          this.items.map(async (e) => {
            try {
              map[e.id] = await loadProjectManifest(e.rootPath);
            } catch {
              map[e.id] = undefined;
            }
          }),
        );
        this.manifestsById = map;
      } finally {
        this.loading = false;
      }
    },

    async createProject(input: CreateProjectInput) {
      const settings = useSettingsStore();
      const parentDir = settings.settings.projectsRootPath;
      const entry = await createProjectOnDisk(parentDir ? { ...input, parentDir } : input);
      await this.refresh();
      return entry;
    },

    async updateProject(projectId: string, input: CreateProjectInput) {
      await updateProjectOnDisk(projectId, input);
      await this.refresh();
    },

    async deleteProject(projectId: string) {
      await deleteProjectOnDisk(projectId);
      delete this.manifestsById[projectId];
      this.items = this.items.filter((item) => item.id !== projectId);
    },
  },
});
