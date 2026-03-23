/**
 * 数据库连接 - Vercel Serverless 优化
 * 使用 postgres 包，针对 Serverless 环境优化
 */
import postgres from 'postgres';

// 全局数据库连接（Serverless 环境复用）
declare global {
  // eslint-disable-next-line no-var
  var sqlClient: ReturnType<typeof postgres> | undefined;
}

// 去除可能存在的引号
const databaseUrl = process.env.DATABASE_URL?.replace(/^["']|["']$/g, '')!;

// Serverless 优化的连接配置
export const sql = globalThis.sqlClient ??
  postgres(databaseUrl, {
    max: 1,                    // 限制最大连接数
    idle_timeout: 0,           // 禁用空闲超时
    connect_timeout: 30,       // 连接超时 30 秒
    prepare: false,            // 禁用预备语句（兼容性更好）
    ssl: 'require',            // 强制 SSL
    connection: {
      application_name: 'vercel-serverless',
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.sqlClient = sql;
}

// 表初始化（仅首次调用执行）
let initialized = false;
export async function initDB() {
  if (initialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS task_data (
        id SERIAL PRIMARY KEY,
        filename TEXT,
        data JSONB NOT NULL,
        author TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE task_data ADD COLUMN IF NOT EXISTS author TEXT`;
    initialized = true;
  } catch (e) {
    console.error('DB init error:', e);
  }
}
