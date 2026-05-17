# MarkdownExam
零配置部署 | 纯静态前端 | 题库手写 MD 直接改 | 学习自测神器 | 行业知识总结考试

## 快速开始

```bash
php -S 127.0.0.1:8080 -t .
```

打开 `http://127.0.0.1:8080` 即可进入题库列表。

## 当前能力

- 纯 HTML/CSS/JavaScript 前端，无构建步骤。
- PHP 读取 `api/exam` 下最多 3 段路径的 Markdown 题库并输出 JSON。
- 支持旧版 `# 问题1` 简单题库格式。
- 支持新版 `### Q1` 题库格式，包含题型、选项、答案和解析。
- 支持考试模式、练习模式、交卷判分、答题卡、明暗主题和本地进度保存。

## 接口

- `GET /api/index.php`：获取题库列表。
- `GET /api/detail.php?id=frontend`：获取指定题库详情。
- `GET /api/detail.php?id=book-series/10-day-reading/day01-deliberate-practice`：获取分层题库详情。
- `GET /api/health.php`：健康检查。

## 题库目录规划

题库 ID 使用 `api/exam` 下的相对路径，最多 3 段，建议结构如下：

```text
api/exam/
  frontend.md
  personality.md
  book-series/
    10-day-reading/
      day01-deliberate-practice.md
      day02-how-to-win-friends.md
```

推荐规则：

- 第 1 段：大类，例如 `book-series`、`career`、`frontend`。
- 第 2 段：系列，例如 `10-day-reading`、`manager-growth`。
- 第 3 段：具体试卷文件，例如 `day01-deliberate-practice.md`。
- 文件和目录名只使用英文字母、数字、短横线和下划线。
- 老题库可以继续放在 `api/exam/*.md`，后端保持兼容。
- 系列题库建议在 front matter 中补充 `group` 和 `series`，便于后续前端分组展示。

## 新版题库格式

```markdown
---
title: 前端基础考试
description: 用于测试 HTML、CSS、JavaScript 基础知识
category: frontend
group: tech
series: basic
tags: ["前端", "基础"]
duration: "30分钟"
---

### Q1
题型：single
难度：easy
标签：HTML
题目：HTML 的主要作用是什么？

选项：
A. 描述网页结构
B. 管理数据库连接

答案：A

解析：HTML 用标签描述网页内容和结构。
```
