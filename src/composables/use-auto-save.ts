import { onBeforeUnmount, watch } from 'vue';
import { useRoute } from 'vue-router';

/**
 * 自动保存 composable
 * 在路由变化或组件卸载时自动保存数据
 */
export function useAutoSave(saveCallback: () => Promise<void> | void) {
  const route = useRoute();

  // 监听路由变化，在离开当前页面时保存
  const unwatch = watch(
    () => route.path,
    () => {
      void (async () => {
        try {
          await saveCallback();
        } catch (e) {
          console.error('Auto save failed:', e);
        }
      })();
    },
  );

  // 组件卸载时保存
  onBeforeUnmount(() => {
    unwatch();
    void (async () => {
      try {
        await saveCallback();
      } catch (e) {
        console.error('Auto save on unmount failed:', e);
      }
    })();
  });

  // 页面关闭时保存
  if (typeof window !== 'undefined') {
    const handleBeforeUnload = () => {
      void (async () => {
        try {
          await saveCallback();
        } catch (e) {
          console.error('Auto save on page unload failed:', e);
        }
      })();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    });
  }
}
