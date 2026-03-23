/**
 * GET /api/tasks - 获取所有任务
 * POST /api/tasks - 创建新任务
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initDB } from '../_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await initDB();

  try {
    if (req.method === 'GET') {
      const result = await sql`SELECT * FROM task_data ORDER BY created_at DESC`;
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const { filename, data, author } = req.body;

      if (!data) {
        return res.status(400).json({ success: false, error: '缺少 data 字段' });
      }

      const result = await sql`
        INSERT INTO task_data (filename, data, author)
        VALUES (${filename || 'unknown'}, ${JSON.stringify(data)}, ${author || null})
        RETURNING id
      `;

      return res.status(201).json({
        success: true,
        id: result[0].id,
        filename,
        author
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('API error:', err);
    return res.status(500).json({ error: err?.message || '服务器错误' });
  }
}
