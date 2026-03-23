# Task Update Web

JSON 文件上传与任务状态监控系统。

## 功能

- 📤 **文件上传** - 拖拽/选择 JSON 文件批量上传
- 📊 **任务监控** - 24 宫格任务状态视图
- 🗄️ **数据持久化** - PostgreSQL 数据库存储
- 🏆 **排行榜** - 作者贡献统计
- 🔒 **密码保护** - 下载/删除操作需验证

## 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS v4 + Motion
- **后端**: Vercel Serverless Functions
- **数据库**: PostgreSQL (Neon/Supabase)

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local

# 启动后端 (终端 1)
npm run server

# 启动前端 (终端 2)
npm run dev
```

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量：

| 变量名 | 说明 |
|--------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串（使用连接池 URL）|
| `DownloadPassword` | 下载密码（可选）|
| `DeletePassword` | 删除密码（可选）|

## 项目结构

```
├── api/                 # Vercel Serverless Functions
│   ├── _db.ts          # 数据库连接
│   ├── health.ts       # 健康检查
│   └── tasks/          # 任务 API
├── src/
│   └── App.tsx         # 主应用
├── server.ts           # 本地开发服务器
└── vercel.json         # Vercel 配置
```

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run server   # 启动 API 服务器
npm run build    # 构建生产版本
npm run preview  # 预览构建结果
```
