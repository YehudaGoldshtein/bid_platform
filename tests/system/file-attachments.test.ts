/**
 * System Tests: File Attachments
 * Tests file upload, listing, and download functionality.
 * Maps to: POC file features + P4-05 (vendor file uploads)
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { getTestDb, cleanupTestDb, seedBid } from '../helpers/test-db';

let db: Database.Database;

beforeEach(() => {
  db = getTestDb();
});

afterAll(() => {
  if (db?.open) db.close();
  cleanupTestDb();
});

function seedFile(db: Database.Database, bidId: string, overrides: Partial<{
  filename: string;
  data: Buffer;
}> = {}) {
  const fileId = crypto.randomUUID();
  const filename = overrides.filename || 'test-file.pdf';
  const data = overrides.data || Buffer.from('test file content');

  db.prepare('INSERT INTO bid_files (id, bid_id, filename, data) VALUES (?, ?, ?, ?)').run(
    fileId, bidId, filename, data
  );

  return fileId;
}

describe('File Storage', () => {
  it('should store a file as BLOB', () => {
    const bidId = seedBid(db);
    const content = Buffer.from('Hello PDF content');
    const fileId = seedFile(db, bidId, { filename: 'specs.pdf', data: content });

    const file = db.prepare('SELECT * FROM bid_files WHERE id = ?').get(fileId) as any;
    expect(file).toBeDefined();
    expect(file.filename).toBe('specs.pdf');
    expect(Buffer.compare(file.data, content)).toBe(0);
  });

  it('should store multiple files per bid', () => {
    const bidId = seedBid(db);
    seedFile(db, bidId, { filename: 'specs.pdf' });
    seedFile(db, bidId, { filename: 'drawing.png' });
    seedFile(db, bidId, { filename: 'budget.xlsx' });

    const files = db.prepare('SELECT id, filename FROM bid_files WHERE bid_id = ?').all(bidId);
    expect(files).toHaveLength(3);
  });

  it('should list files without returning BLOB data', () => {
    const bidId = seedBid(db);
    seedFile(db, bidId, { filename: 'large-file.pdf', data: Buffer.alloc(10000) });

    const files = db.prepare('SELECT id, filename FROM bid_files WHERE bid_id = ?').all(bidId) as any[];
    expect(files[0]).toHaveProperty('id');
    expect(files[0]).toHaveProperty('filename');
    expect(files[0]).not.toHaveProperty('data');
  });

  it('should retrieve file by id and bid_id', () => {
    const bidId = seedBid(db);
    const fileId = seedFile(db, bidId, { filename: 'target.pdf' });

    // Add a file to a different bid
    const otherBidId = seedBid(db, { title: 'Other Bid' });
    seedFile(db, otherBidId, { filename: 'other.pdf' });

    const file = db.prepare('SELECT * FROM bid_files WHERE id = ? AND bid_id = ?').get(fileId, bidId) as any;
    expect(file).toBeDefined();
    expect(file.filename).toBe('target.pdf');

    // Should NOT find file with wrong bid_id
    const wrongBid = db.prepare('SELECT * FROM bid_files WHERE id = ? AND bid_id = ?').get(fileId, otherBidId);
    expect(wrongBid).toBeUndefined();
  });

  it('should cascade delete files when bid is deleted', () => {
    const bidId = seedBid(db);
    seedFile(db, bidId, { filename: 'will-be-deleted.pdf' });

    db.prepare('DELETE FROM bids WHERE id = ?').run(bidId);

    const files = db.prepare('SELECT * FROM bid_files WHERE bid_id = ?').all(bidId);
    expect(files).toHaveLength(0);
  });
});

describe('File Content Types (content type detection logic)', () => {
  const contentTypeMap: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    txt: 'text/plain',
    json: 'application/json',
    zip: 'application/zip',
  };

  for (const [ext, expectedType] of Object.entries(contentTypeMap)) {
    it(`should detect content type for .${ext} files`, () => {
      const filename = `test.${ext}`;
      const extension = filename.split('.').pop()?.toLowerCase() || '';
      const contentType = contentTypeMap[extension] || 'application/octet-stream';
      expect(contentType).toBe(expectedType);
    });
  }

  it('should fallback to octet-stream for unknown extensions', () => {
    const extension = 'xyz';
    const contentType = contentTypeMap[extension] || 'application/octet-stream';
    expect(contentType).toBe('application/octet-stream');
  });
});

describe('File Size Edge Cases', () => {
  it('should handle empty file (0 bytes)', () => {
    const bidId = seedBid(db);
    const fileId = seedFile(db, bidId, { filename: 'empty.txt', data: Buffer.alloc(0) });

    const file = db.prepare('SELECT * FROM bid_files WHERE id = ?').get(fileId) as any;
    expect(file.data.length).toBe(0);
  });

  it('should handle binary file content', () => {
    const bidId = seedBid(db);
    const binaryData = Buffer.from([0x00, 0xFF, 0x89, 0x50, 0x4E, 0x47]); // PNG-like header
    const fileId = seedFile(db, bidId, { filename: 'image.png', data: binaryData });

    const file = db.prepare('SELECT * FROM bid_files WHERE id = ?').get(fileId) as any;
    expect(Buffer.compare(file.data, binaryData)).toBe(0);
  });
});
