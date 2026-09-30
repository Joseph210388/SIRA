import {
  boolean,
  char,
  customType,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

export const accountKind = pgEnum("account_kind", ["current", "savings", "cash"]);
export const movementKind = pgEnum("movement_kind", ["opening", "income", "expense", "transfer"]);
export const movementDirection = pgEnum("movement_direction", ["in", "out"]);
export const movementOrigin = pgEnum("movement_origin", [
  "opening",
  "external",
  "gift",
  "withdrawal",
  "between_accounts",
]);
export const mfaMethod = pgEnum("mfa_method", ["pin", "totp"]);
export const spaceStatus = pgEnum("space_status", ["pending", "active", "dissolved"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
};

export const uiStrings = pgTable("ui_strings", {
  locale: text("locale").notNull(),
  stringKey: text("string_key").notNull(),
  value: text("value").notNull(),
});

export const countryAgeRules = pgTable("country_age_rules", {
  countryCode: char("country_code", { length: 2 }).primaryKey(),
  minimumAge: smallint("minimum_age").notNull(),
  basis: text("basis").notNull(),
});

export const themes = pgTable("themes", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  pageRgb: text("page_rgb").notNull(),
  surfaceRgb: text("surface_rgb").notNull(),
  inkRgb: text("ink_rgb").notNull(),
  primaryRgb: text("primary_rgb").notNull(),
  primaryDarkRgb: text("primary_dark_rgb").notNull(),
  softRgb: text("soft_rgb").notNull(),
  accentRgb: text("accent_rgb").notNull(),
  dangerRgb: text("danger_rgb").notNull(),
  incomeRgb: text("income_rgb").notNull(),
  expenseRgb: text("expense_rgb").notNull(),
  savingsRgb: text("savings_rgb").notNull(),
  chart1Rgb: text("chart_1_rgb").notNull(),
  chart2Rgb: text("chart_2_rgb").notNull(),
  chart3Rgb: text("chart_3_rgb").notNull(),
  chart4Rgb: text("chart_4_rgb").notNull(),
});

export const currencies = pgTable("currencies", {
  code: char("code", { length: 3 }).primaryKey(),
  name: text("name").notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: citext("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  countryCode: char("country_code", { length: 2 }).notNull(),
  locale: text("locale").notNull(),
  timezone: text("timezone").notNull(),
  theme: text("theme").notNull().default("emerald"),
  currencyCode: char("currency_code", { length: 3 }).notNull().default("EUR"),
  themeChosenAt: timestamp("theme_chosen_at", { withTimezone: true, mode: "date" }),
  categoriesChosenAt: timestamp("categories_chosen_at", { withTimezone: true, mode: "date" }),
  firstNameCiphertext: bytea("first_name_ciphertext").notNull(),
  lastNameCiphertext: bytea("last_name_ciphertext").notNull(),
  phoneCiphertext: bytea("phone_ciphertext").notNull(),
  cityCiphertext: bytea("city_ciphertext").notNull(),
  localityCiphertext: bytea("locality_ciphertext").notNull(),
  birthDateCiphertext: bytea("birth_date_ciphertext").notNull(),
  encryptionKeyVersion: smallint("encryption_key_version").notNull().default(1),
  ...timestamps,
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey(),
  displayName: text("display_name").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const legalAcceptances = pgTable("legal_acceptances", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  countryCode: char("country_code", { length: 2 }).notNull(),
  minimumAge: smallint("minimum_age").notNull(),
  termsVersion: text("terms_version").notNull(),
  privacyVersion: text("privacy_version").notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const userMfa = pgTable("user_mfa", {
  userId: uuid("user_id").primaryKey(),
  method: mfaMethod("method"),
  pinHash: text("pin_hash"),
  pinFailedAttempts: integer("pin_failed_attempts").notNull().default(0),
  pinLockedUntil: timestamp("pin_locked_until", { withTimezone: true, mode: "date" }),
  totpSecretCiphertext: bytea("totp_secret_ciphertext"),
  totpConfirmedAt: timestamp("totp_confirmed_at", { withTimezone: true, mode: "date" }),
  encryptionKeyVersion: smallint("encryption_key_version").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const mfaRecoveryCodes = pgTable("mfa_recovery_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  codeHash: text("code_hash").notNull(),
  usedAt: timestamp("used_at", { withTimezone: true, mode: "date" }),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  mfaVerifiedAt: timestamp("mfa_verified_at", { withTimezone: true, mode: "date" }),
  revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const spaces = pgTable("spaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: spaceStatus("status").notNull().default("pending"),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  dissolvedAt: timestamp("dissolved_at", { withTimezone: true, mode: "date" }),
});

export const spaceMembers = pgTable("space_members", {
  spaceId: uuid("space_id").notNull(),
  userId: uuid("user_id").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  leftAt: timestamp("left_at", { withTimezone: true, mode: "date" }),
});

export const spaceInvites = pgTable("space_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  spaceId: uuid("space_id").notNull(),
  createdBy: uuid("created_by").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  acceptedBy: uuid("accepted_by"),
  acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }),
  revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const userCategoryPicks = pgTable("user_category_picks", {
  userId: uuid("user_id").notNull(),
  categoryId: uuid("category_id").notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.categoryId] })]);

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id").notNull(),
  kind: accountKind("kind").notNull(),
  nameCiphertext: bytea("name_ciphertext").notNull(),
  currencyCode: char("currency_code", { length: 3 }).notNull().default("EUR"),
  encryptionKeyVersion: smallint("encryption_key_version").notNull().default(1),
  archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const accountShares = pgTable("account_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").notNull(),
  spaceId: uuid("space_id").notNull(),
  sharedBy: uuid("shared_by").notNull(),
  canWrite: boolean("can_write").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id"),
  kind: text("kind").notNull(),
  key: text("key"),
  nameCiphertext: bytea("name_ciphertext"),
  requiresSpecificConcept: boolean("requires_specific_concept").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const movements = pgTable("movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").notNull(),
  actorUserId: uuid("actor_user_id").notNull(),
  kind: movementKind("kind").notNull(),
  direction: movementDirection("direction").notNull(),
  origin: movementOrigin("origin").notNull(),
  categoryId: uuid("category_id"),
  groupId: uuid("group_id"),
  counterpartyAccountId: uuid("counterparty_account_id"),
  conceptCiphertext: bytea("concept_ciphertext").notNull(),
  amountCiphertext: bytea("amount_ciphertext").notNull(),
  encryptionKeyVersion: smallint("encryption_key_version").notNull().default(1),
  occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const reminderSettings = pgTable("reminder_settings", {
  userId: uuid("user_id").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  localTime: time("local_time").notNull().default("19:30"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const reminderDispatches = pgTable("reminder_dispatches", {
  userId: uuid("user_id").notNull(),
  sentOn: date("sent_on").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    categoryId: uuid("category_id").notNull(),
    year: smallint("year").notNull(),
    month: smallint("month").notNull(),
    amountCiphertext: bytea("amount_ciphertext").notNull(),
    encryptionKeyVersion: smallint("encryption_key_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("budgets_period_unique").on(table.userId, table.categoryId, table.year, table.month)],
);

export const savingsGoals = pgTable("savings_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  accountId: uuid("account_id"),
  nameCiphertext: bytea("name_ciphertext").notNull(),
  targetCiphertext: bytea("target_ciphertext").notNull(),
  savedCiphertext: bytea("saved_ciphertext"),
  targetDate: date("target_date"),
  encryptionKeyVersion: smallint("encryption_key_version").notNull().default(1),
  archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});
