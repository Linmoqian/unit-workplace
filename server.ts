/**
 * Neon PostgreSQL API 服务器
 */

import express from 'express';
import { neon } from '@neondatabase/serverless';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const sql = neon(process.env.DATABASE_URL!);

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 创建表（首次运行）
async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS task_data (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('✅ 数据表已就绪');
  } catch (err) {
    console.error('❌ 创建表失败:', err);
  }
}

// API: 保存 JSON 数据
app.post('/api/tasks', async (req, res) => {
  try {
    const { data } = req.body;
    const result = await sql`
      INSERT INTO task_data (data) VALUES (${JSON.stringify(data)}) RETURNING id
    `;
    res.json({ success: true, id: result[0].id });
  } catch (err) {
    console.error('插入失败:', err);
    res.status(500).json({ success: false, error: '保存失败' });
  }
});

// API: 获取所有数据
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await sql`SELECT * FROM task_data ORDER BY created_at DESC`;
    res.json(result);
  } catch (err) {
    console.error('查询失败:', err);
    res.status(500).json({ error: '查询失败' });
  }
});

// API: 获取单条数据
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const result = await sql`SELECT * FROM task_data WHERE id = ${req.params.id}`;
    res.json(result[0] || null);
  } catch (err) {
    res.status(500).json({ error: '查询失败' });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`🚀 API 服务器运行在 http://localhost:${PORT}`);
  await initDB();
});
