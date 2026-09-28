import fs from "node:fs";
import { messageCatalog, locales } from "../lib/i18n.ts";

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

const rows = [];
for (const locale of locales) {
  for (const [key, value] of Object.entries(messageCatalog[locale])) {
    rows.push(`  (${quote(locale)}, ${quote(key)}, ${quote(value)})`);
  }
}

const seed = `INSERT INTO ui_strings (locale, string_key, value) VALUES\n${rows.join(",\n")};\n`;
const path = new URL("../database/schema.sql", import.meta.url);
const schema = fs.readFileSync(path, "utf8");
const start = schema.indexOf("-- UI_STRINGS_SEED");
const end = schema.indexOf("-- UI_STRINGS_SEED_END");
if (start < 0 || end < 0 || end < start) {
  throw new Error("Marcadores de semillas no encontrados");
}
const next = `${schema.slice(0, start)}-- UI_STRINGS_SEED\n${seed}\n${schema.slice(end)}`;
fs.writeFileSync(path, next);
console.log(`Filas de ui_strings: ${rows.length}`);
