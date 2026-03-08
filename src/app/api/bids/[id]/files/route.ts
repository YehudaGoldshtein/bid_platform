import { NextResponse } from 'next/server';
import crypto from 'crypto';
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

    if (bidResult.rows.length === 0) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    const filesResult = await db.execute({
      sql: 'SELECT id, filename FROM bid_files WHERE bid_id = ?',
      args: [id],
    });

    return NextResponse.json(filesResult.rows);
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
    await dbReady;

    const { id } = await params;

    const bidResult = await db.execute({
      sql: 'SELECT * FROM bids WHERE id = ?',
      args: [id],
    });

    if (bidResult.rows.length === 0) {
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

    const statements: { sql: string; args: (string | ArrayBuffer)[] }[] = [];
    const fileEntries: { id: string; filename: string }[] = [];

    for (const file of files) {
      if (!(file instanceof File)) {
        continue;
      }

      const fileId = crypto.randomUUID();
      const arrayBuffer = await file.arrayBuffer();

      statements.push({
        sql: 'INSERT INTO bid_files (id, bid_id, filename, data) VALUES (?, ?, ?, ?)',
        args: [fileId, id, file.name, arrayBuffer],
      });

      fileEntries.push({ id: fileId, filename: file.name });
    }

    if (statements.length > 0) {
      await db.batch(statements, 'write');
    }

    return NextResponse.json(fileEntries, { status: 201 });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}
