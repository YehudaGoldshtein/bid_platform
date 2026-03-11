import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET(request: NextRequest) {
  await dbReady();
  const client = db();
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') || '50');
  const offset = Number(url.searchParams.get('offset') || '0');
  const status = url.searchParams.get('status');

  let sql = `SELECT v.*, tc.name as trade_name FROM vendors v
    LEFT JOIN trade_categories tc ON tc.id = v.trade_category`;
  const args: any[] = [];

  if (status) {
    sql += ' WHERE v.status = ?';
    args.push(status);
  }

  sql += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
  args.push(limit, offset);

  const result = await client.execute({ sql, args });

  let countSql = 'SELECT COUNT(*) as count FROM vendors';
  const countArgs: any[] = [];
  if (status) {
    countSql += ' WHERE status = ?';
    countArgs.push(status);
  }
  const total = await client.execute({ sql: countSql, args: countArgs });

  return NextResponse.json({
    vendors: result.rows,
    total: Number(total.rows[0].count),
  });
}
