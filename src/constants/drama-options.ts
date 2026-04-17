/**
 * 视觉风格配置（新版三级联动结构）
 *
 * - bases     第一级：视觉材质基调（单选，决定底层生成逻辑）
 * - styles    第二级：风格流派（必须与 base 绑定，前端根据 base 动态切换）
 * - atmospheres 第三级：氛围与题材（画面的"滤镜"，适用于所有材质）
 *
 * 字段映射（旧 → 新）：
 *   materialType  → visualBase（第一级，值不变）
 *   artStyle      → visualStyle（第二级，值不变）
 *   moodAtmosphere→ atmosphere（第三级，值不变）
 */

/** 第一级：视觉材质基调 */
export const VISUAL_BASES = [
  { id: 'cinematic',      label: '真人摄影',       prompt: 'photorealistic, ultra-detailed, 8k uhd, sharp focus, RAW photo' },
  { id: '2d_anime',      label: '二维动漫',       prompt: '2D animation style, clean flat design, vibrant colors, keyframe illustration' },
  { id: '3d_render',      label: '三维渲染',       prompt: '3D CGI render, physically based rendering, high polygon model, Octane or Redshift quality' },
  { id: 'art_painting',   label: '艺术绘画',       prompt: 'fine art illustration, gallery quality, masterful brushwork' },
  { id: 'retro_film',     label: '复古胶片',       prompt: 'analog film aesthetics, light leaks, heavy 35mm grain, vintage photography' },
  { id: 'digital_niche',  label: '特殊数字艺术',   prompt: 'digital art, stylized aesthetic, creative rendering' },
] as const;

/** 第二级：风格流派（绑定到 base） */
export const VISUAL_STYLES = [
  // ── 绑定: 真人摄影 (cinematic) ─────────────────────
  { id: 'realistic',       base: 'cinematic',      label: '极高写实',       prompt: 'natural lighting, real skin texture, hyperrealism, professional photography, human face pores visible' },
  { id: 'cinematic_movie',base: 'cinematic',      label: '电影大片',       prompt: 'cinematic movie still, anamorphic lens, dramatic rembrandt lighting, shallow depth of field, epic composition, widescreen' },
  { id: 'documentary',    base: 'cinematic',      label: '纪实抓拍',       prompt: 'documentary photography style, natural available light, candid authentic moment, handheld camera look, photojournalism, unposed' },

  // ── 绑定: 二维动漫 (2d_anime) ─────────────────────
  { id: 'anime_style',    base: '2d_anime',       label: '日系精细',       prompt: 'anime style, Japanese animation, clean cel shading, precise black linework, expressive character design, studio quality' },
  { id: 'comic_style',   base: '2d_anime',       label: '美漫风格',       prompt: 'western comic book style, bold ink linework, halftone dot texture, dynamic action composition, flat vibrant colors' },
  { id: 'cartoon',        base: '2d_anime',       label: '美式卡通',       prompt: 'cartoon illustration, simple bold outlines, flat solid colors, playful friendly design, clean vector-like quality' },

  // ── 绑定: 三维渲染 (3d_render) ────────────────────
  { id: 'pixar',          base: '3d_render',       label: '皮克斯感',       prompt: 'Pixar-like, Disney style, cute 3D character design, soft global illumination' },
  { id: 'clay',           base: '3d_render',       label: '黏土动画',       prompt: 'clay animation style, claymation texture, handmade stop motion feel' },
  { id: 'blind_box',      base: '3d_render',       label: '盲盒质感',       prompt: 'blind box toy texture, vinyl figure, smooth plastic material, tilt-shift macro photography' },

  // ── 绑定: 艺术绘画 (art_painting) ─────────────────
  { id: 'ink_wash',       base: 'art_painting',   label: '传统水墨',       prompt: 'traditional Chinese ink wash painting, sumi-e style, monochrome brushwork, bamboo brush strokes, minimalist composition, xuan paper texture' },
  { id: 'watercolor',     base: 'art_painting',   label: '水彩晕染',       prompt: 'watercolor painting, soft wet-on-wet edges, transparent color washes, flowing pigment blooms, delicate paper texture, luminous pastel tones' },
  { id: 'oil_painting',   base: 'art_painting',   label: '厚涂油画',       prompt: 'oil painting on canvas, rich impasto textures, thick directional brushwork, deep saturated colors, old master chiaroscuro lighting' },
  { id: 'sketch',         base: 'art_painting',   label: '精细素描',       prompt: 'detailed pencil sketch, graphite drawing, precise hatching and crosshatching, tonal shading, fine art sketchbook quality, monochrome' },
  { id: 'woodblock',      base: 'art_painting',   label: '传统版画',       prompt: 'traditional woodblock print, ukiyo-e inspired, bold flat color areas, limited harmonious palette, Japanese printmaking aesthetic' },
  { id: 'impressionist',  base: 'art_painting',   label: '印象派',         prompt: 'impressionist oil painting, loose expressive brushstrokes, dappled sunlight effect, vibrant complementary colors, Monet-Renoir style' },
  { id: 'minimalist',     base: 'art_painting',   label: '极简留白',       prompt: 'minimalist design, clean uncluttered composition, generous negative space, simple geometric forms, modern Bauhaus aesthetic' },

  // ── 绑定: 复古胶片 (retro_film) ───────────────────
  { id: 'retro_color',    base: 'retro_film',     label: '褪色暖调胶片',   prompt: 'kodachrome color palette, faded warm tones, nostalgic atmosphere, slightly overexposed' },
  { id: 'noir',            base: 'retro_film',     label: '黑白黑色电影',   prompt: 'film noir, dramatic high-contrast black and white, hard chiaroscuro shadows, venetian blind light patterns, moody 1940s detective aesthetic' },

  // ── 绑定: 特殊数字艺术 (digital_niche) ───────────
  { id: 'pixel_art',      base: 'digital_niche',  label: '像素艺术',       prompt: 'pixel art, 16-bit retro game aesthetic, limited color palette, crisp hard pixels, sprite art style' },
  { id: 'low_poly',       base: 'digital_niche',  label: '低多边形',       prompt: 'low poly geometric art, flat triangular faceted surfaces, minimal polygon count, clean colorful facets, 3D origami style' },
] as const;

