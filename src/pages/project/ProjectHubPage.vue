<template>
  <q-page class="itimo-project-hub" style="margin-top: 20px">
    <!-- Project Info Section -->
    <div class="itimo-project-header">
      <div class="itimo-project-info">
        <h1 class="itimo-project-title">{{ workspace.manifest?.name ?? '项目' }}</h1>
        <div class="itimo-project-meta">
          <span class="itimo-meta-item">
            <span class="itimo-meta-value">{{
              workspace.manifest?.description ?? '暂无描述'
            }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Episodes Section -->
    <div class="itimo-section">
      <div class="itimo-section-card">
        <div class="itimo-card-header">
          <h2 class="itimo-section-title">分集</h2>
          <q-btn
            color="primary"
            unelevated
            no-caps
            size="12px"
            icon="add"
            label="新建"
            @click="addEpisode"
            class="itimo-btn-add-episode"
          />
        </div>

        <div class="itimo-card-body">
          <div class="itimo-episodes-grid">
            <div
              v-for="ep in workspace.manifest?.episodes ?? []"
              :key="ep.id"
              class="itimo-episode-card"
            >
              <q-card class="itimo-card-elevated full-height">
                <q-card-section class="itimo-card-header-section">
                  <div class="row items-center justify-between">
                    <div class="itimo-episode-title">{{ ep.title }}</div>
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      size="sm"
                      color="negative"
                      @click="deleteEpisode(ep.id)"
                      class="q-ml-sm"
                    >
                      <q-tooltip>删除分集</q-tooltip>
                    </q-btn>
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="itimo-card-content">
                  <div class="itimo-episode-preview">
                    <span class="itimo-episode-preview-label">内容</span>
                    <span class="itimo-episode-preview-text">暂无内容</span>
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-actions align="right" class="itimo-card-actions-row">
                  <div style="display: flex; justify-content: left">
                    <div class="itimo-episode-number-section">
                      <span
                        v-if="!editingEpisodeId || editingEpisodeId !== ep.id"
                        class="itimo-episode-number"
                      >
                        {{ ep.episodeNumber }}
                      </span>
                      <div v-else class="itimo-episode-number-edit">
                        <span class="itimo-episode-number-prefix">第</span>
                        <q-input
                          v-model.number="editingEpisodeNumber"
                          type="number"
                          dense
                          outlined
                          class="itimo-episode-number-input"
                          @keyup.enter="confirmEditEpisodeNumber(ep.id, ep)"
                          @keyup.escape="cancelEditEpisodeNumber"
                          autofocus
                        />
                        <span class="itimo-episode-number-suffix">集</span>
                        <q-btn
                          flat
                          round
                          dense
                          icon="check"
                          size="xs"
                          color="positive"
                          @click="confirmEditEpisodeNumber(ep.id, ep)"
                          class="q-ml-xs"
                        />
                        <q-btn
                          flat
                          round
                          dense
                          icon="close"
                          size="xs"
                          color="negative"
                          @click="cancelEditEpisodeNumber"
                          class="q-ml-xs"
                        />
                      </div>
                    </div>
                    <q-btn
                      v-if="!editingEpisodeId || editingEpisodeId !== ep.id"
                      flat
                      round
                      dense
                      icon="edit"
                      size="sm"
                      color="primary"
                      @click="startEditEpisodeNumber(ep.id, ep.episodeNumber)"
                      class="q-ml-sm"
                    >
                      <q-tooltip>编辑集数</q-tooltip>
                    </q-btn>
                  </div>

                  <q-btn
                    color="primary"
                    outline
                    rounded
                    size="12px"
                    label="进入制作"
                    :to="`/project/${route.params.projectId}/produce/${ep.id}/story`"
                    class="itimo-btn-primary"
                  />
                </q-card-actions>
              </q-card>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs Section -->
    <div class="itimo-section">
      <div class="itimo-section-card">
        <div class="itimo-card-body">
          <q-tabs
            v-model="tab"
            dense
            class="itimo-tabs"
            active-color="primary"
            indicator-color="primary"
            align="left"
          >
            <q-tab name="characters" label="角色" />
            <q-tab name="scenes" label="场景" />
            <q-tab name="props" label="道具" />
            <q-tab name="videos" label="视频" />
          </q-tabs>

          <q-tab-panels v-model="tab" animated class="itimo-tab-panels">
            <q-tab-panel name="characters" class="itimo-tab-panel">
              <div class="itimo-section-header" style="margin-bottom: 16px">
                <h3 class="itimo-section-title" style="font-size: 1.13rem">项目角色</h3>
                <q-btn
                  color="primary"
                  unelevated
                  rounded
                  icon="add"
                  label="新建"
                  @click="openCharacterDialog()"
                  size="12px"
                />
              </div>

              <div v-if="projectCharacters.length === 0" class="itimo-empty-state-small">
                <q-icon name="face" size="48px" color="grey-5" />
                <p class="itimo-empty-text">暂无角色，点击上方按钮添加角色</p>
              </div>

              <div v-else class="itimo-character-cards">
                <div
                  v-for="character in projectCharacters"
                  :key="character.id"
                  class="itimo-character-card"
                >
                  <div class="itimo-character-card-image">
                    <template v-if="character.imagePath">
                      <img
                        :src="getCharacterImageUrl(character.imagePath)"
                        :alt="character.name"
                        class="itimo-character-img"
                      />
                    </template>
                    <div v-else class="itimo-character-no-image">未生成</div>
                  </div>
                  <div class="itimo-character-card-content">
                    <div class="itimo-character-card-header">
                      <h4 class="itimo-character-card-name">{{ character.name }}</h4>
                      <q-chip size="sm" color="primary" text-color="white" dense>
                        {{ character.role }}
                      </q-chip>
                    </div>
                    <div class="itimo-character-card-desc">
                      {{ formatCharacterDescription(character) }}
                      <q-tooltip max-width="400px">
                        {{ formatCharacterDescription(character) }}
                      </q-tooltip>
                    </div>
                    <div class="itimo-character-card-actions">
                      <q-btn
                        flat
                        dense
                        icon="edit"
                        label="编辑"
                        size="sm"
                        color="primary"
                        @click="openCharacterDialog(character)"
                      />
                      <q-btn
                        flat
                        dense
                        icon="delete"
                        label="删除"
                        size="sm"
                        color="negative"
                        @click="deleteCharacter(character.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </q-tab-panel>
            <q-tab-panel name="scenes" class="itimo-tab-panel">
              <div class="itimo-section-header" style="margin-bottom: 16px">
                <h3 class="itimo-section-title" style="font-size: 1.13rem">项目场景</h3>
                <q-btn
                  color="primary"
                  unelevated
                  rounded
                  icon="add"
                  label="新建"
                  @click="openSceneDialog()"
                  size="12px"
                />
              </div>

              <div v-if="projectScenes.length === 0" class="itimo-empty-state-small">
                <q-icon name="landscape" size="48px" color="grey-5" />
                <p class="itimo-empty-text">暂无场景，点击上方按钮添加场景</p>
              </div>

              <div v-else class="itimo-scene-cards">
                <div v-for="scene in projectScenes" :key="scene.id" class="itimo-scene-card">
                  <div class="itimo-scene-card-image">
                    <template v-if="scene.imagePath">
                      <img
                        :src="getImageUrl(scene.imagePath)"
                        :alt="scene.name"
                        class="itimo-scene-img"
                      />
                    </template>
                    <div v-else class="itimo-scene-no-image">未生成</div>
                  </div>
                  <div class="itimo-scene-card-content">
                    <h4 class="itimo-scene-card-name">{{ scene.name }}</h4>
                    <div class="itimo-scene-card-desc">
                      {{ scene.description || '暂无描述' }}
                      <q-tooltip v-if="scene.description" max-width="400px">
                        {{ scene.description }}
                      </q-tooltip>
                    </div>
                    <div class="itimo-scene-card-actions">
                      <q-btn
                        flat
                        dense
                        icon="edit"
                        label="编辑"
                        size="sm"
                        color="primary"
                        @click="openSceneDialog(scene)"
                      />
                      <q-btn
                        flat
                        dense
                        icon="delete"
                        label="删除"
                        size="sm"
                        color="negative"
                        @click="deleteScene(scene.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </q-tab-panel>
            <q-tab-panel name="props" class="itimo-tab-panel">
              <div class="itimo-section-header" style="margin-bottom: 16px">
                <h3 class="itimo-section-title" style="font-size: 1.13rem">项目道具</h3>
                <q-btn
                  color="primary"
                  unelevated
                  rounded
                  icon="add"
                  label="新建"
                  @click="openPropDialog()"
                  size="12px"
                />
              </div>

              <div v-if="projectProps.length === 0" class="itimo-empty-state-small">
                <q-icon name="inventory_2" size="48px" color="grey-5" />
                <p class="itimo-empty-text">暂无道具，点击上方按钮添加道具</p>
              </div>

              <div v-else class="itimo-prop-cards">
                <div v-for="prop in projectProps" :key="prop.id" class="itimo-prop-card">
                  <div class="itimo-prop-card-image">
                    <template v-if="prop.imagePath">
                      <img
                        :src="getImageUrl(prop.imagePath)"
                        :alt="prop.name"
                        class="itimo-prop-img"
                      />
                    </template>
                    <div v-else class="itimo-prop-no-image">未生成</div>
                  </div>
                  <div class="itimo-prop-card-content">
                    <h4 class="itimo-prop-card-name">{{ prop.name }}</h4>
                    <div class="itimo-prop-card-desc">
                      {{ prop.description || '暂无描述' }}
                      <q-tooltip v-if="prop.description" max-width="400px">
                        {{ prop.description }}
                      </q-tooltip>
                    </div>
                    <div class="itimo-prop-card-actions">
                      <q-btn
                        flat
                        dense
                        icon="edit"
                        label="编辑"
                        size="sm"
                        color="primary"
                        @click="openPropDialog(prop)"
                      />
                      <q-btn
                        flat
                        dense
                        icon="delete"
                        label="删除"
                        size="sm"
                        color="negative"
                        @click="deleteProp(prop.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </q-tab-panel>
            <q-tab-panel name="videos" class="itimo-tab-panel">
              <q-banner rounded class="itimo-glass-card itimo-banner-muted">
                合成后的剧集视频将出现在此处（导出剪映等后续对接）
              </q-banner>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </div>
    </div>

    <!-- One-Click Generation Section -->
    <div class="itimo-section">
      <div class="itimo-section-card">
        <div class="itimo-card-header">
          <h2 class="itimo-section-title">一键生成</h2>
        </div>
        <div class="itimo-card-body">
          <!-- Generation Stepper -->
          <div class="itimo-generation-stepper">
            <q-stepper v-model="generationStep" flat horizontal animated class="itimo-stepper">
              <q-step
                :name="1"
                title="小说"
                icon="menu_book"
                :done="generationStep > 1"
                :active="generationStep === 1"
              />
              <q-step
                :name="2"
                title="剧本"
                icon="description"
                :done="generationStep > 2"
                :active="generationStep === 2"
              />
              <q-step
                :name="3"
                title="角色"
                icon="face"
                :done="generationStep > 3"
                :active="generationStep === 3"
              />
              <q-step
                :name="4"
                title="场景"
                icon="landscape"
                :done="generationStep > 4"
                :active="generationStep === 4"
              />
              <q-step
                :name="5"
                title="道具"
                icon="inventory_2"
                :done="generationStep > 5"
                :active="generationStep === 5"
              />
              <q-step
                :name="6"
                title="分镜"
                icon="view_carousel"
                :done="generationStep > 6"
                :active="generationStep === 6"
              />
              <q-step
                :name="7"
                title="视频"
                icon="movie"
                :done="generationStep > 7"
                :active="generationStep === 7"
              />
            </q-stepper>
          </div>

          <!-- Generation Button -->
          <div class="itimo-generation-actions">
            <q-btn
              color="primary"
              unelevated
              rounded
              icon="auto_awesome"
              label="一键生成"
              @click="startOneClickGeneration"
              :loading="isGenerating"
              :disable="isGenerating"
              size="sm"
              class="itimo-btn-generate"
            />
          </div>

          <!-- Generation Logs -->
          <div class="itimo-generation-logs">
            <div class="itimo-logs-header">
              <h3 class="itimo-logs-title">生成日志</h3>
              <div class="itimo-logs-actions">
                <q-btn
                  flat
                  dense
                  icon="clear"
                  label="清空"
                  size="sm"
                  @click="clearLogs"
                  color="grey-7"
                  :disable="generationLogs.length === 0"
                />
                <q-btn
                  flat
                  dense
                  icon="folder_open"
                  label="打开日志文件夹"
                  size="sm"
                  @click="openLogsFolder"
                  color="grey-7"
                />
              </div>
            </div>
            <div class="itimo-logs-content">
              <div v-if="generationLogs.length === 0" class="itimo-logs-empty">
                暂无日志，点击"一键生成"开始生成流程
              </div>
              <div
                v-for="(log, index) in generationLogs"
                :key="index"
                class="itimo-log-item"
                :class="{ 'itimo-log-error': log.type === 'error' }"
              >
                <span class="itimo-log-time">{{ log.time }}</span>
                <span class="itimo-log-message">{{ log.message }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scene Dialog -->
    <q-dialog v-model="showSceneDialog" persistent>
      <q-card class="itimo-glass-card" style="width: min(500px, 92vw)">
        <q-card-section class="row items-center q-gutter-md">
          <q-icon name="landscape" color="primary" size="md" />
          <div class="text-h6">{{ editingSceneId ? '编辑场景' : '新增场景' }}</div>
          <q-space />
          <q-btn flat round icon="close" @click="showSceneDialog = false" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <div class="q-gutter-md">
            <q-input
              v-model="sceneForm.name"
              outlined
              label="场景名称"
              dense
              :rules="[(val) => !!val || '请输入场景名称']"
            />
            <q-input
              v-model="sceneForm.description"
              outlined
              label="场景描述"
              type="textarea"
              rows="4"
              dense
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" @click="showSceneDialog = false" />
          <q-btn
            unelevated
            label="保存"
            color="primary"
            @click="saveSceneFromDialog"
            :disable="!sceneForm.name"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Prop Dialog -->
    <q-dialog v-model="showPropDialog" persistent>
      <q-card class="itimo-glass-card" style="width: min(500px, 92vw)">
        <q-card-section class="row items-center q-gutter-md">
          <q-icon name="inventory_2" color="primary" size="md" />
          <div class="text-h6">{{ editingPropId ? '编辑道具' : '新增道具' }}</div>
          <q-space />
          <q-btn flat round icon="close" @click="showPropDialog = false" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <div class="q-gutter-md">
            <q-input
              v-model="propForm.name"
              outlined
              label="道具名称"
              dense
              :rules="[(val) => !!val || '请输入道具名称']"
            />
            <q-input
              v-model="propForm.description"
              outlined
              label="道具描述"
              type="textarea"
              rows="4"
              dense
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" @click="showPropDialog = false" />
          <q-btn
            unelevated
            label="保存"
            color="primary"
            @click="savePropFromDialog"
            :disable="!propForm.name"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useWorkspaceStore } from 'src/stores/workspace-store';
import { getElectronApi } from 'src/services/native-fs';
import {
  saveEpisodeManifestFromPath,
  loadEpisodeManifestFromPath,
} from 'src/db/project';
import CharacterDialog from 'src/components/character/CharacterDialog.vue';
import type { EpisodeManifest } from 'src/core/types/episode';
import type { Character } from 'src/core/types/project';

const route = useRoute();
const workspace = useWorkspaceStore();
const $q = useQuasar();

const tab = ref<'characters' | 'scenes' | 'props' | 'videos'>('characters');
const editingEpisodeId = ref<string | null>(null);
const editingEpisodeNumber = ref<number | null>(null);

// Scene dialog state
const showSceneDialog = ref(false);
const editingSceneId = ref<string | null>(null);
const sceneForm = ref({
  name: '',
  description: '',
});

// Prop dialog state
const showPropDialog = ref(false);
const editingPropId = ref<string | null>(null);
const propForm = ref({
  name: '',
  description: '',
});

// One-click generation state
const generationStep = ref(0);
const isGenerating = ref(false);
const generationLogs = ref<Array<{ time: string; message: string; type: 'info' | 'error' }>>([]);

interface GenerationStepConfig {
  model: string;
  prompt: string;
}

const generationConfig = ref<{
  novel: GenerationStepConfig;
  script: GenerationStepConfig;
  character: GenerationStepConfig;
  scene: GenerationStepConfig;
  prop: GenerationStepConfig;
  storyboard: GenerationStepConfig;
  video: GenerationStepConfig;
}>({
  novel: { model: '', prompt: '' },
  script: { model: '', prompt: '' },
  character: { model: '', prompt: '' },
  scene: { model: '', prompt: '' },
  prop: { model: '', prompt: '' },
  storyboard: { model: '', prompt: '' },
  video: { model: '', prompt: '' },
});

const projectCharacters = computed(() => workspace.characters);
const projectScenes = computed(() => workspace.scenes);
const projectProps = computed(() => workspace.props);

function formatCharacterDescription(character: Character): string {
  const parts: string[] = [];

  if (character.gender || character.age) {
    const genderAge = [character.gender, character.age].filter(Boolean).join('，');
    parts.push(genderAge);
  }

  if (character.height || character.weight) {
    const physique = [character.height, character.weight].filter(Boolean).join('，');
    parts.push(physique);
  }

  if (character.bodyType) {
    parts.push(`体型${character.bodyType}`);
  }

  if (character.facialFeatures) {
    parts.push(character.facialFeatures);
  }

  if (character.identity) {
    parts.push(`身份是${character.identity}`);
  }

  if (character.personality) {
    parts.push(`性格${character.personality}`);
  }

  if (character.speakingStyle) {
    parts.push(`说话方式${character.speakingStyle}`);
  }

  if (character.interests) {
    parts.push(`兴趣特长：${character.interests}`);
  }

  return parts.join('，') || '暂无描述';
}

function getCharacterImageUrl(relativePath: string): string {
  if (!workspace.rootPath) return '';
  const api = getElectronApi();
  if (!api) return '';

  // Use toLocalFileUrl from composable
  const fullPath = `${workspace.rootPath}/${relativePath}`;
  return `file://${fullPath}`;
}

function getImageUrl(relativePath: string): string {
  if (!workspace.rootPath) return '';
  const api = getElectronApi();
  if (!api) return '';

  const fullPath = `${workspace.rootPath}/${relativePath}`;
  return `file://${fullPath}`;
}

function openSceneDialog(scene?: { id: string; name: string; description: string }) {
  editingSceneId.value = scene?.id || null;
  sceneForm.value = {
    name: scene?.name || '',
    description: scene?.description || '',
  };
  showSceneDialog.value = true;
}

function saveSceneFromDialog() {
  if (!sceneForm.value.name) {
    $q.notify({
      type: 'warning',
      message: '场景名称不能为空',
      timeout: 2000,
    });
    return;
  }

  const sceneData: { id?: string; name: string; description: string } = {
    name: sceneForm.value.name,
    description: sceneForm.value.description,
  };
  if (editingSceneId.value) {
    sceneData.id = editingSceneId.value;
  }

  void saveScene(sceneData);
  showSceneDialog.value = false;
}

function openPropDialog(prop?: { id: string; name: string; description: string }) {
  editingPropId.value = prop?.id || null;
  propForm.value = {
    name: prop?.name || '',
    description: prop?.description || '',
  };
  showPropDialog.value = true;
}

function savePropFromDialog() {
  if (!propForm.value.name) {
    $q.notify({
      type: 'warning',
      message: '道具名称不能为空',
      timeout: 2000,
    });
    return;
  }

  const propData: { id?: string; name: string; description: string } = {
    name: propForm.value.name,
    description: propForm.value.description,
  };
  if (editingPropId.value) {
    propData.id = editingPropId.value;
  }

  void saveProp(propData);
  showPropDialog.value = false;
}

async function saveScene(sceneData: { id?: string; name: string; description: string }) {
  if (!workspace.projectId) return;

  try {
    if (sceneData.id) {
      await workspace.updateScene(sceneData.id, {
        name: sceneData.name,
        description: sceneData.description,
      });
    } else {
      await workspace.addScene({
        name: sceneData.name,
        description: sceneData.description,
        imagePath: undefined,
        promptLangEn: undefined,
        promptThemeId: undefined,
      });
    }

    $q.notify({
      type: 'positive',
      message: sceneData.id ? '场景已更新' : '场景已添加',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: `保存场景失败: ${msg}`,
      timeout: 1000,
      position: 'top',
    });
  }
}

async function saveProp(propData: { id?: string; name: string; description: string }) {
  if (!workspace.projectId) return;

  try {
    if (propData.id) {
      await workspace.updateProp(propData.id, {
        name: propData.name,
        description: propData.description,
      });
    } else {
      await workspace.addProp({
        name: propData.name,
        description: propData.description,
        imagePath: undefined,
        promptLangEn: undefined,
        promptThemeId: undefined,
      });
    }

    $q.notify({
      type: 'positive',
      message: propData.id ? '道具已更新' : '道具已添加',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: `保存道具失败: ${msg}`,
      timeout: 1000,
      position: 'top',
    });
  }
}

function deleteScene(sceneId: string) {
  if (!workspace.projectId) return;

  $q.dialog({
    title: '确认删除',
    message: '确定要删除该场景吗？此操作无法撤销',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await workspace.deleteScene(sceneId);
        $q.notify({ type: 'positive', message: '场景已删除' });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        $q.notify({
          type: 'negative',
          message: `删除场景失败: ${msg}`,
          timeout: 1000,
          position: 'top',
        });
      }
    })();
  });
}

