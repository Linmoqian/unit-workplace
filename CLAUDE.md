# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Google AI Studio 应用 - 统一工作区，包含 JSON 文件上传器和任务状态监控网格。

## 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器 (端口 3000)
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# TypeScript 类型检查
npm run lint

# 清理构建产物
npm run clean
```

## 技术栈

- **Vite 6** - 构建工具，配置文件 `vite.config.ts`
- **React 19** - UI 框架
- **TypeScript** - 类型系统，配置 `tsconfig.json`
- **Tailwind CSS v4** - 通过 `@tailwindcss/vite` 插件集成
- **motion/react** - 动画库（原 framer-motion）
- **lucide-react** - 图标库
- **@google/genai** - Google Gemini AI SDK

## 环境变量

复制 `.env.example` 到 `.env.local` 并配置：

- `GEMINI_API_KEY` - Gemini API 密钥（必需）
- `APP_URL` - 应用托管 URL（可选，Cloud Run 自动注入）

## 路径别名

`@/*` 映射到项目根目录，例如 `@/src/App.tsx`

## 架构说明

单页应用，所有逻辑集中在 `src/App.tsx`：

1. **Tab 导航** - 'uploader' | 'monitor' 两个视图
2. **File Uploader** - 拖拽/选择 JSON 文件，支持验证和模拟上传
3. **Task Monitor** - 24 个任务单元的网格视图，支持状态切换和增删

任务状态：`pending`（待处理）、`success`（成功）、`warning`（故障）

## Tailwind CSS v4 注意事项

样式通过 `@import "tailwindcss"` 引入，无需 `tailwind.config.js`。自定义主题通过 CSS 变量或直接在 vite.config.ts 中配置。
