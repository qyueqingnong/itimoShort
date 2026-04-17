import type { RouteRecordRaw } from 'vue-router';
import AppShellLayout from 'layouts/AppShellLayout.vue';
import HomePage from 'pages/HomePage.vue';
import SettingsPage from 'pages/SettingsPage.vue';

/** 首屏与壳层同步导入，避免 Electron 下懒加载 chunk 异常导致白屏 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppShellLayout,
    children: [
      { path: '', name: 'home', component: HomePage },
      { path: 'settings', name: 'settings', component: SettingsPage },
    ],
  },
  {
    path: '/project/:projectId',
    component: () => import('layouts/ProjectLayout.vue'),
    children: [
      {
        path: '',
        name: 'project-hub',
        component: () => import('pages/project/ProjectHubPage.vue'),
      },
      {
        path: 'produce/:episodeId',
        component: () => import('layouts/ProductionLayout.vue'),
        children: [
          {
            path: '',
            redirect: (to) => ({
              name: 'produce-story',
              params: {
                projectId: to.params.projectId as string,
                episodeId: to.params.episodeId as string,
              },
            }),
          },
          {
            path: 'story',
            name: 'produce-story',
            component: () => import('pages/production/ProduceStoryPage.vue'),
          },
          {
            path: 'characters',
            name: 'produce-characters',
            component: () => import('pages/production/ProduceCharactersPage.vue'),
          },
          {
            path: 'props',
            name: 'produce-props',
            component: () => import('pages/production/ProducePropsPage.vue'),
          },
          {
            path: 'scenes',
            name: 'produce-scenes',
            component: () => import('pages/production/ProduceScenesPage.vue'),
          },
          {
            path: 'script',
            name: 'produce-script',
            component: () => import('pages/production/ProduceScriptPage.vue'),
          },
          {
            path: 'storyboard',
            name: 'produce-storyboard',
            component: () => import('pages/production/ProduceStoryboardPage.vue'),
          },
          {
            path: 'video',
            name: 'produce-video',
            component: () => import('pages/production/ProduceVideoPage.vue'),
          },
        ],
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
