import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb, seedProject, seedBid, seedVendor, seedBidInvitation, seedVendorResponse, seedBidWinner } from '../helpers/test-db';
import type Database from 'better-sqlite3';

// Simulates the admin stats queries that will live in the API
function getAdminStats(db: Database.Database) {
  const projects = db.prepare('SELECT COUNT(*) as count FROM projects').get() as any;
  const activeProjects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'active'").get() as any;
  const bids = db.prepare('SELECT COUNT(*) as count FROM bids').get() as any;
  const activeBids = db.prepare("SELECT COUNT(*) as count FROM bids WHERE status = 'active'").get() as any;
  const awardedBids = db.prepare("SELECT COUNT(*) as count FROM bids WHERE status = 'awarded'").get() as any;
  const vendors = db.prepare("SELECT COUNT(*) as count FROM vendors WHERE status != 'removed'").get() as any;
  const invitations = db.prepare('SELECT COUNT(*) as count FROM bid_invitations').get() as any;
  const submitted = db.prepare("SELECT COUNT(*) as count FROM bid_invitations WHERE status = 'submitted'").get() as any;
  const responseRate = invitations.count > 0 ? Math.round((submitted.count / invitations.count) * 100) : 0;

  return {
    totalProjects: projects.count,
    activeProjects: activeProjects.count,
    totalBids: bids.count,
    activeBids: activeBids.count,
    awardedBids: awardedBids.count,
    totalVendors: vendors.count,
    totalInvitations: invitations.count,
    submittedInvitations: submitted.count,
    responseRate,
  };
}

function getRecentActivity(db: Database.Database, limit: number = 10) {
  const recentBids = db.prepare('SELECT id, title, status, created_at FROM bids ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
  const recentInvitations = db.prepare(`
    SELECT bi.status, bi.sent_at, v.name as vendor_name, b.title as bid_title
    FROM bid_invitations bi
    JOIN vendors v ON v.id = bi.vendor_id
    JOIN bids b ON b.id = bi.bid_id
    ORDER BY bi.sent_at DESC LIMIT ?
  `).all(limit) as any[];
  return { recentBids, recentInvitations };
}

describe('Admin Stats', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = getTestDb();
  });

  describe('KPI calculations', () => {
    it('should return zeros for empty database', () => {
      const stats = getAdminStats(db);
      expect(stats.totalProjects).toBe(0);
      expect(stats.totalBids).toBe(0);
      expect(stats.totalVendors).toBe(0);
      expect(stats.totalInvitations).toBe(0);
      expect(stats.responseRate).toBe(0);
    });

    it('should count projects correctly', () => {
      seedProject(db, { name: 'P1', status: 'active' });
      seedProject(db, { name: 'P2', status: 'active' });
      seedProject(db, { name: 'P3', status: 'completed' });
      const stats = getAdminStats(db);
      expect(stats.totalProjects).toBe(3);
      expect(stats.activeProjects).toBe(2);
    });

    it('should count bids by status', () => {
      const pid = seedProject(db);
      seedBid(db, { project_id: pid, status: 'active', title: 'Active 1' });
      seedBid(db, { project_id: pid, status: 'active', title: 'Active 2' });
      seedBid(db, { project_id: pid, status: 'draft', title: 'Draft' });
      seedBid(db, { project_id: pid, status: 'awarded', title: 'Awarded' });
      const stats = getAdminStats(db);
      expect(stats.totalBids).toBe(4);
      expect(stats.activeBids).toBe(2);
      expect(stats.awardedBids).toBe(1);
    });

    it('should exclude removed vendors from count', () => {
      seedVendor(db, { email: 'a@t.com', status: 'active' });
      seedVendor(db, { email: 'b@t.com', status: 'suspended' });
      seedVendor(db, { email: 'c@t.com', status: 'removed' });
      const stats = getAdminStats(db);
      expect(stats.totalVendors).toBe(2);
    });

    it('should calculate response rate', () => {
      const pid = seedProject(db);
      const bid = seedBid(db, { project_id: pid, status: 'active' });
      const v1 = seedVendor(db, { email: 'v1@t.com' });
      const v2 = seedVendor(db, { email: 'v2@t.com' });
      const v3 = seedVendor(db, { email: 'v3@t.com' });
      const v4 = seedVendor(db, { email: 'v4@t.com' });
      seedBidInvitation(db, bid, v1, { status: 'submitted' });
      seedBidInvitation(db, bid, v2, { status: 'submitted' });
      seedBidInvitation(db, bid, v3, { status: 'pending' });
      seedBidInvitation(db, bid, v4, { status: 'opened' });
      const stats = getAdminStats(db);
      expect(stats.totalInvitations).toBe(4);
      expect(stats.submittedInvitations).toBe(2);
      expect(stats.responseRate).toBe(50);
    });
  });

  describe('Recent activity', () => {
    it('should return recent bids', () => {
      const pid = seedProject(db);
      seedBid(db, { project_id: pid, title: 'Bid A' });
      seedBid(db, { project_id: pid, title: 'Bid B' });
      const activity = getRecentActivity(db);
      expect(activity.recentBids).toHaveLength(2);
    });

    it('should return recent invitations with vendor and bid names', () => {
      const pid = seedProject(db);
      const bid = seedBid(db, { project_id: pid, status: 'active', title: 'Test Bid' });
      const v = seedVendor(db, { name: 'Acme Co', email: 'acme@t.com' });
      seedBidInvitation(db, bid, v);
      const activity = getRecentActivity(db);
      expect(activity.recentInvitations).toHaveLength(1);
      expect(activity.recentInvitations[0].vendor_name).toBe('Acme Co');
      expect(activity.recentInvitations[0].bid_title).toBe('Test Bid');
    });

    it('should respect limit parameter', () => {
      const pid = seedProject(db);
      for (let i = 0; i < 15; i++) {
        seedBid(db, { project_id: pid, title: `Bid ${i}` });
      }
      const activity = getRecentActivity(db, 5);
      expect(activity.recentBids).toHaveLength(5);
    });

    it('should return empty arrays for empty database', () => {
      const activity = getRecentActivity(db);
      expect(activity.recentBids).toHaveLength(0);
      expect(activity.recentInvitations).toHaveLength(0);
    });
  });
});
