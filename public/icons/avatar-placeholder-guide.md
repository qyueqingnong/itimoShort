# 角色头像占位图片说明

如果您想使用自定义头像图片而不是图标，请按以下步骤操作：

## 1. 准备图片文件

在 `public/icons/` 文件夹中放置以下两个图片文件：

- `avatar-male.png` - 男性角色头像（建议尺寸：128x128px 或更大的正方形）
- `avatar-female.png` - 女性角色头像（建议尺寸：128x128px 或更大的正方形）

## 2. 修改代码

在 `src/pages/production/ProduceStoryPage.vue` 文件中，找到以下代码：

```vue
<div class="itimo-avatar-icon">
  <q-icon
    :name="character.gender === '女' ? 'face_3' : 'face'"
    size="48px"
    :color="character.gender === '女' ? 'pink-5' : 'blue-5'"
  />
</div>
```

替换为：

```vue
<div class="itimo-avatar-icon">
  <img
    :src="character.gender === '女' ? '/icons/avatar-female.png' : '/icons/avatar-male.png'"
    :alt="character.name"
    class="itimo-avatar-img"
  />
</div>
```

## 3. 添加图片样式

在 style 部分添加：

```css
.itimo-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
```

## 推荐的图片来源

- [Flaticon](https://www.flaticon.com/) - 搜索 "avatar" 或"user icon"
- [Freepik](https://www.freepik.com/) - 搜索 "avatar illustration"
- [IconFinder](https://www.iconfinder.com/) - 搜索 "profile avatar"
- [Unsplash](https://unsplash.com/) - 搜索 "portrait" 或 "face"

## 注意事项

- 图片应该是正方形，推荐 128x128px 或更大
- 支持 PNG、JPG、SVG 格式
- 建议使用透明背景的 PNG 图片
- 文件大小建议控制在 50KB 以内
