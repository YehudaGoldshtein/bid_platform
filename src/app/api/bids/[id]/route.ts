import { NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbReady;

    const { id } = await params;

    const bidResult = await db.execute({
      sql: 'SELECT * FROM bids WHERE id = ?',
      args: [id],
    });
    const bid = bidResult.rows[0];

    if (!bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    const parametersResult = await db.execute({
      sql: 'SELECT * FROM bid_parameters WHERE bid_id = ?',
      args: [id],
    });

    const parametersWithOptions = await Promise.all(
      parametersResult.rows.map(async (param) => {
        const optionsResult = await db.execute({
          sql: 'SELECT value FROM bid_parameter_options WHERE parameter_id = ? ORDER BY sort_order',
          args: [param.id as string],
        });
        return {
          name: param.name,
          options: optionsResult.rows.map((o) => o.value),
        };
      })
    );

    const filesResult = await db.execute({
      sql: 'SELECT id, filename FROM bid_files WHERE bid_id = ?',
      args: [id],
    });

    const vendorResponsesResult = await db.execute({
      sql: 'SELECT * FROM vendor_responses WHERE bid_id = ?',
      args: [id],
    });

    const responsesWithPrices = await Promise.all(
      vendorResponsesResult.rows.map(async (response) => {
        const pricesResult = await db.execute({
          sql: 'SELECT * FROM vendor_prices WHERE response_id = ?',
          args: [response.id as string],
        });
        return {
          ...response,
          rules: response.rules ? JSON.parse(response.rules as string) : [],
          prices: pricesResult.rows,
        };
      })
    );

    return NextResponse.json({
      ...bid,
      parameters: parametersWithOptions,
      files: filesResult.rows,
      vendor_responses: responsesWithPrices,
    });
  } catch (error) {
    console.error('Error fetching bid:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bid' },
      { status: 500 }
    );
  }
}
