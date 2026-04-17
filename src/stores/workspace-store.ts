/**
 * 工作空间 Store
 */
import { defineStore } from 'pinia';
import { toRaw } from 'vue';
import type { ProjectManifest, Character, Scene, Prop } from 'src/core/types/project';
import { loadProjectManifest, saveProjectManifestById } from 'src/db/project';
import { loadCharactersByProject, saveCharacters } from 'src/db/characters';
import { loadScenesByProject, saveScenes } from 'src/db/scenes';
import { loadPropsByProject, saveProps } from 'src/db/props';

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    projectId: null as string | null,
    rootPath: null as string | null,
    manifest: null as ProjectManifest | null,
    characters: [] as Character[],
    scenes: [] as Scene[],
    props: [] as Prop[],
  }),
  actions: {
    async loadFromDisk(projectRoot: string) {
      const manifest = await loadProjectManifest(projectRoot);
      this.projectId = manifest.id;
      this.rootPath = projectRoot;
      this.manifest = manifest;

      // 从数据库加载资产数据
      await this.loadAssets();
    },

    async loadAssets() {
      if (!this.projectId) return;

      const [characters, scenes, props] = await Promise.all([
        loadCharactersByProject(this.projectId),
        loadScenesByProject(this.projectId),
        loadPropsByProject(this.projectId),
      ]);

      this.characters = characters;
      this.scenes = scenes;
      this.props = props;
    },

    // ── 角色操作 ────────────────────────────────────────

    async addCharacter(character: Omit<Character, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) {
      if (!this.projectId) return null;

      const newCharacter: Character = {
        ...character,
        id: crypto.randomUUID(),
        projectId: this.projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.characters.push(newCharacter);
      await saveCharacters(this.projectId, this.characters);
      return newCharacter;
    },

    async updateCharacter(characterId: string, updates: Partial<Omit<Character, 'id' | 'createdAt'>>) {
      if (!this.projectId) return;

      const index = this.characters.findIndex((c) => c.id === characterId);
      if (index === -1) return;

      const existing = this.characters[index]!;
      this.characters[index] = {
        id: existing.id,
        name: updates.name ?? existing.name,
        description: updates.description ?? existing.description,
        role: updates.role ?? existing.role,
        gender: updates.gender ?? existing.gender,
        age: updates.age ?? existing.age,
        height: updates.height ?? existing.height,
        weight: updates.weight ?? existing.weight,
        bodyType: updates.bodyType ?? existing.bodyType,
        facialFeatures: updates.facialFeatures ?? existing.facialFeatures,
        identity: updates.identity ?? existing.identity,
        personality: updates.personality ?? existing.personality,
        speakingStyle: updates.speakingStyle ?? existing.speakingStyle,
        interests: updates.interests ?? existing.interests,
        projectId: this.projectId,
        imagePath: updates.imagePath,
        promptLangEn: updates.promptLangEn,
        promptThemeId: updates.promptThemeId,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      };

      await saveCharacters(this.projectId, this.characters);
    },

    async deleteCharacter(characterId: string) {
      if (!this.projectId) return;

      this.characters = this.characters.filter((c) => c.id !== characterId);
      await saveCharacters(this.projectId, this.characters);
    },

    // ── 场景操作 ────────────────────────────────────────

    async addScene(scene: Omit<Scene, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) {
      if (!this.projectId) return null;

      const newScene: Scene = {
        ...scene,
        id: crypto.randomUUID(),
        projectId: this.projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.scenes.push(newScene);
      await saveScenes(this.projectId, this.scenes);
      return newScene;
    },

    async updateScene(sceneId: string, updates: Partial<Omit<Scene, 'id' | 'createdAt'>>) {
      if (!this.projectId) return;

      const index = this.scenes.findIndex((s) => s.id === sceneId);
      if (index === -1) return;

      const existing = this.scenes[index]!;
      this.scenes[index] = {
        id: existing.id,
        name: updates.name ?? existing.name,
        description: updates.description ?? existing.description,
        projectId: this.projectId ?? existing.projectId,
        imagePath: updates.imagePath,
        promptLangEn: updates.promptLangEn,
        promptThemeId: updates.promptThemeId,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      };

      await saveScenes(this.projectId, this.scenes);
    },

    async deleteScene(sceneId: string) {
      if (!this.projectId) return;

      this.scenes = this.scenes.filter((s) => s.id !== sceneId);
      await saveScenes(this.projectId, this.scenes);
    },

    // ── 道具操作 ────────────────────────────────────────

    async addProp(prop: Omit<Prop, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) {
      if (!this.projectId) return null;

      const newProp: Prop = {
        ...prop,
        id: crypto.randomUUID(),
        projectId: this.projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.props.push(newProp);
      await saveProps(this.projectId, this.props);
      return newProp;
    },

    async updateProp(propId: string, updates: Partial<Omit<Prop, 'id' | 'createdAt'>>) {
      if (!this.projectId) return;

      const index = this.props.findIndex((p) => p.id === propId);
      if (index === -1) return;

      const existing = this.props[index]!;
      this.props[index] = {
        id: existing.id,
        name: updates.name ?? existing.name,
        description: updates.description ?? existing.description,
        projectId: this.projectId ?? existing.projectId,
        imagePath: updates.imagePath,
        promptLangEn: updates.promptLangEn,
        promptThemeId: updates.promptThemeId,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      };

      await saveProps(this.projectId, this.props);
    },

    async deleteProp(propId: string) {
      if (!this.projectId) return;

      this.props = this.props.filter((p) => p.id !== propId);
      await saveProps(this.projectId, this.props);
    },

    // ── Manifest 操作 ───────────────────────────────────

    patchManifest(partial: Partial<ProjectManifest>) {
      if (!this.manifest) return;
      const raw = toRaw(this.manifest);
      this.manifest = { ...raw, ...partial, updatedAt: new Date().toISOString() };
      void this.saveToDb();
    },

    async saveToDb() {
      if (!this.manifest) return;
      await saveProjectManifestById(this.manifest.id, toRaw(this.manifest));
    },

    clear() {
      this.projectId = null;
      this.rootPath = null;
      this.manifest = null;
      this.characters = [];
      this.scenes = [];
      this.props = [];
    },
  },
});
