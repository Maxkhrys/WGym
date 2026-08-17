"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import { createBooking, type BookingActionState } from "@/app/sauna/book/actions";
import { DateStrip } from "@/components/booking/DateStrip";
import { SlotPicker } from "@/components/booking/SlotPicker";
import { Button } from "@/components/ui/Button";
import { Checkbox, TextInput } from "@/components/ui/Field";
import { Badge, Panel } from "@/components/ui/Surface";
import type { DayAvailability, Slot } from "@/lib/booking/availability";
import { cn } from "@/lib/cn";
import { formatDateLong, formatDuration, formatPrice } from "@/lib/format";

type ServiceOption = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  maxGuestsPerBooking: number;
  isExclusive: boolean;
};

type Step = 1 | 2 | 3;

const DAYS_IN_VIEW = 14;

const initialState: BookingActionState = { status: "idle" };

export function BookingFlow({
  services,
  initialServiceSlug,
  today,
  signedInEmail,
  signedInName,
}: {
  services: ServiceOption[];
  initialServiceSlug: string | null;
  /** Today's date in Europe/Dublin, resolved on the server. */
  today: string;
  signedInEmail: string | null;
  signedInName: string | null;
}) {
  const [serviceSlug, setServiceSlug] = useState<string>(
    initialServiceSlug ?? services[0]?.slug ?? "",
  );
  const [rangeStart, setRangeStart] = useState<string>(today);
  // Availability is stored together with the query it answers. `loading` is
  // then derived by comparing that key with the current selection rather than
  // tracked as its own boolean — which means it can never disagree with the
  // data on screen, and a stale response for a previous service or week can
  // never be mistaken for the current one.
  const [result, setResult] = useState<{
    key: string;
    days: DayAvailability[];
    error: string | null;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [step, setStep] = useState<Step>(1);

  const [state, formAction, pending] = useActionState(createBooking, initialState);

  const service = useMemo(
    () => services.find((item) => item.slug === serviceSlug) ?? services[0],
    [services, serviceSlug],
  );

  const queryKey = `${serviceSlug}|${rangeStart}`;

  useEffect(() => {
    if (!serviceSlug) return;

    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(
          `/api/availability?service=${encodeURIComponent(serviceSlug)}&from=${rangeStart}&days=${DAYS_IN_VIEW}`,
          { signal: controller.signal, cache: "no-store" },
        );

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error ?? "Could not load availability.");
        }

        const body = (await response.json()) as { days: DayAvailability[] };

        setResult({ key: queryKey, days: body.days, error: null });

        // Land the reader on the first day that actually has something.
        setSelectedDate((current) => {
          if (current && body.days.some((day) => day.date === current && day.open)) {
            return current;
          }
          return body.days.find((day) => day.open)?.date ?? null;
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setResult({
          key: queryKey,
          days: [],
          error:
            error instanceof Error ? error.message : "Could not load availability.",
        });
      }
    }

    load();

    // Abort the in-flight request when the service or week changes, so a slow
    // earlier response cannot overwrite newer data.
    return () => controller.abort();
  }, [serviceSlug, rangeStart, queryKey]);

  const loading = result?.key !== queryKey;
  // Memoised so the identity is stable while the same result is on screen —
  // otherwise the empty-array fallback would be a new value every render and
  // invalidate the `slots` memo below.
  const days = useMemo(
    () => (result?.key === queryKey ? result.days : []),
    [result, queryKey],
  );
  const loadError = result?.key === queryKey ? result.error : null;

  // Selection changes are handled where they originate rather than in reactive
  // effects. Choosing a date cannot leave a time from a different date
  // selected, and switching service resets the whole downstream selection —
  // doing that here keeps it in one obvious place and avoids the extra render
  // pass an effect would cost.
  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  function handleSelectService(slug: string) {
    const next = services.find((option) => option.slug === slug);
    setServiceSlug(slug);
    setSelectedSlot(null);
    // Clamp guests when moving to a service that allows fewer.
    if (next) {
      setGuestCount((current) => Math.min(current, next.maxGuestsPerBooking));
    }
  }

  const slots: Slot[] = useMemo(
    () => days.find((day) => day.date === selectedDate)?.slots ?? [],
    [days, selectedDate],
  );

  const chosenSlot = useMemo(
    () => slots.find((slot) => slot.startsAt === selectedSlot) ?? null,
    [slots, selectedSlot],
  );

  if (!service) {
    return (
      <p className="text-[var(--text-body)] text-mist">
        No sessions are bookable at the moment. Please check back shortly.
      </p>
    );
  }

  const totalCents = service.isExclusive
    ? service.priceCents
    : service.priceCents * guestCount;

  const maxGuestsForSlot = Math.min(
    service.maxGuestsPerBooking,
    chosenSlot?.remaining ?? service.maxGuestsPerBooking,
  );

  if (state.status === "confirmed") {
    return <ConfirmedPanel reference={state.reference} />;
  }

  return (
    <div className="flex flex-col gap-12">
      <Stepper step={step} />

      {/* Step 1 — service */}
      <Section
        index={1}
        title="Choose a session"
        open={step >= 1}
        onEdit={() => setStep(1)}
        summary={step > 1 ? service.name : null}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((option) => {
            const active = option.slug === serviceSlug;

            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleSelectService(option.slug)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-2xl border p-5 text-left transition-colors duration-250",
                  active
                    ? "border-mint bg-surface"
                    : "border-line-hi bg-ink-raised hover:border-accent",
                )}
              >
                <span className="flex w-full items-baseline justify-between gap-3">
                  <span className="text-[length:var(--text-body-lg)] font-medium text-bone">
                    {option.name}
                  </span>
                  <span className="u-tnum shrink-0 text-[var(--text-body-sm)] text-accent-bright">
                    {formatPrice(option.priceCents, option.currency)}
                    {option.isExclusive ? "" : " pp"}
                  </span>
                </span>
                <span className="text-[var(--text-caption)] text-mist-dim">
                  {formatDuration(option.durationMinutes)}
                  {option.tagline ? ` · ${option.tagline}` : ""}
                </span>
                <span className="mt-1 text-[var(--text-body-sm)] leading-relaxed text-mist">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          <Button onClick={() => setStep(2)} size="lg">
            Continue
          </Button>
        </div>
      </Section>

      {/* Step 2 — date & time */}
      {step >= 2 ? (
        <Section
          index={2}
          title="Pick a date and time"
          open={step >= 2}
          onEdit={() => setStep(2)}
          summary={
            step > 2 && chosenSlot && selectedDate
              ? `${formatDateLong(new Date(`${selectedDate}T12:00:00Z`))} at ${chosenSlot.label}`
              : null
          }
        >
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setRangeStart(shiftDate(rangeStart, -DAYS_IN_VIEW, today))}
              disabled={rangeStart === today}
              className="u-tap rounded-full border border-line-hi px-4 text-[var(--text-body-sm)] text-mist transition-colors hover:border-accent hover:text-bone disabled:opacity-40"
            >
              ← Earlier
            </button>
            <button
              type="button"
              onClick={() => setRangeStart(shiftDate(rangeStart, DAYS_IN_VIEW, today))}
              className="u-tap rounded-full border border-line-hi px-4 text-[var(--text-body-sm)] text-mist transition-colors hover:border-accent hover:text-bone"
            >
              Later →
            </button>
          </div>

          <div className="mt-5">
            <DateStrip
              days={days}
              selected={selectedDate}
              onSelect={handleSelectDate}
              loading={loading}
            />
          </div>

          {loadError ? (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-[var(--text-body-sm)] text-danger"
            >
              {loadError}
            </p>
          ) : null}

          <div className="mt-9">
            <h3 className="u-eyebrow mb-5">
              {selectedDate
                ? formatDateLong(new Date(`${selectedDate}T12:00:00Z`))
                : "Select a date"}
            </h3>
            <SlotPicker
              slots={slots}
              selected={selectedSlot}
              onSelect={setSelectedSlot}
              loading={loading}
            />
          </div>

          {service.maxGuestsPerBooking > 1 ? (
            <div className="mt-9">
              <h3 className="u-eyebrow mb-4">Guests</h3>
              <GuestStepper
                value={guestCount}
                max={maxGuestsForSlot}
                onChange={setGuestCount}
              />
              {service.isExclusive ? (
                <p className="mt-3 text-[var(--text-caption)] text-mist-dim">
                  Private hire is a flat price for the space, whoever comes.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-10">
            <Button
              size="lg"
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
            >
              Continue to details
            </Button>
          </div>
        </Section>
      ) : null}

      {/* Step 3 — details & payment */}
      {step >= 3 && chosenSlot && selectedDate ? (
        <Section index={3} title="Your details" open>
          <form action={formAction} className="flex flex-col gap-7">
            <input type="hidden" name="serviceSlug" value={service.slug} />
            <input type="hidden" name="startsAt" value={chosenSlot.startsAt} />
            <input type="hidden" name="guestCount" value={guestCount} />

            <Panel className="p-6">
              <h3 className="u-eyebrow">Summary</h3>
              <dl className="mt-5 flex flex-col gap-3">
                <SummaryRow label="Session" value={service.name} />
                <SummaryRow
                  label="Date"
                  value={formatDateLong(new Date(`${selectedDate}T12:00:00Z`))}
                />
                <SummaryRow label="Time" value={chosenSlot.label} />
                <SummaryRow
                  label="Duration"
                  value={formatDuration(service.durationMinutes)}
                />
                <SummaryRow label="Guests" value={String(guestCount)} />
                <div className="mt-2 flex items-baseline justify-between gap-6 border-t border-line pt-4">
                  <dt className="text-[var(--text-body)] text-bone">Total</dt>
                  <dd className="u-tnum text-[length:var(--text-h4)] text-accent-bright">
                    {formatPrice(totalCents, service.currency)}
                  </dd>
                </div>
              </dl>
            </Panel>

            <TextInput
              label="Full name"
              name="customerName"
              autoComplete="name"
              required
              defaultValue={signedInName ?? ""}
            />

            <TextInput
              label="Email address"
              name="customerEmail"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              defaultValue={signedInEmail ?? ""}
              hint="Your confirmation and booking reference go here."
            />

            <TextInput
              label="Phone number"
              name="customerPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              optional
              hint="Only used if we need to contact you about this booking."
            />

            <Checkbox
              name="acceptTerms"
              required
              label={
                <>
                  I accept the{" "}
                  <a
                    href="/legal/cancellation"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4"
                  >
                    booking and cancellation policy
                  </a>
                  .
                </>
              }
            />

            {/* Deliberately separate from the required checkbox above and not
                pre-ticked — bundling marketing consent into terms acceptance
                would not be valid consent under GDPR. */}
            <Checkbox
              name="marketingOptIn"
              label="Email me occasionally about The W"
              description="Optional. Nothing to do with this booking, and you can stop any time."
            />

            {state.status === "error" ? (
              <p
                role="alert"
                className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3.5 text-[var(--text-body-sm)] leading-relaxed text-danger"
              >
                {state.message}
              </p>
            ) : null}

            <Button type="submit" size="lg" disabled={pending} fullWidth>
              {pending
                ? "Holding your slot…"
                : `Pay ${formatPrice(totalCents, service.currency)} and book`}
            </Button>

            <p className="text-[var(--text-caption)] leading-relaxed text-mist-dim">
              Your slot is held while you pay. Card details are entered on
              Stripe&rsquo;s own secure page and are never stored by us.
            </p>
          </form>
        </Section>
      ) : null}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const labels = ["Session", "Date & time", "Details"];

  return (
    <ol className="flex items-center gap-3" aria-label="Booking progress">
      {labels.map((label, index) => {
        const number = (index + 1) as Step;
        const done = step > number;
        const current = step === number;

        return (
          <li key={label} className="flex flex-1 items-center gap-3">
            <span
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[var(--text-caption)]",
                done || current
                  ? "border-accent-bright text-accent-bright"
                  : "border-line-hi text-mist-dim",
              )}
            >
              {done ? "✓" : number}
            </span>
            <span
              className={cn(
                "hidden text-[var(--text-body-sm)] sm:block",
                current ? "text-bone" : "text-mist-dim",
              )}
            >
              {label}
            </span>
            {index < labels.length - 1 ? (
              <span aria-hidden className="h-px flex-1 bg-line" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function Section({
  index,
  title,
  children,
  open,
  onEdit,
  summary,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
  open: boolean;
  onEdit?: () => void;
  summary?: string | null;
}) {
  if (summary) {
    return (
      <div className="flex items-center justify-between gap-6 border-t border-line pt-6">
        <div>
          <p className="u-eyebrow">
            {String(index).padStart(2, "0")} · {title}
          </p>
          <p className="mt-2 text-[length:var(--text-body-lg)] text-bone">
            {summary}
          </p>
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="u-tap shrink-0 rounded-full border border-line-hi px-4 text-[var(--text-body-sm)] text-mist transition-colors hover:border-accent hover:text-bone"
          >
            Change
          </button>
        ) : null}
      </div>
    );
  }

  if (!open) return null;

  return (
    <section className="border-t border-line pt-8">
      <h2 className="u-eyebrow">
        {String(index).padStart(2, "0")} · {title}
      </h2>
      <div className="mt-7">{children}</div>
    </section>
  );
}

function GuestStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        aria-label="Fewer guests"
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
        className="u-tap flex h-12 w-12 items-center justify-center rounded-full border border-line-hi text-[1.25rem] text-bone transition-colors hover:border-accent disabled:opacity-40"
      >
        −
      </button>
      <span
        aria-live="polite"
        className="u-tnum min-w-[2ch] text-center text-[length:var(--text-h4)] text-bone"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="More guests"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="u-tap flex h-12 w-12 items-center justify-center rounded-full border border-line-hi text-[1.25rem] text-bone transition-colors hover:border-accent disabled:opacity-40"
      >
        +
      </button>
      <span className="text-[var(--text-caption)] text-mist-dim">
        Up to {max}
      </span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="text-[var(--text-body-sm)] text-mist">{label}</dt>
      <dd className="text-right text-[var(--text-body-sm)] text-bone">{value}</dd>
    </div>
  );
}

function ConfirmedPanel({ reference }: { reference: string }) {
  return (
    <Panel className="p-8">
      <Badge tone="positive">Confirmed</Badge>
      <h2 className="mt-6 text-[length:var(--text-h3)]">Your session is booked</h2>
      <p className="mt-5 text-[var(--text-body)] leading-relaxed text-mist">
        Your booking reference is{" "}
        <span className="u-tnum text-bone">{reference}</span>. A confirmation
        email is on its way with the full details.
      </p>
      <p className="mt-4 text-[var(--text-body-sm)] leading-relaxed text-mist-dim">
        Arrive about five minutes early, and bring a towel and swimwear.
      </p>
    </Panel>
  );
}

/** Moves the visible window, never earlier than today. */
function shiftDate(from: string, days: number, floor: string): string {
  const date = new Date(`${from}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  const next = date.toISOString().slice(0, 10);
  return next < floor ? floor : next;
}
