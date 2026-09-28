import fs from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL");
  process.exit(1);
}
if (url.includes("tpyygppuszvhpupnvmxp")) {
  console.error("Esta URL es la base de DINEO. No se aplica el esquema de SIRA ahí.");
  process.exit(1);
}

const sql = fs.readFileSync(new URL("../database/schema.sql", import.meta.url), "utf8");
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") || url.includes("127.0.0.1") ? undefined : { rejectUnauthorized: false },
});

await client.connect();
await client.query(sql);
await client.end();
console.log("Esquema de SIRA aplicado.");
