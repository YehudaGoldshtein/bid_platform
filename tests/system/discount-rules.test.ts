/**
 * System Tests: Conditional Discount Rules
 * Tests the discount rule system for additive pricing mode.
 * Maps to: POC discount rules feature
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { getTestDb, cleanupTestDb, seedBid, seedAdditiveResponse } from '../helpers/test-db';

let db: Database.Database;

beforeEach(() => {
  db = getTestDb();
});

afterAll(() => {
  if (db?.open) db.close();
  cleanupTestDb();
});

// Helper: calculate additive price with rules (mirrors client-side logic)
function calculateAdditivePrice(
  basePrice: number,
  selectedOptions: Record<string, string>,
  prices: { combination_key: string; price: number }[],
  rules: any[]
): number {
  // Step 1: base price
  let total = basePrice;

  // Step 2: add all selected option additions
  const additionMap: Record<string, number> = {};
  for (const [param, option] of Object.entries(selectedOptions)) {
    const key = JSON.stringify({ param, option });
    const addition = prices.find((p) => p.combination_key === key);
    const addAmount = addition ? addition.price : 0;
    additionMap[`${param}:${option}`] = addAmount;
    total += addAmount;
  }

  // Step 3+4: apply rules
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
      const targetKey = `${rule.targetParam}:${rule.targetOption}`;
      const targetAddition = additionMap[targetKey] || 0;
      if (rule.discountType === 'percentage') {
        total = total - targetAddition * (rule.discountValue / 100);
      } else {
        total = total - Math.min(rule.discountValue, targetAddition);
      }
    }
  }

  // Step 5: clamp to 0
  return Math.max(0, total);
}

describe('Discount Rule Storage', () => {
  it('should store rules as JSON in vendor_responses', () => {
    const bidId = seedBid(db);
    const rules = [
      {
        conditionParam: 'Color',
        conditionOption: 'Red',
        targetType: 'total',
        targetParam: '',
        targetOption: '',
        discountType: 'percentage',
        discountValue: 10,
      },
    ];

    const responseId = seedAdditiveResponse(db, bidId, { rules });
    const response = db.prepare('SELECT * FROM vendor_responses WHERE id = ?').get(responseId) as any;

    const parsedRules = JSON.parse(response.rules);
    expect(parsedRules).toHaveLength(1);
    expect(parsedRules[0].conditionParam).toBe('Color');
    expect(parsedRules[0].discountValue).toBe(10);
  });

  it('should store multiple rules', () => {
    const bidId = seedBid(db);
    const rules = [
      { conditionParam: 'Color', conditionOption: 'Red', targetType: 'total', targetParam: '', targetOption: '', discountType: 'percentage', discountValue: 10 },
      { conditionParam: 'Size', conditionOption: 'L', targetType: 'param_option', targetParam: 'Color', targetOption: 'Red', discountType: 'fixed', discountValue: 5 },
    ];

    const responseId = seedAdditiveResponse(db, bidId, { rules });
    const response = db.prepare('SELECT * FROM vendor_responses WHERE id = ?').get(responseId) as any;
    expect(JSON.parse(response.rules)).toHaveLength(2);
  });

  it('should store empty rules array', () => {
    const bidId = seedBid(db);
    const responseId = seedAdditiveResponse(db, bidId, { rules: [] });
    const response = db.prepare('SELECT * FROM vendor_responses WHERE id = ?').get(responseId) as any;
    expect(JSON.parse(response.rules)).toEqual([]);
  });

  it('should not store rules for combination mode', () => {
    const bidId = seedBid(db);
    const responseId = crypto.randomUUID();
    db.prepare('INSERT INTO vendor_responses (id, bid_id, vendor_name, pricing_mode) VALUES (?, ?, ?, ?)').run(
      responseId, bidId, 'Combo Vendor', 'combination'
    );

    const response = db.prepare('SELECT * FROM vendor_responses WHERE id = ?').get(responseId) as any;
    expect(response.rules).toBeNull();
  });
});

describe('Percentage Discount on Total', () => {
  it('should apply percentage discount when condition is met', () => {
    // Base: 100, Red: +10, S: +0 = 110, then 10% off = 99
    const result = calculateAdditivePrice(
      100,
      { Color: 'Red', Size: 'S' },
      [
        { combination_key: '{"param":"Color","option":"Red"}', price: 10 },
        { combination_key: '{"param":"Size","option":"S"}', price: 0 },
      ],
      [{ conditionParam: 'Color', conditionOption: 'Red', targetType: 'total', targetParam: '', targetOption: '', discountType: 'percentage', discountValue: 10 }]
    );
    expect(result).toBe(99);
  });

  it('should NOT apply discount when condition is not met', () => {
    // Base: 100, Blue: +20, S: +0 = 120, rule checks for Red -> no discount
    const result = calculateAdditivePrice(
      100,
      { Color: 'Blue', Size: 'S' },
      [
        { combination_key: '{"param":"Color","option":"Blue"}', price: 20 },
        { combination_key: '{"param":"Size","option":"S"}', price: 0 },
      ],
      [{ conditionParam: 'Color', conditionOption: 'Red', targetType: 'total', targetParam: '', targetOption: '', discountType: 'percentage', discountValue: 10 }]
    );
    expect(result).toBe(120);
  });

  it('should apply 100% discount (free)', () => {
    const result = calculateAdditivePrice(
      100,
      { Color: 'Red', Size: 'S' },
      [
        { combination_key: '{"param":"Color","option":"Red"}', price: 10 },
        { combination_key: '{"param":"Size","option":"S"}', price: 0 },
      ],
      [{ conditionParam: 'Color', conditionOption: 'Red', targetType: 'total', targetParam: '', targetOption: '', discountType: 'percentage', discountValue: 100 }]
    );
    expect(result).toBe(0);
  });
});

describe('Fixed Discount on Total', () => {
  it('should apply fixed dollar discount on total', () => {
    // Base: 100, Red: +10, M: +15 = 125, then -$20 = 105
    const result = calculateAdditivePrice(
      100,
      { Color: 'Red', Size: 'M' },
      [
        { combination_key: '{"param":"Color","option":"Red"}', price: 10 },
        { combination_key: '{"param":"Size","option":"M"}', price: 15 },
      ],
      [{ conditionParam: 'Color', conditionOption: 'Red', targetType: 'total', targetParam: '', targetOption: '', discountType: 'fixed', discountValue: 20 }]
    );
    expect(result).toBe(105);
  });

  it('should clamp to zero when discount exceeds total', () => {
    const result = calculateAdditivePrice(
      50,
      { Color: 'Red', Size: 'S' },
      [
        { combination_key: '{"param":"Color","option":"Red"}', price: 10 },
        { combination_key: '{"param":"Size","option":"S"}', price: 0 },
      ],
      [{ conditionParam: 'Color', conditionOption: 'Red', targetType: 'total', targetParam: '', targetOption: '', discountType: 'fixed', discountValue: 200 }]
    );
    expect(result).toBe(0);
  });
});

describe('Discount on Specific Parameter Option', () => {
  it('should apply percentage discount to a specific option addition', () => {
    // Base: 100, Red: +10, L: +50 = 160
    // Rule: When Color=Red, Size L gets 20% off -> discount = 50 * 0.2 = 10
    // Total: 160 - 10 = 150
    const result = calculateAdditivePrice(
      100,
      { Color: 'Red', Size: 'L' },
      [
        { combination_key: '{"param":"Color","option":"Red"}', price: 10 },
        { combination_key: '{"param":"Size","option":"L"}', price: 50 },
      ],
      [{ conditionParam: 'Color', conditionOption: 'Red', targetType: 'param_option', targetParam: 'Size', targetOption: 'L', discountType: 'percentage', discountValue: 20 }]
    );
    expect(result).toBe(150);
  });

  it('should apply fixed discount to a specific option addition', () => {
    // Base: 100, Red: +10, L: +50 = 160
    // Rule: When Color=Red, Size L gets $5 off
    // Total: 160 - 5 = 155
    const result = calculateAdditivePrice(
      100,
      { Color: 'Red', Size: 'L' },
      [
        { combination_key: '{"param":"Color","option":"Red"}', price: 10 },
        { combination_key: '{"param":"Size","option":"L"}', price: 50 },
      ],
      [{ conditionParam: 'Color', conditionOption: 'Red', targetType: 'param_option', targetParam: 'Size', targetOption: 'L', discountType: 'fixed', discountValue: 5 }]
    );
    expect(result).toBe(155);
  });

  it('should not apply param_option discount when target option not selected', () => {
    // Rule targets Size=L but we select Size=M
    const result = calculateAdditivePrice(
      100,
      { Color: 'Red', Size: 'M' },
      [
        { combination_key: '{"param":"Color","option":"Red"}', price: 10 },
        { combination_key: '{"param":"Size","option":"M"}', price: 15 },
      ],
      [{ conditionParam: 'Color', conditionOption: 'Red', targetType: 'param_option', targetParam: 'Size', targetOption: 'L', discountType: 'fixed', discountValue: 5 }]
    );
    // No discount because Size=L not selected, targetAddition = 0
    expect(result).toBe(125);
  });
});

describe('Multiple Rules', () => {
  it('should apply multiple rules sequentially', () => {
    // From PRICING_MODES.md example:
    // Base: 100, Red: +20, Large: +50 = 170
    // Rule 1: When Color=Red, total 10% off -> 170 * 0.9 = 153
    // Rule 2: When Size=Large, Color Red gets $5 off -> 153 - 5 = 148
    const result = calculateAdditivePrice(
      100,
      { Color: 'Red', Size: 'Large' },
      [
        { combination_key: '{"param":"Color","option":"Red"}', price: 20 },
        { combination_key: '{"param":"Size","option":"Large"}', price: 50 },
      ],
      [
        { conditionParam: 'Color', conditionOption: 'Red', targetType: 'total', targetParam: '', targetOption: '', discountType: 'percentage', discountValue: 10 },
        { conditionParam: 'Size', conditionOption: 'Large', targetType: 'param_option', targetParam: 'Color', targetOption: 'Red', discountType: 'fixed', discountValue: 5 },
      ]
    );
    expect(result).toBe(148);
  });

  it('should apply rules in order (order matters for sequential application)', () => {
    // Same rules but reversed order should give different result
    // Base: 100, Red: +20, Large: +50 = 170
    // Rule 1: When Size=Large, Color Red gets $5 off -> 170 - 5 = 165
    // Rule 2: When Color=Red, total 10% off -> 165 * 0.9 = 148.5
    const result = calculateAdditivePrice(
      100,
      { Color: 'Red', Size: 'Large' },
      [
        { combination_key: '{"param":"Color","option":"Red"}', price: 20 },
        { combination_key: '{"param":"Size","option":"Large"}', price: 50 },
      ],
      [
        { conditionParam: 'Size', conditionOption: 'Large', targetType: 'param_option', targetParam: 'Color', targetOption: 'Red', discountType: 'fixed', discountValue: 5 },
        { conditionParam: 'Color', conditionOption: 'Red', targetType: 'total', targetParam: '', targetOption: '', discountType: 'percentage', discountValue: 10 },
      ]
    );
    expect(result).toBe(148.5);
  });

  it('should skip rules whose conditions are not met', () => {
    // Base: 100, Blue: +20, S: +0 = 120
    // Rule 1: When Color=Red -> skip (Blue selected)
    // Rule 2: When Size=L -> skip (S selected)
    const result = calculateAdditivePrice(
      100,
      { Color: 'Blue', Size: 'S' },
      [
        { combination_key: '{"param":"Color","option":"Blue"}', price: 20 },
        { combination_key: '{"param":"Size","option":"S"}', price: 0 },
      ],
      [
        { conditionParam: 'Color', conditionOption: 'Red', targetType: 'total', targetParam: '', targetOption: '', discountType: 'percentage', discountValue: 50 },
        { conditionParam: 'Size', conditionOption: 'L', targetType: 'total', targetParam: '', targetOption: '', discountType: 'fixed', discountValue: 30 },
      ]
    );
    expect(result).toBe(120);
  });
});

describe('Edge Cases', () => {
  it('should handle zero base price', () => {
    const result = calculateAdditivePrice(
      0,
      { Color: 'Red' },
      [{ combination_key: '{"param":"Color","option":"Red"}', price: 50 }],
      []
    );
    expect(result).toBe(50);
  });

  it('should handle zero discount value', () => {
    const result = calculateAdditivePrice(
      100,
      { Color: 'Red' },
      [{ combination_key: '{"param":"Color","option":"Red"}', price: 10 }],
      [{ conditionParam: 'Color', conditionOption: 'Red', targetType: 'total', targetParam: '', targetOption: '', discountType: 'percentage', discountValue: 0 }]
    );
    expect(result).toBe(110);
  });

  it('should handle large discount values gracefully (clamp to 0)', () => {
    const result = calculateAdditivePrice(
      10,
      { Color: 'Red' },
      [{ combination_key: '{"param":"Color","option":"Red"}', price: 5 }],
      [{ conditionParam: 'Color', conditionOption: 'Red', targetType: 'total', targetParam: '', targetOption: '', discountType: 'percentage', discountValue: 200 }]
    );
    expect(result).toBe(0);
  });
});
