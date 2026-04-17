/** On-disk project manifest (`project.json`). Versioned for future migrations. */
export const PROJECT_MANIFEST_VERSION = 1 as const;

export interface EpisodeRef {
  id: string;
  title: string;
  order: number;
  /** Relative folder under `episodes/` */
  folder: string;
  /** 显示的集数标签，如"第1集"，不可更改 */
  episodeNumber: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  /** 项目 ID（用于数据库关联查询） */
  projectId?: string;
  name: string;
  description: string;
  role: '主角' | '配角' | '次要角色';
  gender: string;
  age: string;
  height: string;
  weight: string;
  bodyType: string;
  facialFeatures: string;
  identity: string;
  personality: string;
  speakingStyle: string;
  interests: string;
  /** 角色图片相对路径（相对于项目根目录） */
  imagePath?: string | undefined;
  /** 提示词语言状态（false=中文, true=英文） */
  promptLangEn?: boolean | undefined;
  /** 当前选中的提示词套件ID */
  promptThemeId?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface Prop {
  id: string;
  /** 项目 ID（用于数据库关联查询） */
  projectId?: string;
  name: string;
  description: string;
  /** 道具图片相对路径（相对于项目根目录） */
  imagePath: string | undefined;
  /** 提示词语言状态（false=中文, true=英文） */
  promptLangEn: boolean | undefined;
  /** 当前选中的提示词套件ID */
  promptThemeId: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface Scene {
  id: string;
  /** 项目 ID（用于数据库关联查询） */
  projectId?: string;
  name: string;
  description: string;
  /** 场景图片相对路径（相对于项目根目录） */
  imagePath: string | undefined;
  /** 提示词语言状态（false=中文, true=英文） */
  promptLangEn: boolean | undefined;
  /** 当前选中的提示词套件ID */
  promptThemeId: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface Storyboard {
  id: string;
  name: string;
  description: string;
  /** 分镜图片相对路径（相对于项目根目录） */
  imagePath?: string;
  /** 视频文件相对路径（相对于项目根目录） */
  videoPath?: string;
  /** 场景名称 */
  sceneName?: string;
  /** 角色名称列表 */
  characterNames?: string;
  /** 镜头角度 */
  cameraAngle?: string;
  /** 氛围动作 */
  mood?: string;
  /** 提示词语言状态（false=中文, true=英文） */
  promptLangEn?: boolean;
  /** 当前选中的提示词套件ID */
  promptThemeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryRef {
  characterAssetIds: string[];
  sceneAssetIds: string[];
  propAssetIds: string[];
}

export interface Library {
  characters: Character[];
  scenes: Scene[];
  props: Prop[];
  storyboards?: Storyboard[];
}

export interface ProjectManifest {
  id: string;
  name: string;
  version: typeof PROJECT_MANIFEST_VERSION;
  createdAt: string;
  updatedAt: string;
  /** 封面图片路径（内置封面如 /src/assets/cover/cover1.jpeg，或上传后保存在项目中的相对路径） */
  coverImage?: string;
  /** 卡片与列表展示的简短描述 */
  description: string;
  /** 梗概 / 故事素材长文本（可与 description 分工） */
  synopsis: string;
  style: string;
  /** 画面比例（画布类，如 16:9） */
  canvasAspectRatio: string;
  /** 画面类型 id（单选，见 drama-options） */
  visualStyle: string;
  /** 基础材质 */
  materialType?: string;
  /** 核心画风 */
  artStyle?: string;
  /** 氛围画风 */
  moodAtmosphere?: string;
  /** 语言：en / zh */
  language?: 'en' | 'zh';
  /** 小说类型 id 列表（多选） */
  novelGenres: string[];
  /** 影片比例（成片时间线类） */
  filmAspectRatio: string;
  episodes: EpisodeRef[];
}

export interface ProjectsIndexEntry {
  id: string;
  name: string;
  /** Absolute path to project root on disk */
  rootPath: string;
  updatedAt: string;
}

export interface ProjectsIndexFile {
  version: 1;
  projects: ProjectsIndexEntry[];
}
