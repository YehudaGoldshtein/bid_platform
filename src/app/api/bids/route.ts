import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';

export async function GET() {
  try {
    const bids = db.prepare('SELECT * FROM bids').all() as any[];

    const result = bids.map((bid) => {
      const parameters = db
        .prepare('SELECT * FROM bid_parameters WHERE bid_id = ?')
        .all(bid.id) as any[];

      const parametersWithOptions = parameters.map((param) => {
        const options = db
          .prepare('SELECT value FROM bid_parameter_options WHERE parameter_id = ? ORDER BY sort_order')
          .all(param.id) as any[];
        return { name: param.name, options: options.map((o: any) => o.value) };
      });

      const vendorResponseCount = (db
        .prepare('SELECT COUNT(*) as count FROM vendor_responses WHERE bid_id = ?')
        .get(bid.id) as any).count;

      return { ...bid, parameters: parametersWithOptions, vendor_response_count: vendorResponseCount };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching bids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, deadline, parameters } = body;

    if (!title || !description || !deadline) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, deadline' },
        { status: 400 }
      );
    }

    const bidId = crypto.randomUUID();

    const insertBid = db.prepare(
      'INSERT INTO bids (id, title, description, deadline) VALUES (?, ?, ?, ?)'
    );

    const insertParameter = db.prepare(
      'INSERT INTO bid_parameters (id, bid_id, name) VALUES (?, ?, ?)'
    );

    const insertOption = db.prepare(
      'INSERT INTO bid_parameter_options (id, parameter_id, value) VALUES (?, ?, ?)'
    );

    const transaction = db.transaction(() => {
      insertBid.run(bidId, title, description, deadline);

      if (parameters && Array.isArray(parameters)) {
        for (const param of parameters) {
          const paramId = crypto.randomUUID();
          insertParameter.run(paramId, bidId, param.name);

          if (param.options && Array.isArray(param.options)) {
            for (const option of param.options) {
              const optionId = crypto.randomUUID();
              insertOption.run(optionId, paramId, option);
            }
          }
        }
      }
    });

    transaction();

    const createdBid = db.prepare('SELECT * FROM bids WHERE id = ?').get(bidId);

    return NextResponse.json(createdBid, { status: 201 });
  } catch (error) {
    console.error('Error creating bid:', error);
    return NextResponse.json(
      { error: 'Failed to create bid' },
      { status: 500 }
    );
  }
}