function deleteProp(propId: string) {
  if (!workspace.projectId) return;

  $q.dialog({
    title: '确认删除',
    message: '确定要删除该道具吗？此操作无法撤销',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await workspace.deleteProp(propId);
        $q.notify({ type: 'positive', message: '道具已删除' });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        $q.notify({
          type: 'negative',
          message: `删除道具失败: ${msg}`,
          timeout: 1000,
          position: 'top',
        });
      }
    })();
  });
}

async function addEpisode() {
  if (!workspace.manifest || !workspace.rootPath) return;

  try {
    const api = getElectronApi();
    if (!api) {
      $q.notify({ type: 'warning', message: '仅在 Electron 桌面端可创建分集' });
      return;
    }

    const episodes = [...(workspace.manifest?.episodes ?? [])];
    const nextOrder = episodes.length + 1;
    const episodeFolder = `ep-${String(nextOrder).padStart(3, '0')}`;

    const episodeFolderPath = await api.pathJoin(workspace.rootPath, 'episodes', episodeFolder);
    await api.fsEnsureDir(episodeFolderPath);

    const episodeManifest: EpisodeManifest = {
      id: `ep_${Date.now()}`,
      projectId: workspace.manifest.id,
      version: 1,
      title: '默认标题',
      order: nextOrder,
      script: [{ id: crypto.randomUUID(), heading: '第一场', body: '' }],
      updatedAt: new Date().toISOString(),
    };

    await saveEpisodeManifestFromPath(workspace.rootPath, episodeFolder, episodeManifest);

    const newEpisodeRef: (typeof episodes)[0] = {
      id: episodeManifest.id,
      title: '默认标题',
      order: nextOrder,
      folder: episodeFolder,
      episodeNumber: `第${nextOrder}集`,
      updatedAt: new Date().toISOString(),
    };

    workspace.patchManifest({
      episodes: [...episodes, newEpisodeRef],
    });
    // patchManifest 已经内部调用了 saveToDb，无需再次保存

    $q.notify({
      type: 'positive',
      timeout: 1000,
      message: '分集已创建',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: `创建分集失败: ${msg}`,
      timeout: 1000,
      position: 'top',
    });
  }
}

