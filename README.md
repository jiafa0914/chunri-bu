# 椿日部官网

《燕云十六声》百业社团「椿日部」的官网，古风水墨风格，纯静态站点（HTML + CSS + JS + JSON），免费部署在 GitHub Pages。

## 页面

| 页面 | 说明 |
| --- | --- |
| `index.html` | 首页：英雄区 + 公告 + 关于 + 近期活动 + 成员 + 日报 |
| `about.html` | 关于椿日部 |
| `members.html` | 成员风采（照片 / 签名 / BGM） |
| `activities.html` | 活动中心（含报名） |
| `guides.html` | 攻略库 |
| `daily.html` | 江湖日报 |
| `recruit.html` | 招新 |
| `admin.html` | 社主管理面板（需 GitHub Token） |
| `member-edit.html` | 成员自助编辑（需社主发放的专属链接） |

## 目录结构

```
config.json          站点配置 / 公告 / 关于内容
members.json         成员名单
activities.json      活动
guides.json          攻略
daily.json           江湖日报
assets/css/style.css 古风水墨主题样式
assets/js/common.js  页面壳与工具
assets/js/github.js  GitHub API 读写
assets/js/admin.js   管理面板逻辑
assets/js/member-edit.js 成员自助编辑逻辑
assets/svg/          SVG 素材（山水 / 印章 / 梅花）
assets/img/bg/       上传的背景图（可在线更换）
assets/music/        成员背景音乐
```

## 本地预览

用任意静态文件服务器打开即可，例如：

```powershell
# 进入项目目录后
python -m http.server 8080
# 浏览器访问 http://localhost:8080
```

> 直接双击 HTML 用 `file://` 打开时，浏览器会拦截 `fetch` 读取 JSON，请用本地服务器或线上地址预览。

## 部署到 GitHub Pages

1. 在 GitHub 上创建仓库（例如 `chunri-bu`），把本项目推上去：
   ```powershell
   git init
   git add .
   git commit -m "init: 椿日部官网"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```
2. 在仓库 `Settings → Pages` 中，把 Source 设为 `Deploy from a branch`、分支选 `main`、目录选 `/ (root)`，保存。
3. 稍等 1-2 分钟，访问 `https://<你的用户名>.github.io/<仓库名>/` 即可。

## 管理后台（在线修改内容）

### 第一步：创建 GitHub Token（只需一次）

1. 打开 <https://github.com/settings/tokens?type=beta>，点击 **Generate new token**。
2. 名称随意（如 `chunri-site`），**Expiration** 建议 90 天或更长。
3. **Repository access** 选 **Only select repositories**，勾选你的网站仓库。
4. **Permissions → Repository permissions** 中把 **Contents** 设为 **Read and write**。
5. 点击生成，**立刻复制** token（只显示一次）。

### 第二步：连接

1. 打开网站 `admin.html`（或 `https://<用户名>.github.io/<仓库名>/admin.html`）。
2. 填写：Owner（你的 GitHub 用户名）、仓库名、Token。
3. 点「保存并连接」。Token 只保存在你自己浏览器的 localStorage 里，不会上传到任何地方。

### 可在线修改的内容

- **背景图**：上传新图片（如百业合照），自动压缩并替换首页背景；也可以从已上传列表里切换。
- **站点设置**：社名、副标题、类型、等级、服务器、标语、页脚、联系方式。
- **公告 / 关于 / 活动 / 攻略 / 江湖日报**：增删改，保存即上线。
- **成员**：增删改；每个成员可生成「编辑链接」，发给成员后，成员自己设置照片、签名、背景音乐。

## 成员自助编辑

1. 社主在管理后台「成员」里为该成员点「编辑链接」，把链接发给成员。
2. 成员打开链接，填入社主提供的 Token（社内共享的编辑密钥），上传/填写自己的照片、签名、BGM，点保存。
3. 刷新 `members.html` 即可看到效果。

## 安全提示

- 本方案是纯静态网站，Token 保存在浏览器本地，属于「轻量保护」而非严格鉴权。请只把编辑 Token 发给可信的社内成员；如怀疑泄露，可在 GitHub 上随时撤销/重建 Token（成员需要重新填写）。
- 不要在公开场合贴出 Token。