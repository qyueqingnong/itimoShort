<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card class="itimo-library-dialog itimo-glass-card" style="width: min(520px, 92vw)">
      <q-card-section class="row items-center q-gutter-sm">
        <q-icon :name="icon" color="primary" size="md" />
        <div class="column">
          <div class="text-h6">{{ title }}</div>
          <div class="text-caption text-grey-5 text-no-wrap ellipsis" style="max-width: 420px">
            {{ folderPath || '…' }}
          </div>
        </div>
        <q-space />
        <q-btn flat round icon="close" @click="emit('update:modelValue', false)" />
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-sm scroll" style="max-height: min(62vh, 560px)">
        <div v-if="!electron" class="text-grey-5 q-pa-md">{{ browserHint }}</div>
        <div v-else-if="loading" class="flex flex-center q-pa-xl">
          <q-spinner color="primary" size="2em" />
        </div>
        <div v-else-if="images.length === 0" class="text-grey-5 q-pa-md">{{ emptyText }}</div>
        <div v-else class="row q-col-gutter-xs">
          <div v-for="img in images" :key="img.fullPath" class="col-4 col-sm-3">
            <q-img :src="toLocalFileUrl(img.fullPath)" ratio="1" class="rounded-borders" />
            <div class="text-caption text-grey-5 ellipsis q-mt-xs" :title="img.name">
              {{ img.name }}
            </div>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="between">
        <q-btn
          flat
          icon="folder_open"
          color="secondary"
          :label="openFolderLabel"
          @click="revealFolder"
        />
        <q-btn flat :label="closeLabel" color="primary" @click="emit('update:modelValue', false)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { GlobalLibraryKind } from 'src/services/library-paths';
import { ensureGlobalLibraryDir } from 'src/services/library-paths';
import { listImageFilesInDir, type ImageFileEntry } from 'src/services/list-images';
import { getElectronApi } from 'src/services/native-fs';
import { toLocalFileUrl } from 'src/composables/use-local-file-url';

const props = defineProps<{
  modelValue: boolean;
  kind: GlobalLibraryKind;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const $q = useQuasar();

const loading = ref(false);
const folderPath = ref('');
const images = ref<ImageFileEntry[]>([]);

const electron = computed(() => !!getElectronApi());

const title = computed(() => {
  if (props.kind === 'characters') return '角色库';
  if (props.kind === 'scenes') return '场景库';
  return '道具库';
});

const icon = computed(() =>
  props.kind === 'characters' ? 'face' : props.kind === 'scenes' ? 'landscape' : 'inventory_2',
);

const emptyText = computed(() => '暂无资源');
const closeLabel = computed(() => '关闭');
const openFolderLabel = computed(() => '打开文件夹');
const browserHint = computed(() => '仅在桌面端可浏览本地资源库目录。');

async function load() {
  const api = getElectronApi();
  if (!api) return;
  loading.value = true;
  try {
    const dir = await ensureGlobalLibraryDir(props.kind);
    folderPath.value = dir;
    images.value = await listImageFilesInDir(dir);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $q.notify({ type: 'negative', message: msg });
  } finally {
    loading.value = false;
  }
}

async function revealFolder() {
  const api = getElectronApi();
  if (!folderPath.value || !api) return;
  const err = await api.shellOpenPath(folderPath.value);
  if (err) {
    $q.notify({ type: 'warning', message: err });
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) void load();
  },
);

watch(
  () => props.kind,
  () => {
    if (props.modelValue) void load();
  },
);
</script>

<style scoped>
.itimo-library-dialog {
  max-height: min(88vh, 720px);
  display: flex;
  flex-direction: column;
}
</style>
