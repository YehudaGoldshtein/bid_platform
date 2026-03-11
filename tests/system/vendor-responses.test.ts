/**
 * System Tests: Vendor Response Submission
 * Tests requirements for vendor pricing (combination + additive modes).
 * Maps to: POC features + P4-04 (multiple named options)
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { getTestDb, cleanupTestDb, seedBid, seedCombinationResponse, seedAdditiveResponse } from '../helpers/test-db';

let db: Database.Database;

beforeEach(() => {
  db = getTestDb();
});

afterAll(() => {
  if (db?.open) db.close();
  cleanupTestDb();
});

describe('Combination Mode Pricing', () => {
  it('should store a combination mode response', () => {
    const bidId = seedBid(db);
    const responseId = seedCombinationResponse(db, bidId, {
      vendorName: 'Acme Corp',
      prices: [
        { combination_key: '{"Color":"Red","Size":"S"}', price: 100 },
        { combination_key: '{"Color":"Red","Size":"M"}', price: 120 },
        { combination_key: '{"Color":"Blue","Size":"S"}', price: 110 },
      ],
    });

    const response = db.prepare('SELECT * FROM vendor_responses WHERE id = ?').get(responseId) as any;
    expect(response.vendor_name).toBe('Acme Corp');
    expect(response.pricing_mode).toBe('combination');
    expect(response.base_price).toBeNull();

    const prices = db.prepare('SELECT * FROM vendor_prices WHERE response_id = ?').all(responseId) as any[];
    expect(prices).toHaveLength(3);
  });

  it('should store combination keys as sorted JSON', () => {
    const bidId = seedBid(db);
    const responseId = seedCombinationResponse(db, bidId, {
      prices: [{ combination_key: '{"Color":"Red","Size":"S"}', price: 100 }],
    });

    const price = db.prepare('SELECT * FROM vendor_prices WHERE response_id = ?').get(responseId) as any;
    const parsed = JSON.parse(price.combination_key);
    const keys = Object.keys(parsed);
    expect(keys).toEqual([...keys].sort());
  });

  it('should allow exact price lookup by combination key', () => {
    const bidId = seedBid(db);
    const responseId = seedCombinationResponse(db, bidId, {
      prices: [
        { combination_key: '{"Color":"Red","Size":"M"}', price: 120 },
        { combination_key: '{"Color":"Blue","Size":"L"}', price: 160 },
      ],
    });

    const price = db.prepare(
      'SELECT price FROM vendor_prices WHERE response_id = ? AND combination_key = ?'
    ).get(responseId, '{"Color":"Blue","Size":"L"}') as any;

    expect(price.price).toBe(160);
  });

  it('should support full cartesian product of prices', () => {
    const bidId = seedBid(db, {
      parameters: [
        { name: 'A', options: ['1', '2'] },
        { name: 'B', options: ['X', 'Y'] },
        { name: 'C', options: ['P', 'Q'] },
      ],
    });

    // 2 x 2 x 2 = 8 combinations
    const prices = [];
    for (const a of ['1', '2']) {
      for (const b of ['X', 'Y']) {
        for (const c of ['P', 'Q']) {
          prices.push({
            combination_key: JSON.stringify({ A: a, B: b, C: c }),
            price: Math.random() * 1000,
          });
        }
      }
    }

    const responseId = seedCombinationResponse(db, bidId, { prices });
    const stored = db.prepare('SELECT * FROM vendor_prices WHERE response_id = ?').all(responseId);
    expect(stored).toHaveLength(8);
  });
});

describe('Additive Mode Pricing', () => {
  it('should store an additive mode response with base price', () => {
    const bidId = seedBid(db);
    const responseId = seedAdditiveResponse(db, bidId, {
      vendorName: 'Beta Inc',
      basePrice: 200,
    });

    const response = db.prepare('SELECT * FROM vendor_responses WHERE id = ?').get(responseId) as any;
    expect(response.pricing_mode).toBe('additive');
    expect(response.base_price).toBe(200);
    expect(response.vendor_name).toBe('Beta Inc');
  });

  it('should store per-option addition prices', () => {
    const bidId = seedBid(db);
    const responseId = seedAdditiveResponse(db, bidId, {
      basePrice: 100,
      prices: [
        { combination_key: '{"param":"Color","option":"Red"}', price: 10 },
        { combination_key: '{"param":"Color","option":"Blue"}', price: 20 },
        { combination_key: '{"param":"Size","option":"S"}', price: 0 },
        { combination_key: '{"param":"Size","option":"M"}', price: 15 },
      ],
    });

    const prices = db.prepare('SELECT * FROM vendor_prices WHERE response_id = ?').all(responseId) as any[];
    expect(prices).toHaveLength(4);

    // Verify additive key format
    for (const p of prices) {
      const key = JSON.parse(p.combination_key);
      expect(key).toHaveProperty('param');
      expect(key).toHaveProperty('option');
    }
  });

  it('should calculate additive price correctly (base + additions)', () => {
    const bidId = seedBid(db);
    const basePrice = 100;
    const responseId = seedAdditiveResponse(db, bidId, {
      basePrice,
      prices: [
        { combination_key: '{"param":"Color","option":"Red"}', price: 10 },
        { combination_key: '{"param":"Color","option":"Blue"}', price: 20 },
        { combination_key: '{"param":"Size","option":"S"}', price: 0 },
        { combination_key: '{"param":"Size","option":"M"}', price: 15 },
        { combination_key: '{"param":"Size","option":"L"}', price: 30 },
      ],
    });

    const response = db.prepare('SELECT * FROM vendor_responses WHERE id = ?').get(responseId) as any;
    const prices = db.prepare('SELECT * FROM vendor_prices WHERE response_id = ?').all(responseId) as any[];

    // Simulate: Red + M = 100 + 10 + 15 = 125
    const selectedOptions = { Color: 'Red', Size: 'M' };
    let total = response.base_price;

    for (const [param, option] of Object.entries(selectedOptions)) {
      const key = JSON.stringify({ param, option });
      const addition = prices.find((p: any) => p.combination_key === key);
      if (addition) total += addition.price;
    }

    expect(total).toBe(125);
  });

  it('should support zero additions (all options free)', () => {
    const bidId = seedBid(db);
    const responseId = seedAdditiveResponse(db, bidId, {
      basePrice: 500,
      prices: [
        { combination_key: '{"param":"Color","option":"Red"}', price: 0 },
        { combination_key: '{"param":"Size","option":"S"}', price: 0 },
      ],
    });

    const response = db.prepare('SELECT * FROM vendor_responses WHERE id = ?').get(responseId) as any;
    const prices = db.prepare('SELECT * FROM vendor_prices WHERE response_id = ?').all(responseId) as any[];

    let total = response.base_price;
    for (const p of prices) {
      total += (p as any).price;
    }
    // All additions are 0, total = base
    expect(total).toBe(500);
  });
});

describe('Multiple Vendor Responses', () => {
  it('should allow multiple vendors to respond to same bid', () => {
    const bidId = seedBid(db);
    seedCombinationResponse(db, bidId, { vendorName: 'Vendor A' });
    seedCombinationResponse(db, bidId, { vendorName: 'Vendor B' });
    seedAdditiveResponse(db, bidId, { vendorName: 'Vendor C' });

    const responses = db.prepare('SELECT * FROM vendor_responses WHERE bid_id = ?').all(bidId);
    expect(responses).toHaveLength(3);
  });

  it('should track vendor response count per bid', () => {
    const bidId = seedBid(db);
    seedCombinationResponse(db, bidId, { vendorName: 'V1' });
    seedCombinationResponse(db, bidId, { vendorName: 'V2' });

    const count = (db.prepare('SELECT COUNT(*) as count FROM vendor_responses WHERE bid_id = ?').get(bidId) as any).count;
    expect(count).toBe(2);
  });

  it('should allow same vendor to submit multiple times', () => {
    const bidId = seedBid(db);
    seedCombinationResponse(db, bidId, { vendorName: 'Same Vendor' });
    seedCombinationResponse(db, bidId, { vendorName: 'Same Vendor' });

    const responses = db.prepare('SELECT * FROM vendor_responses WHERE bid_id = ? AND vendor_name = ?').all(bidId, 'Same Vendor');
    expect(responses).toHaveLength(2);
  });

  it('should allow mixed pricing modes for different vendors', () => {
    const bidId = seedBid(db);
    seedCombinationResponse(db, bidId, { vendorName: 'Combo Vendor' });
    seedAdditiveResponse(db, bidId, { vendorName: 'Additive Vendor' });

    const responses = db.prepare('SELECT * FROM vendor_responses WHERE bid_id = ? ORDER BY vendor_name').all(bidId) as any[];
    expect(responses[0].pricing_mode).toBe('additive');
    expect(responses[1].pricing_mode).toBe('combination');
  });

  it('should cascade delete responses when bid is deleted', () => {
    const bidId = seedBid(db);
    const responseId = seedCombinationResponse(db, bidId);

    db.prepare('DELETE FROM bids WHERE id = ?').run(bidId);

    const responses = db.prepare('SELECT * FROM vendor_responses WHERE bid_id = ?').all(bidId);
    expect(responses).toHaveLength(0);

    const prices = db.prepare('SELECT * FROM vendor_prices WHERE response_id = ?').all(responseId);
    expect(prices).toHaveLength(0);
  });
});