/** 第三级：氛围与题材（画面的滤镜，适用于所有材质） */
export const VISUAL_ATMOSPHERES = [
  { id: 'healing',          label: '治愈梦幻 (现代/唯美)',     prompt: 'dreamy aesthetic, creamy soft bokeh background, pastel color palette, ethereal glowing atmosphere, delicate haze and glow' },
  { id: 'horror',           label: '暗黑恐怖 (悬疑/末日)',     prompt: 'horror atmosphere, dark ominous mood, dense atmospheric fog, eerie cold lighting, desaturated dark palette, psychological tension' },
  { id: 'epic',             label: '史诗震撼 (大场景/磅礴)',   prompt: 'epic fantasy digital art, sweeping landscape, dramatic golden hour lighting, magical ethereal atmosphere' },
  { id: 'wuxia',            label: '武侠江湖 (古装/仙侠)',     prompt: 'wuxia martial arts epic, ancient China setting, flowing robes in dynamic motion, misty mountain landscape, dramatic sword fighting pose' },
  { id: 'chinese_style',    label: '古典国风 (宫廷/历史)',     prompt: 'Chinese historical drama, elegant hanfu costumes, imperial palace architecture, red lacquer and gold ornaments, rich warm color grading' },
  { id: 'cyberpunk',        label: '赛博朋克 (未来/科技)',     prompt: 'cyberpunk aesthetic, neon-soaked rain-slicked streets, dystopian megacity, glowing advertising billboards, neon pink magenta and electric blue' },
  { id: 'sci_fi',           label: '硬核科幻 (太空/先进)',     prompt: 'science fiction concept art, futuristic technology, sleek advanced civilization design, holographic displays, hard sci-fi realism' },
  { id: 'steampunk',        label: '蒸汽朋克 (维多利亚/机械)', prompt: 'steampunk aesthetic, Victorian era industrial fantasy, polished brass gears, steam powered machinery, sepia warm tones' },
  { id: 'post_apocalyptic', label: '末世废土 (荒野/求生)',     prompt: 'post-apocalyptic wasteland, ruined crumbling civilization, harsh desaturated color palette, dust and debris, Mad Max aesthetic' },
  { id: 'dark_fantasy',     label: '黑暗奇幻 (哥特/魔法)',     prompt: 'dark fantasy art, gothic ominous atmosphere, brooding dark palette, dramatic rim lighting, eldritch and arcane elements' },
] as const;