function deleteEpisode(episodeId: string) {
  if (!workspace.manifest || !workspace.rootPath) return;

  const episodes = workspace.manifest.episodes ?? [];
  const episodeToDelete = episodes.find((ep) => ep.id === episodeId);

  if (!episodeToDelete) {
    $q.notify({ type: 'negative', message: '未找到分集' });
    return;
  }

  $q.dialog({
    title: '确认删除',
    message: `确定要删除分集「${episodeToDelete.title}」吗？此操作无法撤销。`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        const api = getElectronApi();
        if (!api || !workspace.rootPath) {
          $q.notify({ type: 'warning', message: '仅在 Electron 桌面端可删除分集' });
          return;
        }

        const episodeFolderPath = await api.pathJoin(
          workspace.rootPath,
          'episodes',
          episodeToDelete.folder,
        );
        if (await api.fsExists(episodeFolderPath)) {
          await api.fsRemove(episodeFolderPath, { recursive: true });
        }

        const updatedEpisodes = episodes.filter((ep) => ep.id !== episodeId);
        workspace.patchManifest({
          episodes: updatedEpisodes,
        });
        // patchManifest 已经内部调用了 saveToDb，无需再次保存

        $q.notify({ type: 'positive', message: '分集已删除' });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        $q.notify({
          type: 'negative',
          message: `删除分集失败: ${msg}`,
          timeout: 1000,
          position: 'top',
        });
      }
    })();
  });
}

