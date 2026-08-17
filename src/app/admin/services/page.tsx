import { updateService } from "@/app/admin/actions";
import {
  AdminField,
  AdminToggle,
  EditableForm,
} from "@/components/admin/EditableForm";
import { MANAGER_ROLES, requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Sessions",
  description: "Edit sauna and recovery sessions.",
  path: "/admin/services",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  await requireRole(MANAGER_ROLES, "/admin/services");

  const services = await prisma.saunaService.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="u-eyebrow">Sauna &amp; recovery sessions</h2>
        <p className="u-measure mt-4 text-[var(--text-body-sm)] leading-relaxed text-mist">
          Duration and buffer set the slot grid: slots are spaced by duration
          plus buffer, and the last one of the day must finish by closing time.
          Changing these changes what customers can book from the next page
          load.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {services.map((service) => (
          <EditableForm
            key={service.id}
            action={updateService}
            title={service.name}
            subtitle={`${service.slug}${service.isExclusive ? " · exclusive hire" : ""}`}
          >
            <input type="hidden" name="serviceId" value={service.id} />

            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Name" name="name" defaultValue={service.name} required />
              <AdminField
                label={service.isExclusive ? "Price (€, whole room)" : "Price (€ per guest)"}
                name="priceEuros"
                type="number"
                step="0.01"
                min={0}
                defaultValue={(service.priceCents / 100).toFixed(2)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AdminField
                label="Duration (min)"
                name="durationMinutes"
                type="number"
                min={5}
                max={480}
                defaultValue={service.durationMinutes}
                required
              />
              <AdminField
                label="Buffer (min)"
                name="bufferMinutes"
                type="number"
                min={0}
                max={240}
                defaultValue={service.bufferMinutes}
                hint="Turnaround after each session"
                required
              />
              <AdminField
                label="Capacity"
                name="capacity"
                type="number"
                min={1}
                max={100}
                defaultValue={service.capacity}
                hint="Guests per slot in total"
                required
              />
              <AdminField
                label="Max per booking"
                name="maxGuestsPerBooking"
                type="number"
                min={1}
                max={100}
                defaultValue={service.maxGuestsPerBooking}
                required
              />
            </div>

            <AdminToggle
              label="Bookable"
              name="active"
              defaultChecked={service.active}
            />
          </EditableForm>
        ))}
      </div>
    </div>
  );
}
