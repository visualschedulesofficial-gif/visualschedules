import { NextResponse } from "next/server";
import { getEnv, requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

// Every stat is queried directly and labeled precisely — "all-time total"
// and "currently active" are always distinct numbers, never conflated.
// Any single query failing (e.g. a table that doesn't exist yet) falls back
// to null rather than crashing the whole dashboard.
async function safeFirst(env: any, sql: string, ...binds: any[]) {
  try {
    const q = binds.length ? env.DB.prepare(sql).bind(...binds) : env.DB.prepare(sql);
    return await q.first();
  } catch {
    return null;
  }
}
async function safeAll(env: any, sql: string, ...binds: any[]) {
  try {
    const q = binds.length ? env.DB.prepare(sql).bind(...binds) : env.DB.prepare(sql);
    const { results } = await q.all();
    return results || [];
  } catch {
    return [];
  }
}

export async function GET() {
  const env = getEnv();
  if (!(await requireAdmin(env))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!env.DB) return NextResponse.json({ error: "No database" }, { status: 500 });

  const [
    totalUsers,
    newUsers7d,
    activeSubs,
    totalSubsEver,
    totalSchedules,
    schedules7d,
    totalOrgs,
    activeOrgs,
    paidOrgs,
    orgRedemptions,
    blogTotals,
    downloadTotals,
    signupSeries,
  ] = await Promise.all([
    safeFirst(env, "SELECT COUNT(*) as n FROM users"),
    safeFirst(env, "SELECT COUNT(*) as n FROM users WHERE created_at > datetime('now', '-7 days')"),
    safeFirst(
      env,
      "SELECT COUNT(*) as n FROM subscriptions WHERE status = 'active' AND (expires_at IS NULL OR expires_at > datetime('now'))"
    ),
    safeFirst(env, "SELECT COUNT(*) as n FROM subscriptions"),
    safeFirst(env, "SELECT COUNT(*) as n FROM schedules"),
    safeFirst(env, "SELECT COUNT(*) as n FROM schedules WHERE updated_at > datetime('now', '-7 days')"),
    safeFirst(env, "SELECT COUNT(*) as n FROM orgs"),
    safeFirst(env, "SELECT COUNT(*) as n FROM orgs WHERE active = 1"),
    safeFirst(env, "SELECT COUNT(*) as n FROM orgs WHERE plan = 'paid' AND (plan_expires_at IS NULL OR plan_expires_at > datetime('now'))"),
    safeFirst(env, "SELECT COUNT(*) as n FROM org_redemptions"),
    safeFirst(env, "SELECT COUNT(*) as posts, COALESCE(SUM(view_count),0) as views FROM blog_posts WHERE status = 'published'"),
    safeFirst(env, "SELECT COUNT(*) as files, COALESCE(SUM(view_count),0) as views, COALESCE(SUM(download_count),0) as downloads FROM download_files"),
    // Daily signups for the last 14 days, oldest first — for the chart
    safeAll(
      env,
      `SELECT date(created_at) as day, COUNT(*) as n
       FROM users
       WHERE created_at > datetime('now', '-14 days')
       GROUP BY date(created_at)
       ORDER BY day ASC`
    ),
  ]);

  return NextResponse.json({
    users: {
      totalAllTime: totalUsers?.n ?? null,
      newLast7Days: newUsers7d?.n ?? null,
    },
    subscriptions: {
      activeNow: activeSubs?.n ?? null,
      createdAllTime: totalSubsEver?.n ?? null,
    },
    schedules: {
      totalAllTime: totalSchedules?.n ?? null,
      updatedLast7Days: schedules7d?.n ?? null,
    },
    orgs: {
      totalAllTime: totalOrgs?.n ?? null,
      activeNow: activeOrgs?.n ?? null,
      paidNow: paidOrgs?.n ?? null,
      codeRedemptionsAllTime: orgRedemptions?.n ?? null,
    },
    blog: {
      publishedPosts: blogTotals?.posts ?? null,
      totalViews: blogTotals?.views ?? null,
    },
    downloads: {
      totalFiles: downloadTotals?.files ?? null,
      totalViews: downloadTotals?.views ?? null,
      totalDownloads: downloadTotals?.downloads ?? null,
    },
    signupSeries, // [{ day: "2026-08-01", n: 3 }, ...]
  });
}