function startEditEpisodeNumber(episodeId: string, episodeNumber: string) {
  editingEpisodeId.value = episodeId;
  const match = episodeNumber.match(/\d+/);
  editingEpisodeNumber.value = match ? parseInt(match[0], 10) : 1;
}

function cancelEditEpisodeNumber() {
  editingEpisodeId.value = null;
  editingEpisodeNumber.value = null;
}

async function confirmEditEpisodeNumber(
  episodeId: string,
  episode: { id: string; folder: string; episodeNumber: string },
): Promise<void> {
  if (!workspace.manifest || !workspace.rootPath || editingEpisodeNumber.value === null) return;

  try {
    const api = getElectronApi();
    if (!api) {
      $q.notify({ type: 'warning', message: '仅在 Electron 桌面端可编辑集数' });
      return;
    }

    const newEpisodeNumber = editingEpisodeNumber.value;
    const episodes = workspace.manifest.episodes ?? [];

    const isDuplicate = episodes.some(
      (ep) => ep.id !== episodeId && ep.episodeNumber === `第${newEpisodeNumber}集`,
    );

    if (isDuplicate) {
      $q.notify({
        type: 'negative',
        message: '集数已存在，请选择其他集数',
        timeout: 1000,
        position: 'top',
      });
      return;
    }

    const newFolder = `ep-${String(newEpisodeNumber).padStart(3, '0')}`;
    const oldFolder = episode.folder;

    const oldFolderPath = await api.pathJoin(workspace.rootPath, 'episodes', oldFolder);
    const newFolderPath = await api.pathJoin(workspace.rootPath, 'episodes', newFolder);

    if (await api.fsExists(oldFolderPath)) {
      if (await api.fsExists(newFolderPath)) {
        $q.notify({
          type: 'negative',
          message: '目标文件夹已存在',
          timeout: 1000,
          position: 'top',
        });
        return;
      }

      await api.fsRename(oldFolderPath, newFolderPath);

      const episodeManifest = await loadEpisodeManifestFromPath(workspace.rootPath, newFolder);
      episodeManifest.order = newEpisodeNumber;
      await saveEpisodeManifestFromPath(workspace.rootPath, newFolder, episodeManifest);
    }

    const updatedEpisodes = episodes.map((ep) => {
      if (ep.id === episodeId) {
        return {
          ...ep,
          folder: newFolder,
          episodeNumber: `第${newEpisodeNumber}集`,
          order: newEpisodeNumber,
        };
      }
      return ep;
    });

    workspace.patchManifest({
      episodes: updatedEpisodes,
    });
    // patchManifest 已经内部调用了 saveToDb，无需再次保存

    $q.notify({ type: 'positive', message: '集数已更新' });
    cancelEditEpisodeNumber();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: `更新集数失败: ${msg}`,
      timeout: 1000,
      position: 'top',
    });
  }
}

