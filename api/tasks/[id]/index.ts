/**
 * GET /api/tasks/:id - 获取单个任务
 * DELETE /api/tasks/:id - 删除任务
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initDB } from '../../_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const taskId = parseInt(id as string);

  if (isNaN(taskId)) {
    return res.status(400).json({ error: '无效的 ID' });
  }

  await initDB();

  try {
    if (req.method === 'GET') {
      const result = await sql`SELECT * FROM task_data WHERE id = ${taskId}`;
      return res.status(200).json(result[0] || null);
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM task_data WHERE id = ${taskId}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('API error:', err);
    return res.status(500).json({ error: err?.message || '服务器错误' });
  }
}
