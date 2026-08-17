"use client";

import { useActionState } from "react";

import { sendEnquiry, type ContactState } from "@/app/contact/actions";
import { Button } from "@/components/ui/Button";
import { TextArea, TextInput } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Surface";

const initialState: ContactState = { status: "idle" };

export function ContactForm({ defaultSubject }: { defaultSubject?: string }) {
  const [state, formAction, pending] = useActionState(sendEnquiry, initialState);

  if (state.status === "sent") {
    return (
      <Panel className="p-7">
        <h2 className="text-[length:var(--text-h4)]">Message sent</h2>
        <p className="mt-4 text-[var(--text-body-sm)] leading-relaxed text-mist">
          Thanks — we have your message and will come back to you as soon as we
          can.
        </p>
      </Panel>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <TextInput label="Your name" name="name" autoComplete="name" required />

      <TextInput
        label="Email address"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        hint="So we can reply."
      />

      <TextInput
        label="Subject"
        name="subject"
        optional
        defaultValue={defaultSubject}
      />

      <TextArea
        label="Message"
        name="message"
        required
        rows={6}
        placeholder="How can we help?"
      />

      {/*
        Honeypot. Hidden from sight and from assistive technology, and never
        focusable — only an automated submitter fills it in. This is why the
        form needs no CAPTCHA.
      */}
      <div aria-hidden className="hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state.status === "error" ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3.5 text-[var(--text-body-sm)] leading-relaxed text-danger"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