function openCharacterDialog(character?: Character) {
  $q.dialog({
    component: CharacterDialog,
    componentProps: {
      character,
    },
  }).onOk((characterData: Character) => {
    void saveCharacter(characterData);
  });
}

async function saveCharacter(characterData: Character) {
  if (!workspace.projectId) return;

  try {
    const existing = workspace.characters.find((c) => c.id === characterData.id);
    if (existing) {
      await workspace.updateCharacter(characterData.id, {
        name: characterData.name,
        description: characterData.description,
        role: characterData.role,
        gender: characterData.gender,
        age: characterData.age,
        height: characterData.height,
        weight: characterData.weight,
        bodyType: characterData.bodyType,
        facialFeatures: characterData.facialFeatures,
        identity: characterData.identity,
        personality: characterData.personality,
        speakingStyle: characterData.speakingStyle,
        interests: characterData.interests,
        imagePath: characterData.imagePath,
        promptLangEn: characterData.promptLangEn,
        promptThemeId: characterData.promptThemeId,
      });
    } else {
      await workspace.addCharacter({
        name: characterData.name,
        description: characterData.description,
        role: characterData.role,
        gender: characterData.gender,
        age: characterData.age,
        height: characterData.height,
        weight: characterData.weight,
        bodyType: characterData.bodyType,
        facialFeatures: characterData.facialFeatures,
        identity: characterData.identity,
        personality: characterData.personality,
        speakingStyle: characterData.speakingStyle,
        interests: characterData.interests,
        imagePath: characterData.imagePath,
        promptLangEn: characterData.promptLangEn,
        promptThemeId: characterData.promptThemeId,
      });
    }

    $q.notify({
      type: 'positive',
      message: existing ? '角色已更新' : '角色已添加',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: `保存角色失败: ${msg}`,
      timeout: 1000,
      position: 'top',
    });
  }
}

