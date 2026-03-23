/**
 * API 服务器 - PostgreSQL 数据库存储
 */

import express from 'express';
import postgres from 'postgres';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// 终端颜色
const C = {
  GREEN: '\x1b[92m',
  RED: '\x1b[91m',
  YELLOW: '\x1b[93m',
  CYAN: '\x1b[96m',
  BLUE: '\x1b[94m',
  GRAY: '\x1b[90m',
  BOLD: '\x1b[1m',
  RESET: '\x1b[0m',
};

const app = express();
const sql = postgres(process.env.DATABASE_URL!);

// 中间件
app.use(cors());
app.use(express.json({ limit: '100mb' }));  // 支持大文件上传

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: 保存 JSON 数据
app.post('/api/tasks', async (req, res) => {
  try {
    const { filename, data, author } = req.body;
    console.log(`收到请求 | 文件: ${filename} | 作者: ${author || 'N/A'} | 数据类型: ${typeof data}`);

    if (!data) {
      return res.status(400).json({ success: false, error: '缺少 data 字段' });
    }

    const result = await sql`
      INSERT INTO task_data (filename, data, author) VALUES (${filename || 'unknown'}, ${JSON.stringify(data)}, ${author || null}) RETURNING id
    `;
    const id = result[0].id;
    console.log(`${C.GREEN}✓ 保存成功${C.RESET} | ${C.CYAN}ID:${id}${C.RESET} | ${C.BLUE}${filename}${C.RESET} | ${C.YELLOW}作者:${author || 'N/A'}${C.RESET}`);
    res.json({ success: true, id, filename, author });
  } catch (err: any) {
    console.error(`${C.RED}✗ 保存失败${C.RESET}`, err?.message || err);
    res.status(500).json({ success: false, error: err?.message || '保存失败' });
  }
});

// API: 获取所有数据
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await sql`SELECT * FROM task_data ORDER BY created_at DESC`;
    res.json(result);
  } catch (err) {
    console.error(`${C.RED}✗ 查询失败${C.RESET}`, err);
    res.status(500).json({ error: '查询失败' });
  }
});

// API: 获取单条数据
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await sql`SELECT * FROM task_data WHERE id = ${id}`;
    res.json(result[0] || null);
  } catch (err) {
    res.status(500).json({ error: '查询失败' });
  }
});

// API: 删除数据
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await sql`DELETE FROM task_data WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除失败' });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3001;

async function initDB() {
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
    console.log(`${C.GREEN}✓ 数据表已就绪${C.RESET}`);

    // 添加 author 列（如果不存在）
    try {
      await sql`ALTER TABLE task_data ADD COLUMN IF NOT EXISTS author TEXT`;
      console.log(`${C.GREEN}✓ author 列已添加${C.RESET}`);
    } catch {
      // 列已存在，忽略
    }

    // 打印表结构
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'task_data'
      ORDER BY ordinal_position
    `;
    console.log(`\n${C.CYAN}📋 表结构: task_data${C.RESET}`);
    columns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`   ${C.BLUE}${col.column_name}${C.RESET} ${C.GRAY}${col.data_type}${C.RESET} ${nullable}`);
    });
    console.log();
  } catch (err) {
    console.error(`${C.RED}✗ 创建表失败${C.RESET}`, err);
  }
}

app.listen(PORT, async () => {
  console.log(`\n${C.BOLD}${C.CYAN}API 服务器启动${C.RESET}`);
  console.log(`${C.GREEN}➜${C.RESET}  本地:   http://localhost:${PORT}`);
  console.log(`${C.BLUE}➜${C.RESET}  数据库: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || '未配置'}`);
  console.log(`${C.GRAY}➜${C.RESET}  按 Ctrl+C 停止\n`);
  await initDB();
});
