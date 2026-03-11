import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb, seedProject, seedBid, seedVendor, seedVendorResponse } from '../helpers/test-db';
import type Database from 'better-sqlite3';

// Simulates the CSV export logic that will live in the API
function exportBidCSV(db: Database.Database, bidId: string): { error?: string; csv?: string } {
  const bid = db.prepare('SELECT * FROM bids WHERE id = ?').get(bidId) as any;
  if (!bid) return { error: 'Bid not found' };

  // Get parameters
  const params = db.prepare('SELECT * FROM bid_parameters WHERE bid_id = ? ORDER BY sort_order').all(bidId) as any[];
  const paramNames = params.map((p: any) => p.name as string);

  // Get all responses with prices
  const responses = db.prepare('SELECT * FROM vendor_responses WHERE bid_id = ? ORDER BY vendor_name').all(bidId) as any[];

  if (responses.length === 0) {
    // Header only
    const header = ['Vendor', ...paramNames, 'Price'].join(',');
    return { csv: header + '\n' };
  }

  const rows: string[] = [];
  const header = ['Vendor', ...paramNames, 'Price'];
  rows.push(header.join(','));

  for (const resp of responses) {
    const prices = db.prepare('SELECT * FROM vendor_prices WHERE response_id = ?').all(resp.id) as any[];

    for (const price of prices) {
      let combo: Record<string, string> = {};
      try { combo = JSON.parse(price.combination_key); } catch {}

      const row = [
        `"${resp.vendor_name}"`,
        ...paramNames.map(p => `"${combo[p] || ''}"`),
        price.price.toString(),
      ];
      rows.push(row.join(','));
    }
  }

  return { csv: rows.join('\n') + '\n' };
}

describe('CSV Export', () => {
  let db: Database.Database;
  let projectId: string;
  let bidId: string;

  beforeEach(() => {
    db = getTestDb();
    projectId = seedProject(db);
    bidId = seedBid(db, { project_id: projectId, status: 'active', parameters: [
      { name: 'Color', options: ['Red', 'Blue'] },
      { name: 'Size', options: ['S', 'L'] },
    ]});
  });

  it('should export header for bid with no responses', () => {
    const result = exportBidCSV(db, bidId);
    expect(result.csv).toBe('Vendor,Color,Size,Price\n');
  });

  it('should return error for nonexistent bid', () => {
    const result = exportBidCSV(db, 'nonexistent');
    expect(result.error).toBe('Bid not found');
  });

  it('should export single vendor single price', () => {
    const v = seedVendor(db, { name: 'Acme', email: 'acme@test.com' });
    seedVendorResponse(db, bidId, v, {
      vendorName: 'Acme',
      prices: [{ combination_key: '{"Color":"Red","Size":"S"}', price: 100 }],
    });
    const result = exportBidCSV(db, bidId);
    const lines = result.csv!.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('Vendor,Color,Size,Price');
    expect(lines[1]).toBe('"Acme","Red","S",100');
  });

  it('should export multiple vendors', () => {
    const v1 = seedVendor(db, { name: 'Alpha', email: 'a@test.com' });
    const v2 = seedVendor(db, { name: 'Beta', email: 'b@test.com' });
    seedVendorResponse(db, bidId, v1, {
      vendorName: 'Alpha',
      prices: [{ combination_key: '{"Color":"Red","Size":"S"}', price: 100 }],
    });
    seedVendorResponse(db, bidId, v2, {
      vendorName: 'Beta',
      prices: [{ combination_key: '{"Color":"Red","Size":"S"}', price: 120 }],
    });
    const result = exportBidCSV(db, bidId);
    const lines = result.csv!.trim().split('\n');
    expect(lines).toHaveLength(3);
    // Alpha comes before Beta alphabetically
    expect(lines[1]).toContain('"Alpha"');
    expect(lines[2]).toContain('"Beta"');
  });

  it('should export multiple combinations per vendor', () => {
    const v = seedVendor(db, { name: 'Multi', email: 'm@test.com' });
    seedVendorResponse(db, bidId, v, {
      vendorName: 'Multi',
      prices: [
        { combination_key: '{"Color":"Red","Size":"S"}', price: 100 },
        { combination_key: '{"Color":"Red","Size":"L"}', price: 130 },
        { combination_key: '{"Color":"Blue","Size":"S"}', price: 110 },
      ],
    });
    const result = exportBidCSV(db, bidId);
    const lines = result.csv!.trim().split('\n');
    expect(lines).toHaveLength(4); // header + 3 rows
  });

  it('should export bid with no parameters', () => {
    const noBid = seedBid(db, { project_id: projectId, status: 'active', parameters: [] });
    const v = seedVendor(db, { name: 'Simple', email: 's@test.com' });
    seedVendorResponse(db, noBid, v, {
      vendorName: 'Simple',
      prices: [{ combination_key: '{}', price: 500 }],
    });
    const result = exportBidCSV(db, noBid);
    const lines = result.csv!.trim().split('\n');
    expect(lines[0]).toBe('Vendor,Price');
    expect(lines[1]).toBe('"Simple",500');
  });

  it('should properly quote vendor names with commas', () => {
    const v = seedVendor(db, { name: 'Smith, Jones & Co', email: 'sj@test.com' });
    seedVendorResponse(db, bidId, v, {
      vendorName: 'Smith, Jones & Co',
      prices: [{ combination_key: '{"Color":"Red","Size":"S"}', price: 200 }],
    });
    const result = exportBidCSV(db, bidId);
    expect(result.csv).toContain('"Smith, Jones & Co"');
  });
});
