import { MembershipActions } from "@/components/admin/MembershipActions";
import { Badge, Panel } from "@/components/ui/Surface";
import { MANAGER_ROLES, getSessionUser } from "@/lib/auth/guards";
import { formatDateLong, formatPrice } from "@/lib/format";
import { getMembers } from "@/lib/queries/admin";
import { buildMetadata } from "@/lib/seo";
import type { MembershipStatus } from "@/generated/prisma/enums";

export const metadata = buildMetadata({
  title: "Members",
  description: "Member list.",
  path: "/admin/members",
  noIndex: true,
});

export const dynamic = "force-dynamic";

const STATUSES: (MembershipStatus | "ALL")[] = [
  "ALL",
  "ACTIVE",
  "PENDING",
  "PAST_DUE",
  "CANCELLED",
  "EXPIRED",
];

const TONE: Record<MembershipStatus, "positive" | "caution" | "danger" | "neutral"> =
  {
    ACTIVE: "positive",
    PENDING: "caution",
    PAST_DUE: "danger",
    CANCELLED: "neutral",
    EXPIRED: "neutral",
  };

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();
  const isManager = user ? MANAGER_ROLES.includes(user.role) : false;

  const members = await getMembers({
    query: params.q,
    status: params.status,
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="u-eyebrow">Members</h2>

        {/* GET form so a filtered view is a shareable, bookmarkable URL. */}
        <form className="mt-5 flex flex-col gap-3 sm:flex-row" role="search">
          <label className="sr-only" htmlFor="member-search">
            Search members
          </label>
          <input
            id="member-search"
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Name, email or member code"
            className="w-full rounded-xl border border-line-hi bg-ink-raised px-4 py-3 text-bone placeholder:text-mist-dim/70 focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
          />

          <label className="sr-only" htmlFor="member-status">
            Filter by status
          </label>
          <select
            id="member-status"
            name="status"
            defaultValue={params.status ?? "ALL"}
            className="rounded-xl border border-line-hi bg-ink-raised px-4 py-3 text-bone focus:border-accent focus:outline-none"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All statuses" : status.replace("_", " ")}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="u-tap rounded-xl bg-mint px-6 font-medium text-ink transition-colors hover:bg-bone"
          >
            Search
          </button>
        </form>
      </div>

      <p className="text-[var(--text-body-sm)] text-mist">
        {members.length} member{members.length === 1 ? "" : "s"}
        {members.length === 50 ? " (showing the first 50)" : ""}
      </p>

      {members.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {members.map((member) => {
            const membership = member.memberships[0];

            return (
              <Panel key={member.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[length:var(--text-body-lg)] font-medium text-bone">
                      {member.name ?? "—"}
                    </p>
                    <p className="mt-1 truncate text-[var(--text-body-sm)] text-mist">
                      <a
                        href={`mailto:${member.email}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {member.email}
                      </a>
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-4 text-[var(--text-caption)] text-mist-dim">
                      {member.memberCode ? (
                        <span className="u-tnum">{member.memberCode}</span>
                      ) : null}
                      {member.phone ? <span>{member.phone}</span> : null}
                      <span>Joined {formatDateLong(member.createdAt)}</span>
                      {member.role !== "MEMBER" ? (
                        <span className="text-accent-bright">{member.role}</span>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {membership ? (
                      <>
                        <Badge tone={TONE[membership.status]}>
                          {membership.status.replace("_", " ")}
                        </Badge>
                        <span className="text-[var(--text-caption)] text-mist">
                          {membership.plan.name} ·{" "}
                          <span className="u-tnum">
                            {formatPrice(
                              membership.plan.priceCents,
                              membership.plan.currency,
                            )}
                          </span>
                        </span>
                      </>
                    ) : (
                      <Badge>No membership</Badge>
                    )}
                  </div>
                </div>

                {membership && isManager ? (
                  <div className="mt-4 border-t border-line pt-4">
                    <MembershipActions
                      membershipId={membership.id}
                      status={membership.status}
                      hasStripeSubscription={Boolean(membership.stripeSubscriptionId)}
                    />
                  </div>
                ) : null}
              </Panel>
            );
          })}
        </div>
      ) : (
        <Panel className="p-6">
          <p className="text-[var(--text-body-sm)] text-mist">
            No members match that search.
          </p>
        </Panel>
      )}
    </div>
  );
}
