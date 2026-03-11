import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET(request: NextRequest) {
  await dbReady();
  const client = db();
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') || '50');
  const offset = Number(url.searchParams.get('offset') || '0');
  const status = url.searchParams.get('status');

  let sql = `SELECT bi.*, v.name as vendor_name, v.email as vendor_email,
    b.title as bid_title
    FROM bid_invitations bi
    JOIN vendors v ON v.id = bi.vendor_id
    JOIN bids b ON b.id = bi.bid_id`;
  const args: any[] = [];

  if (status) {
    sql += ' WHERE bi.status = ?';
    args.push(status);
  }

  sql += ' ORDER BY bi.sent_at DESC LIMIT ? OFFSET ?';
  args.push(limit, offset);

  const result = await client.execute({ sql, args });

  let countSql = 'SELECT COUNT(*) as count FROM bid_invitations';
  const countArgs: any[] = [];
  if (status) {
    countSql += ' WHERE status = ?';
    countArgs.push(status);
  }
  const total = await client.execute({ sql: countSql, args: countArgs });

  return NextResponse.json({
    invitations: result.rows,
    total: Number(total.rows[0].count),
  });
}
