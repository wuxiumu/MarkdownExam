---
title: AI 开发核心：LangChain
description: 理解 LangChain 在 LLM 应用开发中的链、工具、检索增强和 Agent 编排思想。
category: ai-development
group: ai
series: ai-dev-core
tags: ["LangChain", "LLM 应用", "RAG", "Agent"]
icon: "🔗"
difficulty: "中等"
duration: "6分钟"
---

### Q1
题型：single
难度：easy
标签：框架定位
题目：LangChain 主要解决什么问题？

选项：
A. 编排 LLM、提示、工具、检索和外部系统
B. 替代所有编程语言
C. 只用于训练卷积神经网络
D. 只用于设计图标

答案：A

解析：LangChain 面向 LLM 应用开发，帮助把模型调用、数据检索、工具和流程组织起来。

### Q2
题型：single
难度：normal
标签：RAG
题目：RAG 的核心思想是什么？

选项：
A. 先检索相关资料，再让模型基于资料生成回答
B. 完全不使用任何外部知识
C. 只让模型随机回答
D. 用图片替代文本

答案：A

解析：RAG 通过检索增强模型上下文，降低知识缺失和幻觉风险。

### Q3
题型：multiple
难度：normal
标签：组件
题目：LLM 应用编排中常见组件包括哪些？

选项：
A. Prompt
B. Model
C. Retriever
D. Tool

答案：A,B,C,D

解析：提示、模型、检索器和工具是构建复杂 LLM 应用的常见基础组件。

### Q4
题型：single
难度：normal
标签：工程风险
题目：使用 LangChain 这类框架时，最需要避免什么？

选项：
A. 为了用框架而堆复杂链路，忽略真实业务问题
B. 明确输入输出
C. 记录调用过程
D. 评估效果

答案：A

解析：框架是手段，不是目标。链路越复杂，越需要清楚每一步解决的问题和可观测性。

### Q5
题型：single
难度：hard
标签：评估
题目：为什么 LLM 应用需要评估集？

选项：
A. 用稳定样本衡量改 prompt、模型或检索策略后的效果
B. 为了让应用永远不变
C. 为了减少所有测试
D. 为了让用户无法反馈

答案：A

解析：没有评估集，很难判断一次改动是提升、退化还是只在个别样例上变好。