// ── 兼容旧 API（保持现有代码不报错） ────────────────────────────────────────

/** @deprecated 使用 VISUAL_BASES */
export const MATERIAL_TYPES = VISUAL_BASES;
/** @deprecated 使用 VISUAL_STYLES */
export const ART_STYLES = VISUAL_STYLES;
/** @deprecated 使用 VISUAL_ATMOSPHERES */
export const MOOD_ATMOSPHERES = VISUAL_ATMOSPHERES;

export type MaterialTypeId = string;
export type ArtStyleId = string;
export type MoodAtmosphereId = string;

// ── 辅助函数 ────────────────────────────────────────────────────────────────

/** 根据 base 过滤对应的风格列表 */
export function stylesForBase(baseId: string) {
  return VISUAL_STYLES.filter((s) => s.base === baseId);
}

/** 获取第一级材质标签 */
export function labelVisualBase(id: string | undefined): string {
  return VISUAL_BASES.find((x) => x.id === id)?.label ?? id ?? '未设置';
}

/** 获取第二级画风标签 */
export function labelVisualStyle(id: string | undefined): string {
  return VISUAL_STYLES.find((x) => x.id === id)?.label ?? id ?? '未设置';
}

/** 获取第三级氛围标签 */
export function labelVisualAtmosphere(id: string | undefined): string {
  return VISUAL_ATMOSPHERES.find((x) => x.id === id)?.label ?? id ?? '未设置';
}

/** @deprecated */
export function labelMaterialType(id: string): string {
  return labelVisualBase(id);
}
/** @deprecated */
export function labelArtStyle(id: string): string {
  return labelVisualStyle(id);
}
/** @deprecated */
export function labelMoodAtmosphere(id: string): string {
  return labelVisualAtmosphere(id);
}

/** 小说类型（多选） */
export const NOVEL_GENRES = [
  { id: 'fantasy', label: '玄幻' },
  { id: 'sci_fi', label: '科幻' },
  { id: 'romance', label: '言情' },
  { id: 'war', label: '战争' },
  { id: 'action', label: '动作' },
  { id: 'workplace', label: '职场' },
  { id: 'comedy', label: '喜剧' },
  { id: 'mystery', label: '悬疑' },
  { id: 'culture', label: '文化' },
] as const;

export type NovelGenreId = (typeof NOVEL_GENRES)[number]['id'];

/** 画面比例（画布 / 出图常用） */
export const CANVAS_ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', desc: '正方形' },
  { id: '16:9', label: '16:9', desc: '横屏' },
  { id: '9:16', label: '9:16', desc: '竖屏（手机）' },
  { id: '4:3', label: '4:3', desc: '标准' },
  { id: '3:4', label: '3:4', desc: '竖屏' },
] as const;

/** 影片比例（成片/时间线常用） */
export const FILM_ASPECT_RATIOS = [
  { id: '16:9', label: '16:9（横屏）' },
  { id: '9:16', label: '9:16（竖屏短视频）' },
  { id: '4:3', label: '4:3' },
  { id: '2.39:1', label: '2.39:1（宽银幕）' },
  { id: '1.85:1', label: '1.85:1' },
  { id: '1:1', label: '1:1' },
] as const;

export function labelNovelGenre(id: string): string {
  return NOVEL_GENRES.find((x) => x.id === id)?.label ?? id;
}

export function labelCanvasRatio(id: string): string {
  return CANVAS_ASPECT_RATIOS.find((x) => x.id === id)?.label ?? id;
}

export function labelFilmRatio(id: string): string {
  return FILM_ASPECT_RATIOS.find((x) => x.id === id)?.label ?? id;
}
