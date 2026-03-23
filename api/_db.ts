/**
 * 数据库连接 - Vercel Serverless 优化
 */
import { neon, neonConfig } from '@neondatabase/serverless';
import { fetchConnectionCache } from '@vercel/postgres';

neonConfig.fetchConnectionCache = true;

// 全局数据库连接（Serverless 环境复用）
declare global {
  // eslint-disable-next-line no-var
  var sql: ReturnType<typeof neon> | undefined;
}

export const sql = globalThis.sql ?? neon(process.env.DATABASE_URL!);

if (process.env.NODE_ENV !== 'production') {
  globalThis.sql = sql;
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
