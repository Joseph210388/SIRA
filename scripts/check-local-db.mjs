import fs from "node:fs";
import pg from "pg";

const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.split(/\r?\n/).find((line) => line.startsWith("DATABASE_URL="))?.slice("DATABASE_URL=".length);
if (!url) {
  throw new Error("DATABASE_URL");
}

const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query("begin");
await client.query("select set_config('app.current_user_id', '', true)");
await client.query("set local role sira_app");
const strings = await client.query("select count(*)::int as n from ui_strings");
const locales = await client.query("select count(*)::int as n from locales");
const categories = await client.query("select count(*)::int as n from categories");
await client.query("rollback");
await client.end();
process.stdout.write(
  `ui_strings=${strings.rows[0].n} locales=${locales.rows[0].n} categories=${categories.rows[0].n}\n`,
);
