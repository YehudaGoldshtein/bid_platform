import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, dbReady } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbReady();

    const { id } = await params;

    const bidResult = await db().execute({
      sql: 'SELECT * FROM bids WHERE id = ?',
      args: [id],
    });

    if (bidResult.rows.length === 0) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    const body = await request.json();
    const { vendor_name, prices, pricing_mode, base_price, rules } = body;

    if (!vendor_name || !prices || !Array.isArray(prices)) {
      return NextResponse.json(
        { error: 'Missing required fields: vendor_name, prices' },
        { status: 400 }
      );
    }

    const mode = pricing_mode === 'additive' ? 'additive' : 'combination';

    if (mode === 'additive' && (base_price === undefined || base_price === null)) {
      return NextResponse.json(
        { error: 'base_price is required for additive pricing mode' },
        { status: 400 }
      );
    }

    const responseId = crypto.randomUUID();
    const rulesJson = mode === 'additive' && rules ? JSON.stringify(rules) : null;

    const statements: { sql: string; args: (string | number | null)[] }[] = [
      {
        sql: 'INSERT INTO vendor_responses (id, bid_id, vendor_name, pricing_mode, base_price, rules) VALUES (?, ?, ?, ?, ?, ?)',
        args: [responseId, id, vendor_name, mode, mode === 'additive' ? base_price : null, rulesJson],
      },
    ];

    for (const priceEntry of prices) {
      const priceId = crypto.randomUUID();
      statements.push({
        sql: 'INSERT INTO vendor_prices (id, response_id, combination_key, price) VALUES (?, ?, ?, ?)',
        args: [priceId, responseId, priceEntry.combination_key, priceEntry.price],
      });
    }

    await db().batch(statements, 'write');

    const createdResponseResult = await db().execute({
      sql: 'SELECT * FROM vendor_responses WHERE id = ?',
      args: [responseId],
    });

    const createdPricesResult = await db().execute({
      sql: 'SELECT * FROM vendor_prices WHERE response_id = ?',
      args: [responseId],
    });

    return NextResponse.json(
      { ...createdResponseResult.rows[0], prices: createdPricesResult.rows },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating vendor response:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor response' },
      { status: 500 }
    );
  }
}
