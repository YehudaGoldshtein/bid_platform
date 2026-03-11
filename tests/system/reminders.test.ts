import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb, seedProject, seedBid, seedVendor, seedBidInvitation } from '../helpers/test-db';
import type Database from 'better-sqlite3';

// Simulates the reminder logic that will live in the cron API
function findBidsNeedingReminders(db: Database.Database, today: string): {
  firstReminders: { bid_id: string; invitation_id: string; vendor_email: string; bid_title: string; deadline: string; token: string }[];
  secondReminders: { bid_id: string; invitation_id: string; vendor_email: string; bid_title: string; deadline: string; token: string }[];
} {
  const firstDays = 5;
  const secondDays = 2;

  // Calculate target dates
  const todayDate = new Date(today);
  const firstTarget = new Date(todayDate);
  firstTarget.setDate(firstTarget.getDate() + firstDays);
  const firstStr = firstTarget.toISOString().split('T')[0];

  const secondTarget = new Date(todayDate);
  secondTarget.setDate(secondTarget.getDate() + secondDays);
  const secondStr = secondTarget.toISOString().split('T')[0];

  function findInvitations(deadlineDate: string, reminderType: string) {
    return db.prepare(`
      SELECT bi.id as invitation_id, bi.bid_id, bi.token, bi.vendor_id,
             b.title as bid_title, b.deadline,
             v.email as vendor_email
      FROM bid_invitations bi
      JOIN bids b ON b.id = bi.bid_id
      JOIN vendors v ON v.id = bi.vendor_id
      WHERE b.status = 'active'
        AND b.deadline = ?
        AND bi.status IN ('pending', 'opened')
        AND bi.id NOT IN (
          SELECT bid_invitation_id FROM reminder_log WHERE reminder_type = ?
        )
    `).all(deadlineDate, reminderType) as any[];
  }

  return {
    firstReminders: findInvitations(firstStr, 'first'),
    secondReminders: findInvitations(secondStr, 'second'),
  };
}

function logReminder(db: Database.Database, invitationId: string, reminderType: string) {
  db.prepare('INSERT INTO reminder_log (id, bid_invitation_id, reminder_type) VALUES (?, ?, ?)')
    .run(crypto.randomUUID(), invitationId, reminderType);
}

