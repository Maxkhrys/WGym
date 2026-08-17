import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type DefaultSession } from "next-auth";
import Resend from "next-auth/providers/resend";

import { prisma } from "@/lib/db/prisma";
import { renderEmail } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/send";
import { env } from "@/lib/env";
import type { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
  }
}

/**
 * Passwordless email sign-in.
 *
 * No password is ever stored, which removes the largest class of account
 * breach from a site that also holds membership and payment references. The
 * database session strategy is used rather than JWT so that a role change or
 * a cancelled membership takes effect immediately instead of at the next token
 * refresh, and so sessions can be revoked server-side.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },

  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-email",
    error: "/signin",
  },

  providers: [
    Resend({
      // The key may be absent in development; `sendVerificationRequest` routes
      // through our own sender, which logs the link to the console instead.
      apiKey: env.resendApiKey ?? "development-no-key",
      from: env.emailFrom,

      async sendVerificationRequest({ identifier, url }) {
        const { host } = new URL(url);

        const { html, text } = renderEmail({
          preheader: "Your sign-in link for The W. It expires in 24 hours.",
          heading: "Sign in to The W",
          body: [
            "Use the button below to sign in. The link works once and expires in 24 hours.",
            "If you did not request this, you can ignore this email — nobody can sign in without opening the link.",
          ],
          button: { label: "Sign in", url },
          footerNote: `This link was requested from ${host}.`,
        });

        await sendEmail({
          to: identifier,
          subject: "Your sign-in link for The W",
          html,
          text,
        });
      },
    }),
  ],

  callbacks: {
    // With the database strategy the session callback receives the user row,
    // so role and id come straight from the source of truth.
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = (user as { role?: Role }).role ?? "MEMBER";
      return session;
    },
  },

  events: {
    /**
     * Every account gets a member code at creation. It is the QR payload on
     * the account page and the value staff look up on the door, so it must
     * exist for members who signed in before ever buying anything.
     */
    async createUser({ user }) {
      if (!user.id) return;

      // memberCode is unique, so retry on the (very unlikely) collision rather
      // than leaving an account without a code.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { memberCode: generateMemberCode() },
          });
          return;
        } catch {
          // Fall through and try a different code.
        }
      }

      console.error(`Could not assign a member code to user ${user.id}`);
    },
  },

  trustHost: true,
});

/**
 * Human-readable member code. Ambiguous characters (0/O, 1/I) are excluded so
 * it can be read aloud at the desk without confusion.
 */
function generateMemberCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `W-${code}`;
}
