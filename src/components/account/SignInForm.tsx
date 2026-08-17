"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { requestSignInLink, type SignInState } from "@/app/signin/actions";

const initialState: SignInState = { status: "idle" };

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(
    requestSignInLink,
    initialState,
  );

  if (state.status === "sent") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-line bg-ink-raised p-7"
      >
        <h2 className="text-[length:var(--text-h4)]">Check your email</h2>
        <p className="mt-4 text-[var(--text-body-sm)] leading-relaxed text-mist">
          If an account can be created or found for{" "}
          <span className="text-bone">{state.email}</span>, a sign-in link is on
          its way. It expires in 24 hours.
        </p>
        <p className="mt-4 text-[var(--text-caption)] leading-relaxed text-mist-dim">
          Nothing arriving? Check your spam folder, then try again in a few
          minutes.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <TextInput
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        placeholder="you@example.com"
        error={state.status === "error" ? state.message : undefined}
      />

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Sending…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
