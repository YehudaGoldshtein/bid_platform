import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET(request: NextRequest) {
  await dbReady();
  const client = db();
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') || '50');
  const offset = Number(url.searchParams.get('offset') || '0');
  const status = url.searchParams.get('status');

  let sql = `SELECT b.*, p.name as project_name FROM bids b
    LEFT JOIN projects p ON p.id = b.project_id`;
  const args: any[] = [];

  if (status) {
    sql += ' WHERE b.status = ?';
    args.push(status);
  }

  sql += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
  args.push(limit, offset);

  const result = await client.execute({ sql, args });

  let countSql = 'SELECT COUNT(*) as count FROM bids';
  const countArgs: any[] = [];
  if (status) {
    countSql += ' WHERE status = ?';
    countArgs.push(status);
  }
  const total = await client.execute({ sql: countSql, args: countArgs });

  return NextResponse.json({
    bids: result.rows,
    total: Number(total.rows[0].count),
  });
}
