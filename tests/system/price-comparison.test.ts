/**
 * System Tests: Price Comparison
 * Tests the price comparison logic used by the customer view.
 * Maps to: P6 (Winner Selection & Comparison) + current POC comparison
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

// Simulates the client-side price calculation for a given selection
function getPriceForSelection(
  response: any,
  prices: any[],
  selectedOptions: Record<string, string>
): number | null {
  if (response.pricing_mode === 'combination') {
    const key = JSON.stringify(
      Object.fromEntries(Object.entries(selectedOptions).sort(([a], [b]) => a.localeCompare(b)))
    );
    const match = prices.find((p: any) => p.combination_key === key);
    return match ? match.price : null;
  } else {
    // Additive
    let total = response.base_price || 0;
    for (const [param, option] of Object.entries(selectedOptions)) {
      const key = JSON.stringify({ param, option });
      const addition = prices.find((p: any) => p.combination_key === key);
      if (addition) total += addition.price;
    }

    // Apply rules
    const rules = response.rules ? (typeof response.rules === 'string' ? JSON.parse(response.rules) : response.rules) : [];
    for (const rule of rules) {
      const conditionMet = selectedOptions[rule.conditionParam] === rule.conditionOption;
      if (!conditionMet) continue;

      if (rule.targetType === 'total') {
        if (rule.discountType === 'percentage') {
          total = total * (1 - rule.discountValue / 100);
        } else {
          total = total - rule.discountValue;
        }
      } else if (rule.targetType === 'param_option') {
        const targetKey = JSON.stringify({ param: rule.targetParam, option: rule.targetOption });
        const targetAddition = prices.find((p: any) => p.combination_key === targetKey);
        const targetAmount = targetAddition ? targetAddition.price : 0;
        if (rule.discountType === 'percentage') {
          total = total - targetAmount * (rule.discountValue / 100);
        } else {
          total = total - Math.min(rule.discountValue, targetAmount);
        }
      }
    }

    return Math.max(0, total);
  }
}

describe('Combination Mode Comparison', () => {
  it('should find price for exact combination', () => {
    const bidId = seedBid(db);
    const responseId = seedCombinationResponse(db, bidId, {
      vendorName: 'Acme',
      prices: [
        { combination_key: '{"Color":"Red","Size":"M"}', price: 150 },
        { combination_key: '{"Color":"Blue","Size":"L"}', price: 200 },
      ],
    });

    const response = db.prepare('SELECT * FROM vendor_responses WHERE id = ?').get(responseId) as any;
    const prices = db.prepare('SELECT * FROM vendor_prices WHERE response_id = ?').all(responseId) as any[];

    expect(getPriceForSelection(response, prices, { Color: 'Red', Size: 'M' })).toBe(150);
    expect(getPriceForSelection(response, prices, { Color: 'Blue', Size: 'L' })).toBe(200);
  });

  it('should return null for missing combination', () => {
    const bidId = seedBid(db);
    const responseId = seedCombinationResponse(db, bidId, {
      prices: [{ combination_key: '{"Color":"Red","Size":"S"}', price: 100 }],
    });

    const response = db.prepare('SELECT * FROM vendor_responses WHERE id = ?').get(responseId) as any;
    const prices = db.prepare('SELECT * FROM vendor_prices WHERE response_id = ?').all(responseId) as any[];

    expect(getPriceForSelection(response, prices, { Color: 'Blue', Size: 'L' })).toBeNull();
  });

  it('should sort combination keys alphabetically for matching', () => {
    const bidId = seedBid(db);
    const responseId = seedCombinationResponse(db, bidId, {
      prices: [{ combination_key: '{"Color":"Red","Size":"S"}', price: 100 }],
    });

    const response = db.prepare('SELECT * FROM vendor_responses WHERE id = ?').get(responseId) as any;
    const prices = db.prepare('SELECT * FROM vendor_prices WHERE response_id = ?').all(responseId) as any[];

    // Even if user selects Size first, then Color - key should be sorted
    expect(getPriceForSelection(response, prices, { Size: 'S', Color: 'Red' })).toBe(100);
  });
});

describe('Cross-Mode Comparison', () => {
  it('should compare prices across combination and additive vendors', () => {
    const bidId = seedBid(db, {
      parameters: [
        { name: 'Color', options: ['Red', 'Blue'] },
        { name: 'Size', options: ['S', 'M'] },
      ],
    });

    // Vendor A: combination mode
    const comboId = seedCombinationResponse(db, bidId, {
      vendorName: 'Combo Vendor',
      prices: [
        { combination_key: '{"Color":"Red","Size":"S"}', price: 100 },
        { combination_key: '{"Color":"Red","Size":"M"}', price: 130 },
        { combination_key: '{"Color":"Blue","Size":"S"}', price: 110 },
        { combination_key: '{"Color":"Blue","Size":"M"}', price: 140 },
      ],
    });

    // Vendor B: additive mode (base 80 + Color Red +10/Blue +20 + Size S +0/M +30)
    const addId = seedAdditiveResponse(db, bidId, {
      vendorName: 'Additive Vendor',
      basePrice: 80,
      prices: [
        { combination_key: '{"param":"Color","option":"Red"}', price: 10 },
        { combination_key: '{"param":"Color","option":"Blue"}', price: 20 },
        { combination_key: '{"param":"Size","option":"S"}', price: 0 },
        { combination_key: '{"param":"Size","option":"M"}', price: 30 },
      ],
    });

    const responses = db.prepare('SELECT * FROM vendor_responses WHERE bid_id = ?').all(bidId) as any[];
    const selection = { Color: 'Red', Size: 'S' };

    const results: { vendor: string; price: number | null; mode: string }[] = [];

    for (const resp of responses) {
      const prices = db.prepare('SELECT * FROM vendor_prices WHERE response_id = ?').all(resp.id) as any[];
      const price = getPriceForSelection(resp, prices, selection);
      results.push({ vendor: resp.vendor_name, price, mode: resp.pricing_mode });
    }

    // Sort by price ascending (as the customer view does)
    results.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

    // Additive: 80 + 10 + 0 = 90 (cheaper)
    // Combination: 100
    expect(results[0].vendor).toBe('Additive Vendor');
    expect(results[0].price).toBe(90);
    expect(results[0].mode).toBe('additive');

    expect(results[1].vendor).toBe('Combo Vendor');
    expect(results[1].price).toBe(100);
    expect(results[1].mode).toBe('combination');
  });

  it('should handle additive vendor with discount beating combination vendor', () => {
    const bidId = seedBid(db, {
      parameters: [
        { name: 'Material', options: ['Wood', 'Steel'] },
        { name: 'Color', options: ['Red', 'Blue'] },
      ],
    });

    // Combo vendor: Wood+Red = 200
    seedCombinationResponse(db, bidId, {
      vendorName: 'Combo',
      prices: [{ combination_key: '{"Color":"Red","Material":"Wood"}', price: 200 }],
    });

    // Additive vendor: base 180 + Wood +20 + Red +10 = 210, but 10% off when Wood -> 210 * 0.9 = 189
    seedAdditiveResponse(db, bidId, {
      vendorName: 'Additive',
      basePrice: 180,
      prices: [
        { combination_key: '{"param":"Material","option":"Wood"}', price: 20 },
        { combination_key: '{"param":"Color","option":"Red"}', price: 10 },
      ],
      rules: [{ conditionParam: 'Material', conditionOption: 'Wood', targetType: 'total', targetParam: '', targetOption: '', discountType: 'percentage', discountValue: 10 }],
    });

    const responses = db.prepare('SELECT * FROM vendor_responses WHERE bid_id = ?').all(bidId) as any[];
    const selection = { Material: 'Wood', Color: 'Red' };

    const results: { vendor: string; price: number | null }[] = [];
    for (const resp of responses) {
      const prices = db.prepare('SELECT * FROM vendor_prices WHERE response_id = ?').all(resp.id) as any[];
      results.push({ vendor: resp.vendor_name, price: getPriceForSelection(resp, prices, selection) });
    }

    results.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

    expect(results[0].vendor).toBe('Additive');
    expect(results[0].price).toBe(189);
    expect(results[1].vendor).toBe('Combo');
    expect(results[1].price).toBe(200);
  });
});

describe('Multiple Vendors Ranking', () => {
  it('should rank 5+ vendors by price for a selection', () => {
    const bidId = seedBid(db, {
      parameters: [{ name: 'Type', options: ['A', 'B'] }],
    });

    const expectedPrices = [50, 80, 120, 200, 300];
    for (let i = 0; i < 5; i++) {
      seedCombinationResponse(db, bidId, {
        vendorName: `Vendor ${i}`,
        prices: [
          { combination_key: '{"Type":"A"}', price: expectedPrices[i] },
          { combination_key: '{"Type":"B"}', price: expectedPrices[i] + 10 },
        ],
      });
    }

    const responses = db.prepare('SELECT * FROM vendor_responses WHERE bid_id = ?').all(bidId) as any[];
    const results: number[] = [];

    for (const resp of responses) {
      const prices = db.prepare('SELECT * FROM vendor_prices WHERE response_id = ?').all(resp.id) as any[];
      const price = getPriceForSelection(resp, prices, { Type: 'A' });
      if (price !== null) results.push(price);
    }

    results.sort((a, b) => a - b);
    expect(results).toEqual([50, 80, 120, 200, 300]);
  });
});
