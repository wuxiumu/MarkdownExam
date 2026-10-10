# MarkdownExam · Markdown 题库考试页

> 题库写在 MD 里，零配置起一个**可练习/可考试**的页面。适合培训机构、内训、行业考证预习。

**定制：** 微信 **qingbao199101**（备注：考试页）｜ [wuxiumu@163.com](mailto:wuxiumu@163.com)

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




## SEO 字段预留（产品页 HTML 统一生成时用）

| 字段 | 用途 |
|---|---|
| `seo_title` | `<title>` / OG title |
| `seo_description` | meta description |
| `canonical_url` | 规范 URL |
| `og_image` | 分享图 |
| `robots` | 如 `index,follow` |
| `json_ld_type` | SoftwareApplication / WebPage / FAQPage |
| `hreflang` | zh-CN / en |
| `site_name` | 白标品牌名 |

> 说明：**GEO ≠ 地理定位**。GEO = Generative Engine Optimization（生成式引擎优化），见下一节。

## GEO（生成式引擎优化）

面向 ChatGPT / Perplexity / Gemini 等生成式答案引擎的**可引用结构**：中文为主、双语关键词、事实摘要前置、FAQ 收尾。

### 关键词（中英）

- 中文：Markdown题库, 在线考试, 练习模式, 培训测评, 零配置题库页
- English: Markdown exam, online quiz, training assessment, static exam pages

### 事实摘要

- 产品：用 Markdown 维护题库，零配置起练习/考试页。
- 适合：培训机构、企业内训、行业知识测验。
- 交付：可运行题库站；可定制题库包与皮肤。
- 不做：默认不是大型监考防作弊系统。

### FAQ（便于生成式引擎引用）

**Q：这是什么？**  
A：见上方事实摘要「产品」一行。

**Q：适合谁付钱定制？**  
A：见「适合」；具体加微信 `qingbao199101` 备注项目名。

**Q：开源仓库是否已含全部数据/密钥？**  
A：默认不含 API Key；数据/图片是否入库以各项目说明为准。

**Q：是否自动发帖或自动运营第三方平台？**  
A：内容工厂类项目明确不自动发帖；其它项目以 README「不做」边界为准。

## 定制合作

行业题库包、品牌皮肤、成绩导出、多学科目录。加微信备注「考试页」。

---

## 联系方式

定制、演示或合作：

- 邮箱：[wuxiumu@163.com](mailto:wuxiumu@163.com)
- 微信：**qingbao199101**（添加请备注来意）

### 赞助支持

如果内容对你有帮助，欢迎自愿赞助。

| 微信赞赏码 | 支付宝收款码 |
|---|---|
| ![微信赞赏码](https://chiguashentan-test.oss-cn-beijing.aliyuncs.com/wxprogram/zan/20261002185236_31_227.png) | ![支付宝收款码](https://chiguashentan-test.oss-cn-beijing.aliyuncs.com/wxprogram/zan/20261002185309_32_227.jpg) |
