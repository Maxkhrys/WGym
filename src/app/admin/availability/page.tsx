import { blockDay, removeBlock, updateOpeningHours } from "@/app/admin/actions";
import {
  AdminField,
  AdminToggle,
  EditableForm,
} from "@/components/admin/EditableForm";
import { RemoveBlockButton } from "@/components/admin/RemoveBlockButton";
import { Panel } from "@/components/ui/Surface";
import { WEEKDAY_INDEX, WEEKDAY_ORDER } from "@/config/site";
import { STAFF_ROLES, requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatDateLong, formatMinutesAsClock } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Availability",
  description: "Opening hours and closures.",
  path: "/admin/availability",
  noIndex: true,
});

export const dynamic = "force-dynamic";

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export default async function AdminAvailabilityPage() {
  await requireRole(STAFF_ROLES, "/admin/availability");

  // Sequential, not Promise.all — see src/lib/db/prisma.ts.
  const rules = await prisma.availabilityRule.findMany({
    where: { serviceId: null },
  });
  const blocks = await prisma.blockedTime.findMany({
    where: { endsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 30,
  });

  const byDay = new Map(rules.map((rule) => [rule.dayOfWeek, rule]));

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="u-eyebrow">Opening hours</h2>
        <p className="u-measure mt-4 text-[var(--text-body-sm)] leading-relaxed text-mist">
          These are the house hours in Irish time. They generate the bookable
          slots for every session, and they are what the site displays. Daylight
          saving is handled automatically — 06:00 stays 06:00 all year.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {WEEKDAY_ORDER.map((day) => {
            const index = WEEKDAY_INDEX[day];
            const rule = byDay.get(index);

            return (
              <EditableForm
                key={day}
                action={updateOpeningHours}
                title={DAY_LABELS[day]}
                subtitle={
                  rule
                    ? `${formatMinutesAsClock(rule.startMinute)} – ${formatMinutesAsClock(rule.endMinute)}`
                    : "Currently closed"
                }
              >
                <input type="hidden" name="dayOfWeek" value={index} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField
                    label="Opens"
                    name="open"
                    type="time"
                    defaultValue={
                      rule ? formatMinutesAsClock(rule.startMinute) : "06:00"
                    }
                  />
                  <AdminField
                    label="Closes"
                    name="close"
                    type="time"
                    defaultValue={
                      rule ? formatMinutesAsClock(rule.endMinute) : "21:00"
                    }
                  />
                </div>

                <AdminToggle
                  label="Closed all day"
                  name="closed"
                  defaultChecked={!rule}
                />
              </EditableForm>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="u-eyebrow">Closures</h2>
        <p className="u-measure mt-4 text-[var(--text-body-sm)] leading-relaxed text-mist">
          Block a whole day — bank holidays, maintenance, private events. Nobody
          can book any session on a blocked day. Existing bookings are not
          cancelled automatically; cancel those from the bookings page so the
          customer is emailed.
        </p>

        <div className="mt-6">
          <EditableForm
            action={blockDay}
            title="Block a day"
            submitLabel="Block day"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Date" name="date" type="date" required />
              <AdminField
                label="Reason"
                name="reason"
                defaultValue=""
                hint="Shown to staff only"
              />
            </div>
          </EditableForm>
        </div>

        <div className="mt-6">
          <h3 className="text-[var(--text-body-sm)] text-mist">
            Upcoming closures
          </h3>

          {blocks.length > 0 ? (
            <Panel className="mt-3 px-5 py-1">
              <ul>
                {blocks.map((block) => (
                  <li
                    key={block.id}
                    className="flex items-center justify-between gap-5 border-b border-line py-3.5 last:border-b-0"
                  >
                    <span className="min-w-0">
                      <span className="block text-[var(--text-body-sm)] text-bone">
                        {formatDateLong(block.startsAt)}
                      </span>
                      {block.reason ? (
                        <span className="block truncate text-[var(--text-caption)] text-mist-dim">
                          {block.reason}
                        </span>
                      ) : null}
                    </span>
                    <RemoveBlockButton blockId={block.id} action={removeBlock} />
                  </li>
                ))}
              </ul>
            </Panel>
          ) : (
            <Panel className="mt-3 p-6">
              <p className="text-[var(--text-body-sm)] text-mist">
                No closures scheduled.
              </p>
            </Panel>
          )}
        </div>
      </section>
    </div>
  );
}
