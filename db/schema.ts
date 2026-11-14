import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const watches = sqliteTable("watches", {
  id: text("id").primaryKey().notNull(),
  episode: text("episode").notNull(),
  startedAt: integer("started_at").notNull(),
  progress: integer("progress").notNull(),
}, table => [index("watches_started_at_idx").on(table.startedAt)]);
