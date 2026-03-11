import { NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbReady();
    const { id } = await params;

    const bidResult = await db().execute({ sql: 'SELECT * FROM bids WHERE id = ?', args: [id] });
    if (bidResult.rows.length === 0) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    const bid = bidResult.rows[0];

    // Get parameters
    const paramsResult = await db().execute({
      sql: 'SELECT * FROM bid_parameters WHERE bid_id = ? ORDER BY sort_order',
      args: [id],
    });
    const paramNames = paramsResult.rows.map(p => p.name as string);

    // Get all responses with prices
    const responses = await db().execute({
      sql: 'SELECT * FROM vendor_responses WHERE bid_id = ? ORDER BY vendor_name',
      args: [id],
    });

    const rows: string[] = [];
    const header = ['Vendor', ...paramNames, 'Price'];
    rows.push(header.join(','));

    for (const resp of responses.rows) {
      const prices = await db().execute({
        sql: 'SELECT * FROM vendor_prices WHERE response_id = ?',
        args: [resp.id as string],
      });

      for (const price of prices.rows) {
        let combo: Record<string, string> = {};
        try { combo = JSON.parse(price.combination_key as string); } catch {}

        const row = [
          `"${resp.vendor_name}"`,
          ...paramNames.map(p => `"${combo[p] || ''}"`),
          String(price.price),
        ];
        rows.push(row.join(','));
      }
    }

    const csv = rows.join('\n') + '\n';
    const filename = `${(bid.title as string).replace(/[^a-zA-Z0-9]/g, '_')}_export.csv`;

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting bid:', error);
    return NextResponse.json({ error: 'Failed to export bid' }, { status: 500 });
  }
}
