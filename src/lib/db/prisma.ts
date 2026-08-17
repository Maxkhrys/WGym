import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * ── DO NOT RUN PRISMA QUERIES IN PARALLEL ─────────────────────────────────
 *
 * Never wrap Prisma calls in `Promise.all`. Always `await` them one after the
 * other.
 *
 * With this stack (Prisma 7.9 + @prisma/adapter-pg + node-postgres),
 * dispatching several queries concurrently from one client interleaves them on
 * a pooled connection and their bind parameters cross over. The observed
 * failures were `invalid input syntax for type timestamp: "cmsw7qf2s..."` — a
 * record id arriving where a timestamp was expected — and `bind message
 * supplies 3 parameters, but prepared statement "" requires 0`.
 *
 * That is a correctness problem, not just noise: parameters landing in the
 * wrong query can return the *wrong rows* rather than raising an error, and
 * this application decides booking capacity from those rows.
 *
 * Measured on the availability endpoint: 4 concurrent requests each running 3
 * queries via `Promise.all` failed 15 times in 60. The identical workload with
 * the three queries awaited sequentially: 60 of 60 passed. The queries are
 * indexed and sub-millisecond, so serialising them costs nothing worth having.
 *
 * `Promise.all` over non-Prisma work is fine.
 * ──────────────────────────────────────────────────────────────────────────
 */

// Cached on globalThis in every environment, not just development.
//
// In development that survives HMR reloads. In production it matters just as
// much: the bundler can include this module in more than one route bundle, and
// each copy would otherwise construct its own pool. Several pools of `max`
// connections each will exceed the database's connection limit under load, and
// the symptom is confusing — queries fail with "Server has closed the
// connection" rather than anything that points at pooling. globalThis is
// per-process, so one pool per server process is exactly right.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and start the local database with `npm run db:dev`.",
    );
  }

  // The pool is constructed here and passed to the adapter as an instance
  // rather than as a config object. Handing the adapter a plain config lets it
  // manage pooling itself, which does not reliably reuse one pool — under
  // concurrent requests that opens connections without bound and the database
  // starts refusing them mid-query ("Server has closed the connection").
  // Owning the Pool guarantees exactly one, capped at `max`, with everything
  // beyond that queueing instead of opening a new connection.
  const max = Number(process.env.DATABASE_POOL_MAX ?? 10);

  const created = new Pool({
    connectionString,
    max: Number.isFinite(max) && max > 0 ? max : 10,
    // Long enough to outlast a queued booking transaction, short enough that a
    // genuinely stuck request surfaces as an error rather than hanging.
    connectionTimeoutMillis: 15_000,
    // Release idle connections quickly. Build-time prerendering runs across
    // several worker processes at once, each with its own pool, so holding
    // idle connections open makes the peak far higher than steady-state
    // traffic ever needs. Reconnecting is cheap; exhausting the server's
    // connection limit is not.
    idleTimeoutMillis: 10_000,
  });

  // An idle client erroring (a dropped connection, a restarted database) is
  // emitted on the pool. Without a listener Node treats it as unhandled and
  // takes the process down. Attached here, once, alongside construction.
  created.on("error", (error) => {
    console.error("Postgres pool error:", error.message);
  });

  return created;
}

function createPrismaClient(pool: Pool) {
  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const pool = globalForPrisma.pgPool ?? createPool();

export const prisma = globalForPrisma.prisma ?? createPrismaClient(pool);

globalForPrisma.pgPool = pool;
globalForPrisma.prisma = prisma;