describe('Deadline Reminders', () => {
  let db: Database.Database;
  let projectId: string;

  beforeEach(() => {
    db = getTestDb();
    projectId = seedProject(db);
  });

  describe('Find bids needing reminders', () => {
    it('should find first reminders (5 days before deadline)', () => {
      const bidId = seedBid(db, { project_id: projectId, status: 'active', deadline: '2026-03-16' });
      const v = seedVendor(db, { email: 'r@test.com' });
      seedBidInvitation(db, bidId, v, { status: 'pending' });

      const result = findBidsNeedingReminders(db, '2026-03-11');
      expect(result.firstReminders).toHaveLength(1);
      expect(result.firstReminders[0].vendor_email).toBe('r@test.com');
    });

    it('should find second reminders (2 days before deadline)', () => {
      const bidId = seedBid(db, { project_id: projectId, status: 'active', deadline: '2026-03-13' });
      const v = seedVendor(db, { email: 'r2@test.com' });
      seedBidInvitation(db, bidId, v, { status: 'opened' });

      const result = findBidsNeedingReminders(db, '2026-03-11');
      expect(result.secondReminders).toHaveLength(1);
    });

    it('should not remind submitted vendors', () => {
      const bidId = seedBid(db, { project_id: projectId, status: 'active', deadline: '2026-03-16' });
      const v = seedVendor(db, { email: 'done@test.com' });
      seedBidInvitation(db, bidId, v, { status: 'submitted' });

      const result = findBidsNeedingReminders(db, '2026-03-11');
      expect(result.firstReminders).toHaveLength(0);
    });

    it('should not remind for draft bids', () => {
      const bidId = seedBid(db, { project_id: projectId, status: 'draft', deadline: '2026-03-16' });
      const v = seedVendor(db, { email: 'draft@test.com' });
      seedBidInvitation(db, bidId, v, { status: 'pending' });

      const result = findBidsNeedingReminders(db, '2026-03-11');
      expect(result.firstReminders).toHaveLength(0);
    });

    it('should not remind for closed/awarded bids', () => {
      const bidId = seedBid(db, { project_id: projectId, status: 'awarded', deadline: '2026-03-16' });
      const v = seedVendor(db, { email: 'closed@test.com' });
      seedBidInvitation(db, bidId, v, { status: 'pending' });

      const result = findBidsNeedingReminders(db, '2026-03-11');
      expect(result.firstReminders).toHaveLength(0);
    });

    it('should not find reminders for non-matching dates', () => {
      const bidId = seedBid(db, { project_id: projectId, status: 'active', deadline: '2026-03-20' });
      const v = seedVendor(db, { email: 'no@test.com' });
      seedBidInvitation(db, bidId, v, { status: 'pending' });

      const result = findBidsNeedingReminders(db, '2026-03-11');
      expect(result.firstReminders).toHaveLength(0);
      expect(result.secondReminders).toHaveLength(0);
    });
  });

  describe('Duplicate prevention', () => {
    it('should skip already-sent first reminders', () => {
      const bidId = seedBid(db, { project_id: projectId, status: 'active', deadline: '2026-03-16' });
      const v = seedVendor(db, { email: 'dup@test.com' });
      const { id: invId } = seedBidInvitation(db, bidId, v, { status: 'pending' });

      // Log first reminder as already sent
      logReminder(db, invId, 'first');

      const result = findBidsNeedingReminders(db, '2026-03-11');
      expect(result.firstReminders).toHaveLength(0);
    });

    it('should still send second reminder even if first was sent', () => {
      const bidId = seedBid(db, { project_id: projectId, status: 'active', deadline: '2026-03-13' });
      const v = seedVendor(db, { email: 'both@test.com' });
      const { id: invId } = seedBidInvitation(db, bidId, v, { status: 'pending' });

      // First reminder was sent earlier
      logReminder(db, invId, 'first');

      const result = findBidsNeedingReminders(db, '2026-03-11');
      expect(result.secondReminders).toHaveLength(1);
    });

    it('should skip already-sent second reminders', () => {
      const bidId = seedBid(db, { project_id: projectId, status: 'active', deadline: '2026-03-13' });
      const v = seedVendor(db, { email: 'dup2@test.com' });
      const { id: invId } = seedBidInvitation(db, bidId, v, { status: 'pending' });

      logReminder(db, invId, 'second');

      const result = findBidsNeedingReminders(db, '2026-03-11');
      expect(result.secondReminders).toHaveLength(0);
    });
  });

  describe('Multiple vendors', () => {
    it('should find reminders for multiple vendors on same bid', () => {
      const bidId = seedBid(db, { project_id: projectId, status: 'active', deadline: '2026-03-16' });
      const v1 = seedVendor(db, { email: 'v1@test.com' });
      const v2 = seedVendor(db, { email: 'v2@test.com' });
      const v3 = seedVendor(db, { email: 'v3@test.com' });
      seedBidInvitation(db, bidId, v1, { status: 'pending' });
      seedBidInvitation(db, bidId, v2, { status: 'opened' });
      seedBidInvitation(db, bidId, v3, { status: 'submitted' }); // should not get reminder

      const result = findBidsNeedingReminders(db, '2026-03-11');
      expect(result.firstReminders).toHaveLength(2);
    });
  });

  describe('Reminder log', () => {
    it('should record sent reminders', () => {
      const bidId = seedBid(db, { project_id: projectId, status: 'active', deadline: '2026-03-16' });
      const v = seedVendor(db, { email: 'log@test.com' });
      const { id: invId } = seedBidInvitation(db, bidId, v, { status: 'pending' });

      logReminder(db, invId, 'first');

      const logs = db.prepare('SELECT * FROM reminder_log WHERE bid_invitation_id = ?').all(invId) as any[];
      expect(logs).toHaveLength(1);
      expect(logs[0].reminder_type).toBe('first');
      expect(logs[0].sent_at).toBeTruthy();
    });

    it('should cascade delete reminder logs when invitation is deleted', () => {
      const bidId = seedBid(db, { project_id: projectId, status: 'active', deadline: '2026-03-16' });
      const v = seedVendor(db, { email: 'cascade@test.com' });
      const { id: invId } = seedBidInvitation(db, bidId, v, { status: 'pending' });
      logReminder(db, invId, 'first');

      db.prepare('DELETE FROM bids WHERE id = ?').run(bidId); // cascades to invitations → reminder_log
      const logs = db.prepare('SELECT * FROM reminder_log').all();
      expect(logs).toHaveLength(0);
    });
  });
});