function deleteCharacter(characterId: string) {
  if (!workspace.projectId) return;

  $q.dialog({
    title: '确认删除',
    message: '确定要删除该角色吗？此操作无法撤销',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await workspace.deleteCharacter(characterId);
        $q.notify({ type: 'positive', message: '角色已删除' });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        $q.notify({
          type: 'negative',
          message: `删除角色失败: ${msg}`,
          timeout: 1000,
          position: 'top',
        });
      }
    })();
  });
}

function addLog(message: string, type: 'info' | 'error' = 'info') {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  generationLogs.value.push({ time, message, type });

  // Auto scroll to bottom
  void nextTick(() => {
    const logsContent = document.querySelector('.itimo-logs-content');
    if (logsContent) {
      logsContent.scrollTop = logsContent.scrollHeight;
    }
  });
}

function clearLogs() {
  generationLogs.value = [];
}

async function openLogsFolder() {
  if (!workspace.rootPath) {
    $q.notify({
      type: 'warning',
      message: '项目路径未设置',
      timeout: 1000,
    });
    return;
  }

  try {
    const api = getElectronApi();
    if (!api) {
      $q.notify({
        type: 'warning',
        message: '仅在 Electron 桌面端可打开文件夹',
        timeout: 1000,
      });
      return;
    }

    const logFolder = await api.pathJoin(workspace.rootPath, 'logs');

    // Ensure logs folder exists
    await api.fsEnsureDir(logFolder);

    // Open folder in system file explorer
    await api.shellOpenPath(logFolder);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({
      type: 'negative',
      message: `打开文件夹失败: ${msg}`,
      timeout: 1000,
    });
  }
}

