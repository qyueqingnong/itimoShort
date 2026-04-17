<template>
  <q-layout view="hHh lpR fFf" class="fit">
    <q-header elevated class="itimo-header" :class="headerTone">
      <q-toolbar class="q-px-md" :class="headerTone">
        <q-btn flat round dense icon="home" to="/" aria-label="返回主页" />
        <q-chip
          v-if="workspace.rootPath"
          dense
          outline
          :color="$q.dark.isActive ? 'white' : 'grey-8'"
          :text-color="$q.dark.isActive ? 'white' : 'grey-9'"
          icon="folder"
          class="q-ml-md"
        >
          {{ shortPath(workspace.rootPath) }}
        </q-chip>
      </q-toolbar>
    </q-header>

    <q-page-container style="padding: 0">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useWorkspaceStore } from 'src/stores/workspace-store';
import { useProjectsStore } from 'src/stores/projects-store';

const route = useRoute();
const $q = useQuasar();

const headerTone = computed(() => ($q.dark.isActive ? 'text-white' : 'text-grey-9'));
const workspace = useWorkspaceStore();
const projects = useProjectsStore();

function shortPath(p: string) {
  if (p.length <= 42) return p;
  return `…${p.slice(-40)}`;
}

watch(
  () => route.params.projectId,
  async (pid) => {
    if (typeof pid !== 'string') return;
    if (projects.items.length === 0) {
      await projects.refresh();
    }
    const entry = projects.items.find((p) => p.id === pid);
    if (!entry) {
      $q.notify({ type: 'negative', message: '未找到项目，请从主页刷新列表。' });
      return;
    }
    try {
      await workspace.loadFromDisk(entry.rootPath);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      $q.notify({ type: 'negative', message: msg });
    }
  },
  { immediate: true },
);
</script>
