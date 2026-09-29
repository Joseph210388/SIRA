import fs from "node:fs";
import pg from "pg";

const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
function readUrl(name) {
  const found = env.split(/\r?\n/).find((item) => item.startsWith(`${name}=`));
  if (!found) return "";
  let value = found.slice(name.length + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value;
}
const appUrl = readUrl("DATABASE_URL");
const adminUrl = readUrl("POSTGRES_ADMIN_URL");
if (!appUrl) {
  console.error("NO_URL");
  process.exit(1);
}
let url = adminUrl || appUrl;
if (adminUrl) {
  const app = new URL(appUrl);
  const admin = new URL(adminUrl);
  admin.pathname = app.pathname;
  url = admin.toString();
}
if (url.includes("tpyygppuszvhpupnvmxp")) {
  console.error("WRONG_DB");
  process.exit(1);
}
const sql = fs.readFileSync(new URL("../database/patch-2026-09-29.sql", import.meta.url), "utf8");
const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query(sql);
await client.end();
console.log("PATCH_OK");
