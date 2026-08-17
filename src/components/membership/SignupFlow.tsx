"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { completeSignup, type SignupState } from "@/app/signup/actions";
import { Button } from "@/components/ui/Button";
import { Checkbox, TextInput } from "@/components/ui/Field";
import { Badge, Panel, PlaceholderNote } from "@/components/ui/Surface";
import { cn } from "@/lib/cn";
import { formatBillingInterval, formatPrice } from "@/lib/format";

type Plan = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  priceCents: number;
  currency: string;
  interval: "MONTH" | "YEAR" | "ONE_TIME";
  joiningFeeCents: number;
  features: string[];
  minimumTermMonths: number;
  cancellationNotice: string | null;
  isDayPass: boolean;
};

const STEPS = [
  "Membership",
  "Your details",
  "Emergency contact",
  "Health",
  "Agreement",
  "Payment",
] as const;

const initialState: SignupState = { status: "idle" };

export function SignupFlow({
  plans,
  initialPlanSlug,
  stripeConfigured,
  signedInEmail,
}: {
  plans: Plan[];
  initialPlanSlug: string | null;
  stripeConfigured: boolean;
  signedInEmail: string | null;
}) {
  const [planSlug, setPlanSlug] = useState(
    initialPlanSlug ?? plans[0]?.slug ?? "",
  );
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState(completeSignup, initialState);

  const plan = plans.find((item) => item.slug === planSlug) ?? plans[0];

  if (!plan) {
    return (
      <p className="text-[var(--text-body)] text-mist">
        No memberships are available to join online at the moment.
      </p>
    );
  }

  if (state.status === "created") {
    return <SuccessPanel stripeConfigured={stripeConfigured} />;
  }

  const total = plan.priceCents + plan.joiningFeeCents;

  return (
    <div className="flex flex-col gap-10">
      <ProgressBar step={step} />

      {/*
        One form spans every step. Fields from earlier steps stay mounted but
        hidden, so a single submit carries the complete object to the server —
        which validates all of it at once and never trusts the step the client
        claims to be on.
      */}
      <form action={formAction} className="flex flex-col gap-10">
        <input type="hidden" name="planSlug" value={plan.slug} />

        <StepPanel index={0} current={step} title="Choose your membership">
          <div className="flex flex-col gap-3">
            {plans.map((option) => {
              const active = option.slug === planSlug;

              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPlanSlug(option.slug)}
                  className={cn(
                    "flex flex-col gap-2 rounded-2xl border p-5 text-left transition-colors duration-250",
                    active
                      ? "border-mint bg-surface"
                      : "border-line-hi bg-ink-raised hover:border-accent",
                  )}
                >
                  <span className="flex w-full items-baseline justify-between gap-4">
                    <span className="text-[length:var(--text-body-lg)] font-medium text-bone">
                      {option.name}
                    </span>
                    <span className="u-tnum shrink-0 text-[var(--text-body-sm)] text-accent-bright">
                      {formatPrice(option.priceCents, option.currency)}{" "}
                      <span className="text-mist">
                        {formatBillingInterval(option.interval)}
                      </span>
                    </span>
                  </span>
                  <span className="text-[var(--text-body-sm)] leading-relaxed text-mist">
                    {option.description}
                  </span>
                  {option.joiningFeeCents > 0 ? (
                    <span className="text-[var(--text-caption)] text-mist-dim">
                      Plus a {formatPrice(option.joiningFeeCents, option.currency)}{" "}
                      joining fee
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <NextButton onClick={() => setStep(1)}>Continue</NextButton>
        </StepPanel>

        <StepPanel index={1} current={step} title="Your details">
          <div className="grid gap-6 sm:grid-cols-2">
            <TextInput
              label="First name"
              name="firstName"
              autoComplete="given-name"
              required
            />
            <TextInput
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              required
            />
          </div>
          <TextInput
            label="Email address"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            defaultValue={signedInEmail ?? ""}
            hint="You will sign in with this address — no password needed."
            error={state.status === "error" && state.field === "email" ? state.message : undefined}
          />
          <TextInput
            label="Phone number"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
          />
          <TextInput
            label="Date of birth"
            name="dateOfBirth"
            type="date"
            autoComplete="bday"
            required
            hint="You need to be 16 or over to join online."
            error={
              state.status === "error" && state.field === "dateOfBirth"
                ? state.message
                : undefined
            }
          />

          <StepNav onBack={() => setStep(0)} onNext={() => setStep(2)} />
        </StepPanel>

        <StepPanel index={2} current={step} title="Emergency contact">
          <p className="u-measure text-[var(--text-body-sm)] leading-relaxed text-mist">
            Someone we can contact if something happens while you are training.
          </p>
          <TextInput label="Contact name" name="emergencyName" required />
          <TextInput
            label="Relationship to you"
            name="emergencyRelationship"
            optional
            placeholder="Partner, parent, friend…"
          />
          <TextInput
            label="Contact phone number"
            name="emergencyPhone"
            type="tel"
            inputMode="tel"
            required
          />

          <StepNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
        </StepPanel>

        <StepPanel index={3} current={step} title="Health declaration">
          {/*
            A self-declaration, not a screening. We do not assess anyone's
            health and give no medical advice — the wording points people to a
            professional instead.
          */}
          <div className="rounded-2xl border border-line bg-ink-raised p-6">
            <p className="text-[var(--text-body-sm)] leading-relaxed text-mist">
              Training and recovery facilities are used at your own pace and
              your own risk. Before confirming, please read the following:
            </p>
            <ul className="mt-5 flex flex-col gap-3">
              {[
                "I am not aware of any medical reason why I should not exercise.",
                "If I have a health condition, am pregnant, or am recovering from injury or illness, I have spoken to my GP or a qualified health professional about whether this is suitable for me.",
                "I will stop and seek help if I feel unwell while training or using the recovery facilities.",
                "I will let staff know about anything that might affect my safety here.",
              ].map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 text-[var(--text-body-sm)] leading-relaxed text-mist"
                >
                  <span
                    aria-hidden
                    className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-accent-bright"
                  />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[var(--text-caption)] leading-relaxed text-mist-dim">
              The W cannot give medical advice and does not assess your health.
              If you are unsure about any of the above, please speak to your GP
              before joining.
            </p>
          </div>

          <Checkbox
            name="healthAcknowledged"
            required
            label="I have read the statements above and confirm they apply to me."
          />

          <StepNav onBack={() => setStep(2)} onNext={() => setStep(4)} />
        </StepPanel>

        <StepPanel index={4} current={step} title="Membership agreement">
          <Panel className="p-6">
            <h3 className="u-eyebrow">What you are agreeing to</h3>
            <dl className="mt-5 flex flex-col gap-3.5">
              <SummaryRow label="Membership" value={plan.name} />
              <SummaryRow
                label="Price"
                value={`${formatPrice(plan.priceCents, plan.currency)} ${formatBillingInterval(plan.interval)}`}
              />
              {plan.joiningFeeCents > 0 ? (
                <SummaryRow
                  label="Joining fee"
                  value={formatPrice(plan.joiningFeeCents, plan.currency)}
                />
              ) : null}
              <SummaryRow
                label="Minimum term"
                value={
                  plan.minimumTermMonths > 0
                    ? `${plan.minimumTermMonths} month${plan.minimumTermMonths === 1 ? "" : "s"}`
                    : "None"
                }
              />
              <SummaryRow
                label="Notice to cancel"
                value={plan.cancellationNotice ?? "—"}
              />
            </dl>
          </Panel>

          <Checkbox
            name="acceptMembershipTerms"
            required
            label={
              <>
                I accept the{" "}
                <Link
                  href="/legal/membership-terms"
                  target="_blank"
                  className="underline underline-offset-4"
                >
                  membership terms
                </Link>{" "}
                and the{" "}
                <Link
                  href="/legal/cancellation"
                  target="_blank"
                  className="underline underline-offset-4"
                >
                  cancellation policy
                </Link>
                .
              </>
            }
          />

          <Checkbox
            name="acceptPrivacyPolicy"
            required
            label={
              <>
                I have read the{" "}
                <Link
                  href="/legal/privacy"
                  target="_blank"
                  className="underline underline-offset-4"
                >
                  privacy policy
                </Link>{" "}
                and understand how my data is used.
              </>
            }
          />

          {/*
            Separate, optional, unticked. Bundling this into the required boxes
            above would not be valid consent under GDPR.
          */}
          <Checkbox
            name="marketingOptIn"
            label="Email me occasionally about The W"
            description="Optional — offers, classes and news. Nothing to do with your membership, and you can stop any time."
          />

          <StepNav onBack={() => setStep(3)} onNext={() => setStep(5)} nextLabel="Review and pay" />
        </StepPanel>

        <StepPanel index={5} current={step} title="Payment">
          <Panel className="p-6">
            <h3 className="u-eyebrow">Summary</h3>
            <dl className="mt-5 flex flex-col gap-3.5">
              <SummaryRow label={plan.name} value={formatPrice(plan.priceCents, plan.currency)} />
              {plan.joiningFeeCents > 0 ? (
                <SummaryRow
                  label="Joining fee"
                  value={formatPrice(plan.joiningFeeCents, plan.currency)}
                />
              ) : null}
              <div className="mt-2 flex items-baseline justify-between gap-6 border-t border-line pt-4">
                <dt className="text-[var(--text-body)] text-bone">
                  {plan.interval === "ONE_TIME" ? "Total" : "Due today"}
                </dt>
                <dd className="u-tnum text-[length:var(--text-h4)] text-accent-bright">
                  {formatPrice(total, plan.currency)}
                </dd>
              </div>
            </dl>
            {plan.interval !== "ONE_TIME" ? (
              <p className="mt-5 text-[var(--text-caption)] leading-relaxed text-mist-dim">
                Then {formatPrice(plan.priceCents, plan.currency)}{" "}
                {formatBillingInterval(plan.interval)} until you cancel.
              </p>
            ) : null}
          </Panel>

          {!stripeConfigured ? (
            <PlaceholderNote>
              Payments are not connected yet, so this will create your
              membership without taking any money. Add the Stripe keys to the
              environment and this step becomes a real checkout.
            </PlaceholderNote>
          ) : null}

          {state.status === "error" ? (
            <p
              role="alert"
              className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3.5 text-[var(--text-body-sm)] leading-relaxed text-danger"
            >
              {state.message}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button type="submit" size="lg" disabled={pending} fullWidth>
              {pending
                ? "Setting up…"
                : stripeConfigured
                  ? `Pay ${formatPrice(total, plan.currency)}`
                  : "Create membership"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => setStep(4)}
            >
              Back
            </Button>
          </div>

          <p className="text-[var(--text-caption)] leading-relaxed text-mist-dim">
            Card details are entered on Stripe&rsquo;s own secure page and are
            never stored by us. Your membership only becomes active once payment
            is confirmed.
          </p>
        </StepPanel>
      </form>
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="u-eyebrow">
          Step {step + 1} of {STEPS.length}
        </p>
        <p className="text-[var(--text-body-sm)] text-bone">{STEPS[step]}</p>
      </div>
      <div
        className="mt-4 h-px w-full bg-line"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={step + 1}
        aria-label="Signup progress"
      >
        <div
          className="h-px bg-accent-bright transition-[width] duration-500 ease-[var(--ease-out-quint)]"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Inactive steps stay in the DOM so their values submit, but are hidden and
 * made inert so they are not focusable or announced.
 */
function StepPanel({
  index,
  current,
  title,
  children,
}: {
  index: number;
  current: number;
  title: string;
  children: React.ReactNode;
}) {
  const active = index === current;

  return (
    <section
      hidden={!active}
      inert={!active}
      aria-label={title}
      className="flex flex-col gap-6"
    >
      <h2 className="text-[length:var(--text-h3)] leading-none">{title}</h2>
      {children}
    </section>
  );
}

function StepNav({
  onBack,
  onNext,
  nextLabel = "Continue",
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
      <Button type="button" size="lg" onClick={onNext} fullWidth>
        {nextLabel}
      </Button>
      <Button type="button" variant="ghost" size="lg" onClick={onBack}>
        Back
      </Button>
    </div>
  );
}

function NextButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button type="button" size="lg" onClick={onClick} className="mt-2 self-start">
      {children}
    </Button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="text-[var(--text-body-sm)] text-mist">{label}</dt>
      <dd className="u-tnum text-right text-[var(--text-body-sm)] text-bone">
        {value}
      </dd>
    </div>
  );
}

function SuccessPanel({ stripeConfigured }: { stripeConfigured: boolean }) {
  return (
    <Panel className="p-8">
      <Badge tone="positive">Membership created</Badge>
      <h2 className="mt-6 text-[length:var(--text-h3)]">You&rsquo;re in</h2>
      <p className="mt-5 text-[var(--text-body)] leading-relaxed text-mist">
        {stripeConfigured
          ? "Your membership is set up. A confirmation email is on its way."
          : "Your membership has been created without payment, because payments are not connected yet. A confirmation email is on its way."}
      </p>
      <p className="mt-4 text-[var(--text-body-sm)] leading-relaxed text-mist-dim">
        Sign in with your email address any time to see your membership, your
        member code and your bookings.
      </p>
      <div className="mt-8">
        <Link
          href="/account"
          className="u-tap inline-flex items-center rounded-full bg-mint px-6 py-3 text-[var(--text-body-sm)] font-medium text-ink transition-colors hover:bg-bone"
        >
          Go to your account
        </Link>
      </div>
    </Panel>
  );
}
