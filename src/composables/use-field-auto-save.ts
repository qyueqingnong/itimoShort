import { watch, type Ref } from 'vue';

/**
 * 防抖包装器类型
 */
type AsyncSaveFn<T = unknown> = (value?: T) => Promise<void>;

/**
 * 创建防抖的异步保存函数
 * @param fn 原始异步保存函数
 * @param delay 防抖延迟（毫秒）
 */
export function debouncedSave<T>(fn: AsyncSaveFn<T>, delay = 500): AsyncSaveFn<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (value?: T) => {
    if (timer) {
      clearTimeout(timer);
    }
    return new Promise<void>((resolve, reject) => {
      timer = setTimeout(async () => {
        try {
          await fn(value);
          resolve();
        } catch (e) {
          reject(e);
        } finally {
          timer = null;
        }
      }, delay);
    });
  };
}

/**
 * 监听一个响应式引用值的变化，在值变化时自动保存到数据库。
 * 组合 QInput/QSelect 等组件的 @update:model-value 使用。
 *
 * @param source 响应式引用
 * @param onSave 保存回调函数，接收新值作为参数
 * @param options 配置选项
 *
 * @example
 * ```ts
 * // 监听 promptThemeId 变化，自动保存
 * const debouncedSave = useFieldAutoSave(
 *   () => character.promptThemeId,
 *   (newValue) => workspace.updateCharacter(characterId, { promptThemeId: newValue }),
 *   { immediate: false, delay: 300 }
 * );
 *
 * // 在 QSelect 上使用
 * <q-select
 *   v-model="character.promptThemeId"
 *   @update:model-value="debouncedSave.save"
 * />
 * ```
 */
export function useFieldAutoSave<T>(
  source: () => T,
  onSave: (newValue: T) => Promise<void> | void,
  options: { immediate?: boolean; delay?: number } = {},
): { save: (value?: T) => Promise<void>; stop: () => void } {
  const { immediate = false, delay = 500 } = options;

  const doSave = debouncedSave(async (value?: T) => {
    const currentValue = value !== undefined ? value : source();
    try {
      await onSave(currentValue);
    } catch (e) {
      console.error('[useFieldAutoSave] Save failed:', e);
    }
  }, delay);

  let stopWatch: (() => void) | null = null;

  if (immediate) {
    void doSave(source());
  } else {
    const watcher = watch(source, async (newValue) => {
      await doSave(newValue);
    });
    stopWatch = () => watcher();
  }

  return {
    save: async (value?: T) => {
      await doSave(value);
    },
    stop: () => {
      stopWatch?.();
      stopWatch = null;
    },
  };
}

/**
 * 批量字段自动保存。
 * 当任意一个字段变化时，会延迟防抖后再一次性保存所有变化的字段。
 *
 * @param getFields 返回所有字段的函数
 * @param onSave 保存回调函数，接收部分更新的字段对象
 *
 * @example
 * ```ts
 * const batchSave = useBatchAutoSave(
 *   () => ({ name: formData.value.name, role: formData.value.role }),
 *   async (updates) => await workspace.updateCharacter(characterId, updates)
 * );
 *
 * // 绑定到多个输入框
 * <q-input v-model="formData.name" @blur="batchSave.save()" />
 * <q-input v-model="formData.role" @blur="batchSave.save()" />
 * ```
 */
export function useBatchAutoSave<T extends Record<string, unknown>>(
  getFields: () => T,
  onSave: (updates: Partial<T>) => Promise<void> | void,
  options: { delay?: number } = {},
): { save: () => Promise<void>; stop: () => void } {
  const { delay = 500 } = options;
  const initialFields = getFields();
  const dirtyFields = new Set<keyof T>();

  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopWatch: (() => void) | null = null;

  // 记录哪些字段被修改了
  const watcher = watch(getFields, (newFields, oldFields) => {
    for (const key of Object.keys(newFields) as (keyof T)[]) {
      if (newFields[key] !== oldFields?.[key]) {
        dirtyFields.add(key);
      }
    }
  });
  stopWatch = () => watcher();

  const flush = async () => {
    if (dirtyFields.size === 0) return;

    const currentFields = getFields();
    const updates: Partial<T> = {} as Partial<T>;
    for (const key of dirtyFields) {
      (updates as Record<string, unknown>)[key as string] = currentFields[key];
    }
    dirtyFields.clear();

    try {
      await onSave(updates);
    } catch (e) {
      console.error('[useBatchAutoSave] Save failed:', e);
    }
  };

  return {
    save: () =>
      new Promise<void>((resolve) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
          await flush();
          resolve();
        }, delay);
      }),
    stop: () => {
      stopWatch?.();
      stopWatch = null;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}

/**
 * 简单的防抖 hook，用于将任意函数包装成防抖版本。
 *
 * @param fn 要防抖的函数
 * @param delay 延迟（毫秒）
 *
 * @example
 * ```ts
 * const debouncedNotify = useDebounceFn((msg: string) => $q.notify({ message: msg }), 500);
 * debouncedNotify('保存成功');
 * debouncedNotify('保存失败'); // 如果在500ms内调用，只有最后一个会执行
 * ```
 */
export function useDebounceFn<T extends unknown[]>(
  fn: (...args: T) => void,
  delay = 500,
): (...args: T) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: T) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}
