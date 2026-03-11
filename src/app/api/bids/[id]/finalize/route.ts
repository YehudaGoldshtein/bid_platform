import { NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function POST(
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

    if (bid.status === 'awarded') {
      return NextResponse.json({ error: 'Bid already finalized' }, { status: 400 });
    }

    if (bid.status === 'draft') {
      return NextResponse.json({ error: 'Cannot finalize a draft bid' }, { status: 400 });
    }

    // Check winner exists
    const winner = await db().execute({ sql: 'SELECT * FROM bid_winners WHERE bid_id = ?', args: [id] });
    if (winner.rows.length === 0) {
      return NextResponse.json({ error: 'Must select a winner before finalizing' }, { status: 400 });
    }

    // Finalize: update status and expire pending invitations
    await db().batch([
      {
        sql: "UPDATE bids SET status = 'awarded' WHERE id = ?",
        args: [id],
      },
      {
        sql: "UPDATE bid_invitations SET status = 'expired' WHERE bid_id = ? AND status IN ('pending', 'opened')",
        args: [id],
      },
    ], 'write');

    return NextResponse.json({ finalized: true, bid_id: id });
  } catch (error) {
    console.error('Error finalizing bid:', error);
    return NextResponse.json({ error: 'Failed to finalize bid' }, { status: 500 });
  }
}
