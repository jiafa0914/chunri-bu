# AGENTS.md

椿日部官网 —— 《燕云十六声》百业社团「椿日部」的静态网站（古风水墨风格）。

这是一个纯静态站点：HTML + CSS + JavaScript + JSON 数据文件。内容通过 `admin.html`（社主管理面板）和 `member-edit.html`（成员自助编辑）经由 GitHub API 写回本仓库。

## 工作方式（重要）

- 每次动手前先了解现状，先给出方案/选项，等社主确认后再实施。
- 未经确认，不直接改动网站内容或推送到线上。
- 涉及方案选择时，先提问；社主已明确指示的小改动可直接执行。

## 站点结构

- `index.html` 首页 · `about.html` 关于 · `members.html` 成员 · `activities.html` 活动 · `guides.html` 攻略 · `daily.html` 江湖日报 · `recruit.html` 招新
- `admin.html` 社主管理面板（背景图 / 站点设置 / 公告 / 关于 / 成员 / 活动 / 攻略 / 日报）
- `member-edit.html` 成员自助编辑（照片 / 签名 / 背景音乐）
- `config.json` 站点配置与公告、关于内容
- `members.json` 成员名单
- `activities.json` 活动
- `guides.json` 攻略
- `daily.json` 江湖日报
- `assets/` 样式、脚本、SVG 素材、上传的背景图与音乐

## Agent skills

### Issue tracker

Issues for this repo live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## 编辑规则

- 修改站点内容优先通过 `admin.html`，它会用 GitHub API 直接写回对应 JSON 文件。
- 手工编辑 JSON 时保持 UTF-8（无 BOM）、缩进 2 空格，不要破坏字段结构。
- 上传的图片放 `assets/img/`，音乐放 `assets/music/`，路径以相对路径写入 JSON。