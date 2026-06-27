import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").notNull().default("user"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
});

export const cards = sqliteTable("cards", {
  id: text("id").primaryKey(),
  icon: text("icon").notNull().default("s-star"),
  categoryId: text("category_id").notNull(),
  status: text("status").notNull().default("live"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const cardTranslations = sqliteTable("card_translations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: text("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  lang: text("lang").notNull(),
  label: text("label").notNull(),
});

export const cardImages = sqliteTable("card_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: text("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  variant: text("variant").notNull(),
  r2Key: text("r2_key").notNull(),
  url: text("url").notNull(),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  isFree: integer("is_free").notNull().default(0),
  enabled: integer("enabled").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const schedules = sqliteTable("schedules", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("My Schedule"),
  scheduleType: text("schedule_type").notNull().default("daily"),
  language: text("language").notNull().default("en"),
  gender: text("gender").notNull().default("neutral"),
  gridCols: integer("grid_cols").default(3),
  customColNames: text("custom_col_names"),
  weekMode: text("week_mode").default("week"),
  cardStyle: text("card_style").default("white"),
  data: text("data").notNull().default("{}"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  categoryId: text("category_id"),
  gumroadLicenseKey: text("gumroad_license_key"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
