---
title: AI 开发核心：Scikit-learn 教程
description: 理解 Scikit-learn 在传统机器学习中的数据处理、建模、评估和流水线思想。
category: ai-development
group: ai
series: ai-dev-core
tags: ["Scikit-learn", "机器学习", "分类", "回归"]
icon: "📊"
difficulty: "简单"
duration: "6分钟"
---

### Q1
题型：single
难度：easy
标签：框架定位
题目：Scikit-learn 最适合哪类任务入门？

选项：
A. 传统机器学习中的分类、回归、聚类和预处理
B. 只训练超大语言模型
C. 只做网页动画
D. 只管理服务器日志

答案：A

解析：Scikit-learn 是经典机器学习库，适合结构化数据和常见机器学习算法。

### Q2
题型：single
难度：normal
标签：接口
题目：Scikit-learn 中常见的 `fit` 方法通常表示什么？

选项：
A. 用训练数据拟合模型或转换器
B. 删除模型文件
C. 启动浏览器
D. 发布前端页面

答案：A

解析：`fit` 用来从数据中学习参数，例如模型权重、均值方差或聚类中心。

### Q3
题型：multiple
难度：normal
标签：流程
题目：一个基本 Scikit-learn 项目通常包括哪些步骤？

选项：
A. 划分训练集和测试集
B. 特征处理
C. 训练模型
D. 评估指标

答案：A,B,C,D

解析：标准机器学习流程需要避免数据泄漏，并用独立数据评估泛化能力。

### Q4
题型：single
难度：normal
标签：评估
题目：分类任务中，只看准确率可能有问题，主要是因为？

选项：
A. 类别不平衡时准确率可能掩盖真实效果
B. 准确率永远不能计算
C. 分类任务不需要评估
D. 模型训练后一定完美

答案：A

解析：类别不平衡时，模型可能只预测多数类也获得高准确率，需要结合精确率、召回率、F1 等指标。

### Q5
题型：single
难度：hard
标签：Pipeline
题目：Scikit-learn 的 Pipeline 主要价值是什么？

选项：
A. 把预处理和模型训练串成一致、可复用、可验证的流程
B. 替代所有数据
C. 让模型不能训练
D. 只用于改文件名

答案：A

解析：Pipeline 能减少数据泄漏和重复代码，也方便交叉验证和部署一致性。
