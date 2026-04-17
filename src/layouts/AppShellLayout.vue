<template>
  <q-layout view="hHh lpR fFf" class="fit">
    <q-header elevated class="itimo-header">
      <q-toolbar class="q-px-md q-py-xs">
        <q-btn
          flat
          round
          dense
          icon="movie_filter"
          :to="{ name: 'home' }"
          aria-label="home"
          class="itimo-text-primary"
        />
        <q-toolbar-title class="text-weight-bold">
          <span class="itimo-brand-text">itimoAiDrama</span>
          <span class="text-caption itimo-text-secondary q-ml-sm hidden-xs">本地AI短剧助手</span>
        </q-toolbar-title>

        <q-btn
          flat
          dense
          no-caps
          rounded
          icon="face"
          class="q-mr-xs itimo-text-primary"
          label="角色库"
          @click="openLib('characters')"
        />
        <q-btn
          flat
          dense
          no-caps
          rounded
          icon="landscape"
          class="q-mr-xs itimo-text-primary"
          label="场景库"
          @click="openLib('scenes')"
        />
        <q-btn
          flat
          dense
          no-caps
          rounded
          icon="inventory_2"
          class="q-mr-sm itimo-text-primary"
          label="道具库"
          @click="openLib('props')"
        />

        <q-btn
          flat
          round
          dense
          icon="settings"
          aria-label="设置"
          class="itimo-text-primary"
          @click="toggleSettings"
        />
      </q-toolbar>
    </q-header>

    <q-page-container class="q-pa-none">
      <router-view :key="routeKey" />
    </q-page-container>

    <GlobalLibraryDialog v-model="libOpen" :kind="libKind" />
    <SettingsDialog v-model="settingsOpen" />
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import GlobalLibraryDialog from 'src/components/library/GlobalLibraryDialog.vue';
import SettingsDialog from 'src/components/settings/SettingsDialog.vue';
import type { GlobalLibraryKind } from 'src/services/library-paths';

const route = useRoute();

const routeKey = computed(() => String(route.name ?? route.path));

function toggleSettings() {
  settingsOpen.value = true;
}

const libOpen = ref(false);
const libKind = ref<GlobalLibraryKind>('characters');
const settingsOpen = ref(false);

function openLib(k: GlobalLibraryKind) {
  libKind.value = k;
  libOpen.value = true;
}
</script>
