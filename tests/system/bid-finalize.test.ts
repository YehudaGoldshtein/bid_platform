import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb, seedProject, seedBid, seedVendor, seedBidInvitation, seedVendorResponse, seedBidWinner } from '../helpers/test-db';
import type Database from 'better-sqlite3';

// Simulates the finalize logic that will live in the API
function finalizeBid(db: Database.Database, bidId: string) {
  const bid = db.prepare('SELECT * FROM bids WHERE id = ?').get(bidId) as any;
  if (!bid) return { error: 'Bid not found' };
  if (bid.status === 'awarded') return { error: 'Bid already finalized' };
  if (bid.status === 'draft') return { error: 'Cannot finalize a draft bid' };

  // Check a winner exists
  const winner = db.prepare('SELECT * FROM bid_winners WHERE bid_id = ?').get(bidId);
  if (!winner) return { error: 'Must select a winner before finalizing' };

  // Update bid status to awarded
  db.prepare("UPDATE bids SET status = 'awarded' WHERE id = ?").run(bidId);

  // Expire all pending/opened invitations
  db.prepare("UPDATE bid_invitations SET status = 'expired' WHERE bid_id = ? AND status IN ('pending', 'opened')")
    .run(bidId);

  return { success: true };
}

describe('Bid Finalize', () => {
  let db: Database.Database;
  let projectId: string;
  let bidId: string;
  let vendorId: string;
  let vendor2Id: string;
  let responseId: string;

  beforeEach(() => {
    db = getTestDb();
    projectId = seedProject(db);
    bidId = seedBid(db, { project_id: projectId, status: 'active' });
    vendorId = seedVendor(db, { name: 'Winner', email: 'w@test.com' });
    vendor2Id = seedVendor(db, { name: 'Pending', email: 'p@test.com' });
    seedBidInvitation(db, bidId, vendorId, { status: 'submitted' });
    seedBidInvitation(db, bidId, vendor2Id, { status: 'pending' });
    responseId = seedVendorResponse(db, bidId, vendorId, { vendorName: 'Winner' });
  });

  describe('Successful finalize', () => {
    it('should finalize a bid with a winner', () => {
      seedBidWinner(db, bidId, vendorId, responseId);
      const result = finalizeBid(db, bidId);
      expect(result.success).toBe(true);
    });

    it('should set bid status to awarded', () => {
      seedBidWinner(db, bidId, vendorId, responseId);
      finalizeBid(db, bidId);
      const bid = db.prepare('SELECT * FROM bids WHERE id = ?').get(bidId) as any;
      expect(bid.status).toBe('awarded');
    });

    it('should expire pending invitations', () => {
      seedBidWinner(db, bidId, vendorId, responseId);
      finalizeBid(db, bidId);
      const pending = db.prepare("SELECT * FROM bid_invitations WHERE bid_id = ? AND status = 'pending'").all(bidId);
      expect(pending).toHaveLength(0);
    });

    it('should keep submitted invitations unchanged', () => {
      seedBidWinner(db, bidId, vendorId, responseId);
      finalizeBid(db, bidId);
      const submitted = db.prepare("SELECT * FROM bid_invitations WHERE bid_id = ? AND status = 'submitted'").all(bidId);
      expect(submitted).toHaveLength(1);
    });

    it('should expire opened invitations too', () => {
      const v3 = seedVendor(db, { email: 'opened@test.com' });
      seedBidInvitation(db, bidId, v3, { status: 'opened' });
      seedBidWinner(db, bidId, vendorId, responseId);
      finalizeBid(db, bidId);
      const opened = db.prepare("SELECT * FROM bid_invitations WHERE bid_id = ? AND status = 'opened'").all(bidId);
      expect(opened).toHaveLength(0);
    });
  });

  describe('Rejection cases', () => {
    it('should reject if no winner selected', () => {
      const result = finalizeBid(db, bidId);
      expect(result.error).toBe('Must select a winner before finalizing');
    });

    it('should reject if bid is draft', () => {
      const draftBid = seedBid(db, { status: 'draft', project_id: projectId });
      const result = finalizeBid(db, draftBid);
      expect(result.error).toBe('Cannot finalize a draft bid');
    });

    it('should reject if already finalized', () => {
      seedBidWinner(db, bidId, vendorId, responseId);
      finalizeBid(db, bidId);
      const result = finalizeBid(db, bidId);
      expect(result.error).toBe('Bid already finalized');
    });

    it('should reject if bid not found', () => {
      const result = finalizeBid(db, 'nonexistent');
      expect(result.error).toBe('Bid not found');
    });
  });

  describe('Post-finalize submission guard', () => {
    it('should not allow new submissions after finalize (invitation expired)', () => {
      seedBidWinner(db, bidId, vendorId, responseId);
      finalizeBid(db, bidId);
      // vendor2's invitation should now be expired
      const inv = db.prepare('SELECT * FROM bid_invitations WHERE bid_id = ? AND vendor_id = ?').get(bidId, vendor2Id) as any;
      expect(inv.status).toBe('expired');
    });
  });
});
