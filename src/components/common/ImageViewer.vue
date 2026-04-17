<template>
  <div v-if="imagePath" class="itimo-image-viewer">
    <q-btn
      round
      dense
      flat
      icon="zoom_in"
      class="itimo-zoom-btn"
      @click.stop="showViewer = true"
    >
      <q-tooltip>查看大图</q-tooltip>
    </q-btn>

    <q-dialog
      v-model="showViewer"
      maximized
      transition-show="fade"
      transition-hide="fade"
      class="itimo-image-viewer-dialog"
    >
      <div class="itimo-viewer-container" @click="showViewer = false">
        <q-btn
          round
          dense
          flat
          icon="close"
          color="white"
          size="lg"
          class="itimo-viewer-close-btn"
          @click.stop="showViewer = false"
        >
          <q-tooltip>关闭</q-tooltip>
        </q-btn>

        <div class="itimo-viewer-content" @click.stop>
          <img :src="imagePath" :alt="alt" class="itimo-viewer-image" />
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  imagePath: string;
  alt?: string;
}>();

const showViewer = ref(false);
</script>

<style scoped>
.itimo-image-viewer {
  position: relative;
}

.itimo-zoom-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.4) !important;
  color: white !important;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 1;
}

.itimo-image-viewer:hover .itimo-zoom-btn {
  opacity: 1;
}

.itimo-zoom-btn:hover {
  background: rgba(0, 0, 0, 0.6) !important;
}

.itimo-viewer-container {
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
  position: relative;
}

.itimo-viewer-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(4px);
}

.itimo-viewer-close-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.itimo-viewer-content {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.itimo-viewer-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}
</style>
