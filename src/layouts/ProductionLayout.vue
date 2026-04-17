<template>
  <q-page class="itimo-production-layout" style="padding-top: 10px">
    <div class="itimo-production-container">
      <!-- Left Sidebar Navigation -->
      <aside class="itimo-production-sidebar">
        <div class="itimo-sidebar-header">
          <q-btn flat round dense icon="arrow_back" @click="goBack" class="q-mb-md">
            <q-tooltip>返回项目</q-tooltip>
          </q-btn>
          <h3 class="itimo-sidebar-title">导航</h3>
        </div>
        <nav class="itimo-sidebar-nav">
          <a
            v-for="step in steps"
            :key="step.id"
            :href="`#${step.id}`"
            class="itimo-nav-item"
            :class="{ 'itimo-nav-item--active': isActive(step.id) }"
            @click.prevent="navigateToStep(step.id)"
          >
            <q-icon :name="step.icon" class="itimo-nav-icon" />
            <span class="itimo-nav-label">{{ step.label }}</span>
            <span v-if="getStepCount(step.id)" class="itimo-nav-badge">{{
              getStepCount(step.id)
            }}</span>
          </a>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <main class="itimo-production-main">
        <router-view />
      </main>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkspaceStore } from 'src/stores/workspace-store';
import { PRODUCTION_STEPS, type ProductionStepId } from 'src/core/types';

const route = useRoute();
const router = useRouter();
const workspace = useWorkspaceStore();

const steps = PRODUCTION_STEPS;

const projectId = computed(() => String(route.params.projectId));
const episodeId = computed(() => String(route.params.episodeId));

function navigateToStep(step: ProductionStepId) {
  void router.push({
    name: `produce-${step}`,
    params: { projectId: projectId.value, episodeId: episodeId.value },
  });
}

function isActive(step: ProductionStepId) {
  return route.name === `produce-${step}`;
}

function goBack() {
  void router.push({
    name: 'project-hub',
    params: { projectId: projectId.value },
  });
}

// Get step counts from workspace store
function getStepCount(step: ProductionStepId): number {
  switch (step) {
    case 'characters':
      return workspace.characters.length;
    case 'props':
      return workspace.props.length;
    case 'scenes':
      return workspace.scenes.length;
    default:
      return 0;
  }
}
</script>
