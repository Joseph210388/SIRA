import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import * as schema from "@/lib/db/schema";

const globalForDb = globalThis as unknown as { pool?: Pool };

export type Db = NodePgDatabase<typeof schema>;

function needsSsl(url: string) {
  // En este ordenador Postgres no tiene SSL. En un servidor remoto, sí.
  return !url.includes("localhost") && !url.includes("127.0.0.1");
}

function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL");
  }
  // El proyecto taipei es DINEO. Este código no debe tocarlo.
  if (url.includes("tpyygppuszvhpupnvmxp")) {
    throw new Error("REFUSE_DINEO");
  }
  return url;
}

export function getPool() {
  if (!globalForDb.pool) {
    const url = databaseUrl();
    globalForDb.pool = new Pool({
      connectionString: url,
      max: 12,
      ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalForDb.pool;
}

export async function assumeUser(client: PoolClient, userId: string) {
  await client.query("select set_config('app.current_user_id', $1, true)", [userId]);
}

// Cada petición entra como sira_app. Así el RLS no se salta con el usuario postgres.
export async function withDatabase<T>(fn: (db: Db, client: PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.current_user_id', '', true)");
    await client.query("set local role sira_app");
    const db = drizzle(client, { schema });
    const result = await fn(db, client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
