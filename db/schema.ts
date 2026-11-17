import { boolean, date, integer, primaryKey, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  credits: integer("credits").default(3),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  projectId: varchar("projectId").notNull().unique(),
  projectName: varchar("projectName").notNull(),
  userEmail: varchar("userEmail").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  archived: boolean("archived").default(false),
});

export const whiteboardData = pgTable("whiteboardData", {
  id: serial("id").primaryKey(),
  projectId: varchar("projectId").references(() => projects.projectId).notNull().unique(),
  elements: jsonb("elements"),
  appState: jsonb("appState"),
  files: jsonb("files"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const aiDailyUsage = pgTable('ai_daily_usage', {
  userId: text('user_id').notNull(),
  day: date('day').notNull(),
  requests: integer('requests').notNull().default(0),
}, table => [primaryKey({ columns: [table.userId, table.day] })]);
