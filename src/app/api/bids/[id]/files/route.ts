import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bid = db.prepare('SELECT * FROM bids WHERE id = ?').get(id);

    if (!bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    const files = db
      .prepare('SELECT id, filename FROM bid_files WHERE bid_id = ?')
      .all(id) as any[];

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bid = db.prepare('SELECT * FROM bids WHERE id = ?').get(id);

    if (!bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const insertFile = db.prepare(
      'INSERT INTO bid_files (id, bid_id, filename, data) VALUES (?, ?, ?, ?)'
    );

    const fileEntries: { id: string; filename: string; buffer: Buffer }[] = [];

    for (const file of files) {
      if (!(file instanceof File)) {
        continue;
      }

      const fileId = crypto.randomUUID();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      fileEntries.push({ id: fileId, filename: file.name, buffer });
    }

    const insertTransaction = db.transaction(() => {
      for (const entry of fileEntries) {
        insertFile.run(entry.id, id, entry.filename, entry.buffer);
      }
    });

    insertTransaction();

    const result = fileEntries.map((entry) => ({
      id: entry.id,
      filename: entry.filename,
    }));

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}
