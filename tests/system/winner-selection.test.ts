import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb, seedProject, seedBid, seedVendor, seedBidInvitation, seedVendorResponse, seedBidWinner } from '../helpers/test-db';
import type Database from 'better-sqlite3';

describe('Winner Selection', () => {
  let db: Database.Database;
  let projectId: string;
  let bidId: string;
  let vendor1Id: string;
  let vendor2Id: string;
  let response1Id: string;
  let response2Id: string;

  beforeEach(() => {
    db = getTestDb();
    projectId = seedProject(db);
    bidId = seedBid(db, { project_id: projectId, status: 'active' });
    vendor1Id = seedVendor(db, { name: 'Winner Vendor', email: 'winner@test.com' });
    vendor2Id = seedVendor(db, { name: 'Loser Vendor', email: 'loser@test.com' });
    seedBidInvitation(db, bidId, vendor1Id, { status: 'submitted' });
    seedBidInvitation(db, bidId, vendor2Id, { status: 'submitted' });
    response1Id = seedVendorResponse(db, bidId, vendor1Id, { vendorName: 'Winner Vendor', prices: [{ combination_key: '{"Color":"Red"}', price: 100 }] });
    response2Id = seedVendorResponse(db, bidId, vendor2Id, { vendorName: 'Loser Vendor', prices: [{ combination_key: '{"Color":"Red"}', price: 150 }] });
  });

  describe('Select winner', () => {
    it('should create a bid_winners record', () => {
      const winnerId = seedBidWinner(db, bidId, vendor1Id, response1Id, { notes: 'Best price' });
      const winner = db.prepare('SELECT * FROM bid_winners WHERE id = ?').get(winnerId) as any;
      expect(winner.bid_id).toBe(bidId);
      expect(winner.vendor_id).toBe(vendor1Id);
      expect(winner.vendor_response_id).toBe(response1Id);
      expect(winner.notes).toBe('Best price');
      expect(winner.selected_at).toBeTruthy();
    });

    it('should enforce one winner per bid (unique bid_id)', () => {
      seedBidWinner(db, bidId, vendor1Id, response1Id);
      expect(() => seedBidWinner(db, bidId, vendor2Id, response2Id)).toThrow();
    });

    it('should update bid status to awarded', () => {
      seedBidWinner(db, bidId, vendor1Id, response1Id);
      db.prepare("UPDATE bids SET status = 'awarded' WHERE id = ?").run(bidId);
      const bid = db.prepare('SELECT * FROM bids WHERE id = ?').get(bidId) as any;
      expect(bid.status).toBe('awarded');
    });

    it('should allow selecting winner without notes', () => {
      const winnerId = seedBidWinner(db, bidId, vendor1Id, response1Id);
      const winner = db.prepare('SELECT * FROM bid_winners WHERE id = ?').get(winnerId) as any;
      expect(winner.notes).toBeNull();
    });
  });

  describe('Query winner', () => {
    it('should join winner with vendor and response data', () => {
      seedBidWinner(db, bidId, vendor1Id, response1Id);
      const result = db.prepare(`
        SELECT bw.*, v.name as vendor_name, v.email as vendor_email
        FROM bid_winners bw
        JOIN vendors v ON v.id = bw.vendor_id
        WHERE bw.bid_id = ?
      `).get(bidId) as any;
      expect(result.vendor_name).toBe('Winner Vendor');
      expect(result.vendor_email).toBe('winner@test.com');
    });

    it('should return undefined for bids without a winner', () => {
      const result = db.prepare('SELECT * FROM bid_winners WHERE bid_id = ?').get(bidId);
      expect(result).toBeUndefined();
    });

    it('should identify non-winning vendors', () => {
      seedBidWinner(db, bidId, vendor1Id, response1Id);
      const losers = db.prepare(`
        SELECT DISTINCT bi.vendor_id, v.name, v.email
        FROM bid_invitations bi
        JOIN vendors v ON v.id = bi.vendor_id
        WHERE bi.bid_id = ? AND bi.vendor_id != (
          SELECT vendor_id FROM bid_winners WHERE bid_id = ?
        )
      `).all(bidId, bidId) as any[];
      expect(losers).toHaveLength(1);
      expect(losers[0].name).toBe('Loser Vendor');
    });
  });

  describe('Cascade deletes', () => {
    it('should delete winner when bid is deleted', () => {
      seedBidWinner(db, bidId, vendor1Id, response1Id);
      db.prepare('DELETE FROM bids WHERE id = ?').run(bidId);
      const winner = db.prepare('SELECT * FROM bid_winners WHERE bid_id = ?').get(bidId);
      expect(winner).toBeUndefined();
    });

    it('should delete winner when vendor is deleted', () => {
      seedBidWinner(db, bidId, vendor1Id, response1Id);
      db.prepare('DELETE FROM vendors WHERE id = ?').run(vendor1Id);
      const winners = db.prepare('SELECT * FROM bid_winners').all();
      expect(winners).toHaveLength(0);
    });
  });
});
