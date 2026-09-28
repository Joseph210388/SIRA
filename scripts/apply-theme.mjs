import fs from "node:fs";
import pg from "pg";
import { locales, messageCatalog } from "../lib/i18n.ts";

const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.split(/\r?\n/).find((line) => line.startsWith("POSTGRES_ADMIN_URL="))?.slice("POSTGRES_ADMIN_URL=".length).trim();
if (!url) {
  throw new Error("POSTGRES_ADMIN_URL");
}

const admin = new URL(url);
admin.pathname = "/sira";

const sql = fs.readFileSync(new URL("../database/migrations/2026-09-28-theme.sql", import.meta.url), "utf8");
const client = new pg.Client({ connectionString: admin.toString() });

try {
  await client.connect();
  await client.query(sql);
  for (const locale of locales) {
    for (const [key, value] of Object.entries(messageCatalog[locale])) {
      await client.query(
        `insert into ui_strings (locale, string_key, value)
         values ($1, $2, $3)
         on conflict (locale, string_key) do update set value = excluded.value`,
        [locale, key, value],
      );
    }
  }
  const check = await client.query("select count(*)::int as n from information_schema.columns where table_name = 'users' and column_name = 'theme'");
  process.stdout.write(`theme_column=${check.rows[0].n}\n`);
} catch (error) {
  const message = error instanceof Error ? error.message : "theme-apply-failed";
  process.stderr.write(`${message.replace(/postgres:\/\/\S+/g, "postgres://redacted")}\n`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