async function saveLogsToFile() {
  if (!workspace.rootPath || generationLogs.value.length === 0) return;

  try {
    const api = getElectronApi();
    if (!api) return;

    const logFolder = await api.pathJoin(workspace.rootPath, 'logs');
    await api.fsEnsureDir(logFolder);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = await api.pathJoin(logFolder, `generation-${timestamp}.log`);

    const logContent = generationLogs.value
      .map((log) => `[${log.time}] ${log.type.toUpperCase()}: ${log.message}`)
      .join('\n');

    await api.fsWriteTextFile(logFile, logContent);
    addLog(`日志已保存到: logs/generation-${timestamp}.log`);
  } catch (e) {
    console.error('Failed to save logs:', e);
  }
}

async function startOneClickGeneration() {
  if (isGenerating.value) return;

  isGenerating.value = true;
  generationStep.value = 0;
  generationLogs.value = [];

  addLog('开始一键生成流程');

  try {
    // Step 1: Novel Generation
    generationStep.value = 1;
    addLog('开始生成小说...');
    await simulateGeneration('小说', generationConfig.value.novel);

    // Step 2: Script Generation
    generationStep.value = 2;
    addLog('开始生成剧本...');
    await simulateGeneration('剧本', generationConfig.value.script);

    // Step 3: Character Generation
    generationStep.value = 3;
    addLog('开始生成角色...');
    await simulateGeneration('角色', generationConfig.value.character);

    // Step 4: Scene Generation
    generationStep.value = 4;
    addLog('开始生成场景...');
    await simulateGeneration('场景', generationConfig.value.scene);

    // Step 5: Prop Generation
    generationStep.value = 5;
    addLog('开始生成道具...');
    await simulateGeneration('道具', generationConfig.value.prop);

    // Step 6: Storyboard Generation
    generationStep.value = 6;
    addLog('开始生成分镜...');
    await simulateGeneration('分镜', generationConfig.value.storyboard);

    // Step 7: Video Generation
    generationStep.value = 7;
    addLog('开始生成视频...');
    await simulateGeneration('视频', generationConfig.value.video);

    generationStep.value = 8;
    addLog('一键生成流程完成！');
    await saveLogsToFile();

    $q.notify({
      type: 'positive',
      message: '一键生成完成',
      timeout: 1000,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    addLog(`生成失败: ${msg}`, 'error');
    $q.notify({
      type: 'negative',
      message: `生成失败: ${msg}`,
      timeout: 2000,
    });
  } finally {
    isGenerating.value = false;
  }
}

async function simulateGeneration(type: string, config: GenerationStepConfig): Promise<void> {
  // TODO: Replace with actual generation logic
  return new Promise((resolve) => {
    setTimeout(() => {
      addLog(`${type}生成完成 (模型: ${config.model || '未设置'})`);
      resolve();
    }, 2000);
  });
}
</script>

<style scoped>
.itimo-project-hub {
  padding: 0;
  background: var(--itimo-bg-primary);
}

.itimo-project-header {
  padding-top: 50px;
  padding-left: 50px;
  max-width: 1180px;
  margin: 0 auto;
}

.itimo-project-info {
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.itimo-project-title {
  font-family: var(--itimo-font-display);
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--itimo-text-primary);
  letter-spacing: -0.5px;
}

.itimo-project-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.itimo-meta-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.itimo-meta-label {
  color: var(--itimo-text-secondary);
  font-size: 0.88rem;
  font-weight: 400;
}

.itimo-meta-value {
  color: var(--itimo-text-secondary);
  font-weight: 400;
  font-size: 0.95rem;
}

.itimo-section {
  padding: 0 32px;
  max-width: 1180px;
  margin: 0 auto 48px auto;
  box-shadow: none;
}

.itimo-section-card {
  background: var(--itimo-bg-secondary);
  border: 1px solid var(--itimo-surface-border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: none;
}

.itimo-card-header {
  padding: 16px;
  border-bottom: 1px solid var(--itimo-surface-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.itimo-card-body {
  padding: 16px;
}

.itimo-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.itimo-section-title {
  font-family: var(--itimo-font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--itimo-text-primary);
  margin: 0;
  letter-spacing: -0.3px;
}

.itimo-btn-add-episode {
  padding: 10px 20px;
  font-weight: 600;
  border-radius: 8px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.itimo-btn-add-episode:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.itimo-episodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.itimo-episode-card {
  transition: transform 0.18s ease;
  margin-top: 12px;
}

.itimo-episode-card:hover {
  transform: translateY(-2px);
}

.itimo-card-elevated {
  background: var(--itimo-bg-secondary);
  border: 1px solid var(--itimo-surface-border);
  box-shadow: none;
  border-radius: 12px;
  overflow: hidden;
}

.itimo-card-header-section {
  padding: 16px;
  background: transparent;
}

.itimo-episode-title {
  font-family: var(--itimo-font-display);
  font-size: 1.13rem;
  font-weight: 700;
  color: var(--itimo-text-primary);
  letter-spacing: -0.3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.itimo-card-content {
  padding: 16px;
}

.itimo-episode-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.itimo-episode-preview-label {
  font-size: 0.75rem;
  color: var(--itimo-text-secondary);
}

.itimo-episode-preview-text {
  font-size: 0.88rem;
  color: var(--itimo-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}

.itimo-episode-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.itimo-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 0.88rem;
}

.itimo-progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.itimo-progress-bar {
  flex: 1;
  height: 4px;
}

.itimo-progress-text {
  font-size: 0.75rem;
  color: var(--itimo-text-secondary);
  min-width: 30px;
}

.itimo-card-actions-row {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--itimo-surface-border);
  gap: 8px;
}

.itimo-episode-number-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.itimo-episode-number {
  font-size: 0.88rem;
  color: var(--itimo-text-secondary);
  min-width: 60px;
}

.itimo-episode-number-edit {
  display: flex;
  align-items: center;
  gap: 4px;
}

.itimo-episode-number-prefix,
.itimo-episode-number-suffix {
  color: var(--itimo-text-secondary);
  font-size: 0.88rem;
}

.itimo-episode-number-input {
  width: 60px;
}

.itimo-btn-primary {
  padding: 8px 16px;
  font-weight: 600;
  border-radius: 8px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.itimo-btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.itimo-tabs {
  margin-bottom: 16px;
  border-bottom: 1px solid var(--itimo-surface-border);
}

.itimo-tab-panels {
  background: transparent;
}

.itimo-tab-panel {
  padding: 0;
}

.itimo-empty-state-small {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: var(--itimo-text-secondary);
}

.itimo-empty-text {
  margin-top: 12px;
  font-size: 0.88rem;
  font-weight: 500;
}

.itimo-character-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.itimo-character-card {
  display: flex;
  gap: 16px;
  background: var(--itimo-bg-primary);
  border: 1px solid var(--itimo-surface-border);
  border-radius: 12px;
  padding: 16px;
  transition: box-shadow 0.18s ease;
}

.itimo-character-card:hover {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.itimo-character-card-image {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--itimo-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.itimo-character-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.itimo-character-no-image {
  color: var(--itimo-text-secondary);
  font-size: 0.88rem;
}

.itimo-character-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.itimo-character-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.itimo-character-card-name {
  font-size: 1.13rem;
  font-weight: 600;
  color: var(--itimo-text-primary);
  margin: 0;
}

.itimo-character-card-desc {
  font-size: 0.88rem;
  color: var(--itimo-text-secondary);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  cursor: help;
}

.itimo-character-card-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.itimo-scene-cards,
.itimo-prop-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.itimo-scene-card,
.itimo-prop-card {
  display: flex;
  gap: 12px;
  background: var(--itimo-bg-primary);
  border: 1px solid var(--itimo-surface-border);
  border-radius: 12px;
  padding: 16px;
  transition: box-shadow 0.18s ease;
}

.itimo-scene-card:hover,
.itimo-prop-card:hover {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.itimo-scene-card-image,
.itimo-prop-card-image {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--itimo-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.itimo-scene-img,
.itimo-prop-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.itimo-scene-no-image,
.itimo-prop-no-image {
  color: var(--itimo-text-secondary);
  font-size: 0.88rem;
}

.itimo-scene-card-content,
.itimo-prop-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.itimo-scene-card-name,
.itimo-prop-card-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--itimo-text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.itimo-scene-card-desc,
.itimo-prop-card-desc {
  font-size: 0.88rem;
  color: var(--itimo-text-secondary);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  cursor: help;
}

.itimo-scene-card-actions,
.itimo-prop-card-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.itimo-banner-muted {
  background: var(--itimo-bg-secondary);
  border: 1px solid var(--itimo-surface-border);
  color: var(--itimo-text-secondary);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  font-weight: 500;
}

.itimo-generation-config {
  margin-bottom: 24px;
}

.itimo-config-table {
  border: 1px solid var(--itimo-surface-border);
  border-radius: 8px;
  overflow: hidden;
}

.itimo-config-header {
  display: flex;
  background: var(--itimo-bg-secondary);
  border-bottom: 1px solid var(--itimo-surface-border);
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--itimo-text-primary);
  padding: 12px 0;
}

.itimo-config-row {
  display: flex;
  border-bottom: 1px solid var(--itimo-surface-border);
  background: var(--itimo-bg-primary);
  align-items: center;
  padding: 8px 0;
}

.itimo-config-row:last-child {
  border-bottom: none;
}

.itimo-config-cell {
  padding: 0 12px;
  display: flex;
  align-items: center;
  font-size: 0.88rem;
  color: var(--itimo-text-primary);
}

.itimo-generation-stepper {
  margin-bottom: 24px;
}

.itimo-stepper {
  background: transparent;
  box-shadow: none;
}

.itimo-generation-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.itimo-btn-generate {
  padding: 12px 32px;
  font-weight: 600;
  font-size: 1rem;
}

.itimo-generation-logs {
  margin-top: 24px;
  border-top: 1px solid var(--itimo-surface-border);
  padding-top: 16px;
}

.itimo-logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.itimo-logs-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--itimo-text-primary);
  margin: 0;
}

.itimo-logs-actions {
  display: flex;
  gap: 8px;
}

.itimo-logs-content {
  background: var(--itimo-bg-primary);
  border: 1px solid var(--itimo-surface-border);
  border-radius: 8px;
  padding: 12px;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.itimo-logs-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 180px;
  color: var(--itimo-text-secondary);
  font-size: 0.88rem;
}

.itimo-log-item {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  font-size: 0.88rem;
  font-family: monospace;
}

.itimo-log-time {
  color: var(--itimo-text-secondary);
  min-width: 70px;
}

.itimo-log-message {
  color: var(--itimo-text-primary);
  flex: 1;
}

.itimo-log-error .itimo-log-message {
  color: var(--q-negative);
}
</style>
