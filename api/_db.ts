/**
 * 数据库连接 - Vercel Serverless 优化
 * 使用 postgres 包，配合 max: 1 限制连接数
 */
import postgres from 'postgres';

// Serverless 环境下限制最大连接数为 1，避免连接池耗尽
const maxConnections = process.env.VERCEL ? 1 : 10;

// 全局数据库连接（Serverless 环境复用）
declare global {
  // eslint-disable-next-line no-var
  var sqlClient: ReturnType<typeof postgres> | undefined;
}

export const sql = globalThis.sqlClient ??
  postgres(process.env.DATABASE_URL!, {
    max: maxConnections,
    idle_timeout: 20,
    connect_timeout: 10,
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
