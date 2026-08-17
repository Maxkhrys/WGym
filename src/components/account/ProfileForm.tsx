"use client";

import { useActionState } from "react";

import { updateProfile, type AccountActionState } from "@/app/account/actions";
import { Button } from "@/components/ui/Button";
import { Checkbox, TextInput } from "@/components/ui/Field";

const initialState: AccountActionState = { status: "idle" };

export function ProfileForm({
  defaultName,
  defaultPhone,
  defaultMarketingOptIn,
  email,
}: {
  defaultName: string;
  defaultPhone: string;
  defaultMarketingOptIn: boolean;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <TextInput
        label="Full name"
        name="name"
        autoComplete="name"
        required
        defaultValue={defaultName}
      />

      <TextInput
        label="Phone number"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        optional
        defaultValue={defaultPhone}
      />

      {/* Email is the sign-in identity, so changing it is not self-service —
          it would let someone lock another member out of their own account. */}
      <TextInput
        label="Email address"
        name="email"
        type="email"
        value={email}
        readOnly
        disabled
        hint="Your email is how you sign in. Contact us if you need it changed."
      />

      <Checkbox
        name="marketingOptIn"
        defaultChecked={defaultMarketingOptIn}
        label="Email me occasionally about The W"
        description="Offers, classes and news. Unticking this stops them straight away."
      />

      {state.status === "error" ? (
        <p role="alert" className="text-[var(--text-body-sm)] text-danger">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p role="status" className="text-[var(--text-body-sm)] text-positive">
          {state.message}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
