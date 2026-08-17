import "server-only";

import { prisma } from "@/lib/db/prisma";
import { endOfBusinessDay, startOfBusinessDay, todayKey } from "@/lib/booking/time";

/**
 * Admin overview figures.
 *
 * Queries run sequentially, never in parallel — see src/lib/db/prisma.ts. The
 * dashboard is a handful of indexed aggregates, so the difference is not
 * measurable, and correctness matters more than a few milliseconds.
 */
export async function getDashboardStats() {
  const today = todayKey();
  const dayStart = startOfBusinessDay(today);
  const dayEnd = endOfBusinessDay(today);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const todaysBookings = await prisma.booking.findMany({
    where: {
      startsAt: { gte: dayStart, lt: dayEnd },
      status: { in: ["CONFIRMED", "COMPLETED", "NO_SHOW"] },
    },
    include: { service: true },
    orderBy: { startsAt: "asc" },
  });

  const activeMemberCount = await prisma.membership.count({
    where: { status: "ACTIVE" },
  });

  const pastDueCount = await prisma.membership.count({
    where: { status: "PAST_DUE" },
  });

  const newMembershipsThisMonth = await prisma.membership.count({
    where: { status: "ACTIVE", startDate: { gte: monthAgo } },
  });

  // Monthly recurring revenue.
  //
  // Only genuinely recurring plans count: day passes and one-off purchases are
  // excluded, and annual plans are divided by twelve so the figure is
  // comparable month to month. Past-due memberships are excluded because that
  // money is not currently being collected.
  const activeMemberships = await prisma.membership.findMany({
    where: { status: "ACTIVE" },
    select: { plan: { select: { priceCents: true, interval: true, isDayPass: true } } },
  });

  const mrrCents = activeMemberships.reduce((total, membership) => {
    const { plan } = membership;
    if (plan.isDayPass || plan.interval === "ONE_TIME") return total;
    if (plan.interval === "YEAR") return total + Math.round(plan.priceCents / 12);
    return total + plan.priceCents;
  }, 0);

  const recentPayments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { user: { select: { name: true, email: true } } },
  });

  const upcomingBookings = await prisma.booking.findMany({
    where: { startsAt: { gte: dayEnd }, status: { in: ["CONFIRMED", "PENDING"] } },
    include: { service: true },
    orderBy: { startsAt: "asc" },
    take: 8,
  });

  const revenueThisMonthCents = await prisma.payment
    .aggregate({
      where: { status: "SUCCEEDED", createdAt: { gte: monthAgo } },
      _sum: { amountCents: true },
    })
    .then((result) => result._sum.amountCents ?? 0);

  return {
    todaysBookings,
    activeMemberCount,
    pastDueCount,
    newMembershipsThisMonth,
    mrrCents,
    recentPayments,
    upcomingBookings,
    revenueThisMonthCents,
  };
}

export async function getMembers({
  query,
  status,
  take = 50,
}: {
  query?: string;
  status?: string;
  take?: number;
}) {
  const trimmed = query?.trim();

  return prisma.user.findMany({
    where: {
      ...(trimmed
        ? {
            OR: [
              { name: { contains: trimmed, mode: "insensitive" as const } },
              { email: { contains: trimmed, mode: "insensitive" as const } },
              { memberCode: { contains: trimmed.toUpperCase() } },
            ],
          }
        : {}),
      ...(status && status !== "ALL"
        ? {
            memberships: {
              some: {
                status: status as
                  | "ACTIVE"
                  | "PENDING"
                  | "PAST_DUE"
                  | "CANCELLED"
                  | "EXPIRED",
              },
            },
          }
        : {}),
    },
    include: {
      memberships: {
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getBookingsForRange(from: Date, to: Date) {
  return prisma.booking.findMany({
    where: { startsAt: { gte: from, lt: to } },
    include: { service: true, user: { select: { name: true, email: true } } },
    orderBy: { startsAt: "asc" },
  });
}
