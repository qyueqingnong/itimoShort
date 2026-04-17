/**
 * 数据库与 Pinia 响应式集成
 * 提供响应式的数据库查询结果
 */
import { ref, shallowRef } from 'vue';
import {
  db,
  type DbSettings,
  type DbProjectEntry,
  type DbProjectManifest,
  type DbEpisodeManifest,
} from './index';
import { liveQuery, type Subscription } from 'dexie';

/** 响应式设置数据 */
export function useLiveSettings() {
  const settings = shallowRef<DbSettings | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  let subscription: Subscription | null = null;

  function start() {
    const observable = liveQuery(() => db.settings.get('app'));
    subscription = observable.subscribe({
      next: (result) => {
        settings.value = result ?? null;
        loading.value = false;
        error.value = null;
      },
      error: (err) => {
        console.error('[useLiveSettings] Query error:', err);
        error.value = err as Error;
        loading.value = false;
      },
    });
  }

  function stop() {
    subscription?.unsubscribe();
    subscription = null;
  }

  return { settings, loading, error, start, stop };
}

/** 响应式项目索引列表 */
export function useLiveProjectEntries() {
  const entries = shallowRef<DbProjectEntry[]>([]);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  let subscription: Subscription | null = null;

  function start() {
    const observable = liveQuery(() =>
      db.projectEntries.orderBy('updatedAt').reverse().toArray(),
    );
    subscription = observable.subscribe({
      next: (result) => {
        entries.value = result;
        loading.value = false;
        error.value = null;
      },
      error: (err) => {
        console.error('[useLiveProjectEntries] Query error:', err);
        error.value = err as Error;
        loading.value = false;
      },
    });
  }

  function stop() {
    subscription?.unsubscribe();
    subscription = null;
  }

  return { entries, loading, error, start, stop };
}

/** 响应式项目数据 */
export function useLiveProject(projectId: () => string | null) {
  const manifest = shallowRef<DbProjectManifest | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  let subscription: Subscription | null = null;

  function start() {
    const id = projectId();
    if (!id) {
      loading.value = false;
      return;
    }

    const observable = liveQuery(() => db.projectManifests.get(id));
    subscription = observable.subscribe({
      next: (result) => {
        manifest.value = result ?? null;
        loading.value = false;
        error.value = null;
      },
      error: (err) => {
        console.error('[useLiveProject] Query error:', err);
        error.value = err as Error;
        loading.value = false;
      },
    });
  }

  function stop() {
    subscription?.unsubscribe();
    subscription = null;
  }

  return { manifest, loading, error, start, stop };
}

/** 响应式分集数据 */
export function useLiveEpisode(episodeId: () => string | null) {
  const episode = shallowRef<DbEpisodeManifest | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  let subscription: Subscription | null = null;

  function start() {
    const id = episodeId();
    if (!id) {
      loading.value = false;
      return;
    }

    const observable = liveQuery(() => db.episodeManifests.get(id));
    subscription = observable.subscribe({
      next: (result) => {
        episode.value = result ?? null;
        loading.value = false;
        error.value = null;
      },
      error: (err) => {
        console.error('[useLiveEpisode] Query error:', err);
        error.value = err as Error;
        loading.value = false;
      },
    });
  }

  function stop() {
    subscription?.unsubscribe();
    subscription = null;
  }

  return { episode, loading, error, start, stop };
}

/** 响应式项目列表 */
export function useLiveProjectList() {
  const projects = shallowRef<DbProjectEntry[]>([]);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  let subscription: Subscription | null = null;

  function start() {
    const observable = liveQuery(() =>
      db.projectEntries.orderBy('updatedAt').reverse().toArray(),
    );
    subscription = observable.subscribe({
      next: (result) => {
        projects.value = result;
        loading.value = false;
        error.value = null;
      },
      error: (err) => {
        console.error('[useLiveProjectList] Query error:', err);
        error.value = err as Error;
        loading.value = false;
      },
    });
  }

  function stop() {
    subscription?.unsubscribe();
    subscription = null;
  }

  return { projects, loading, error, start, stop };
}

/** 响应式角色列表 */
export function useLiveCharacters(projectId: () => string | null) {
  const characters = shallowRef<Array<{ id: string }>>([]);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  let subscription: Subscription | null = null;

  function start() {
    const id = projectId();
    if (!id) {
      loading.value = false;
      characters.value = [];
      return;
    }

    const observable = liveQuery(() =>
      db.characters.where('projectId').equals(id).toArray(),
    );
    subscription = observable.subscribe({
      next: (result) => {
        characters.value = result;
        loading.value = false;
        error.value = null;
      },
      error: (err) => {
        console.error('[useLiveCharacters] Query error:', err);
        error.value = err as Error;
        loading.value = false;
      },
    });
  }

  function stop() {
    subscription?.unsubscribe();
    subscription = null;
  }

  return { characters, loading, error, start, stop };
}

/** 响应式场景列表 */
export function useLiveScenes(projectId: () => string | null) {
  const scenes = shallowRef<Array<{ id: string }>>([]);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  let subscription: Subscription | null = null;

  function start() {
    const id = projectId();
    if (!id) {
      loading.value = false;
      scenes.value = [];
      return;
    }

    const observable = liveQuery(() =>
      db.scenes.where('projectId').equals(id).toArray(),
    );
    subscription = observable.subscribe({
      next: (result) => {
        scenes.value = result;
        loading.value = false;
        error.value = null;
      },
      error: (err) => {
        console.error('[useLiveScenes] Query error:', err);
        error.value = err as Error;
        loading.value = false;
      },
    });
  }

  function stop() {
    subscription?.unsubscribe();
    subscription = null;
  }

  return { scenes, loading, error, start, stop };
}

/** 响应式道具列表 */
export function useLiveProps(projectId: () => string | null) {
  const props = shallowRef<Array<{ id: string }>>([]);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  let subscription: Subscription | null = null;

  function start() {
    const id = projectId();
    if (!id) {
      loading.value = false;
      props.value = [];
      return;
    }

    const observable = liveQuery(() =>
      db.props.where('projectId').equals(id).toArray(),
    );
    subscription = observable.subscribe({
      next: (result) => {
        props.value = result;
        loading.value = false;
        error.value = null;
      },
      error: (err) => {
        console.error('[useLiveProps] Query error:', err);
        error.value = err as Error;
        loading.value = false;
      },
    });
  }

  function stop() {
    subscription?.unsubscribe();
    subscription = null;
  }

  return { props, loading, error, start, stop };
}
