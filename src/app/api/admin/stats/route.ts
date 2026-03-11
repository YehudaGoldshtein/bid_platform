import { NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET() {
  await dbReady();
  const client = db();

  const [projects, activeProjects, bids, activeBids, awardedBids, vendors, invitations, submitted] =
    await Promise.all([
      client.execute('SELECT COUNT(*) as count FROM projects'),
      client.execute("SELECT COUNT(*) as count FROM projects WHERE status = 'active'"),
      client.execute('SELECT COUNT(*) as count FROM bids'),
      client.execute("SELECT COUNT(*) as count FROM bids WHERE status = 'active'"),
      client.execute("SELECT COUNT(*) as count FROM bids WHERE status = 'awarded'"),
      client.execute("SELECT COUNT(*) as count FROM vendors WHERE status != 'removed'"),
      client.execute('SELECT COUNT(*) as count FROM bid_invitations'),
      client.execute("SELECT COUNT(*) as count FROM bid_invitations WHERE status = 'submitted'"),
    ]);

  const totalInvitations = Number(invitations.rows[0].count);
  const submittedCount = Number(submitted.rows[0].count);
  const responseRate = totalInvitations > 0 ? Math.round((submittedCount / totalInvitations) * 100) : 0;

  return NextResponse.json({
    totalProjects: Number(projects.rows[0].count),
    activeProjects: Number(activeProjects.rows[0].count),
    totalBids: Number(bids.rows[0].count),
    activeBids: Number(activeBids.rows[0].count),
    awardedBids: Number(awardedBids.rows[0].count),
    totalVendors: Number(vendors.rows[0].count),
    totalInvitations,
    submittedInvitations: submittedCount,
    responseRate,
  });
}
