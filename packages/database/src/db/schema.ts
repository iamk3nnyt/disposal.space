import {
  bigint,
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Users Table - Stores user information and storage usage
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: varchar("clerk_user_id", { length: 255 }).unique().notNull(),
  email: varchar("email", { length: 255 }),
  name: varchar("name", { length: 255 }),
  storageUsed: bigint("storage_used", { mode: "number" }).default(0).notNull(),
  storageLimit: bigint("storage_limit", { mode: "number" })
    .default(16106127360)
    .notNull(), // 15GB default
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Items Table - Stores files and folders with hierarchical structure
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  parentId: uuid("parent_id"), // Self-reference for hierarchy - will be set up after table definition
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'file' or 'folder'
  fileType: varchar("file_type", { length: 50 }), // 'PDF', 'TXT', etc. (null for folders)
  sizeBytes: bigint("size_bytes", { mode: "number" }).default(0).notNull(),
  mimeType: varchar("mime_type", { length: 255 }),
  filePath: varchar("file_path", { length: 500 }), // Storage path (null for folders)
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// Infer types from schema
export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SelectItem = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;

// Frontend-compatible types
export type User = {
  id: string;
  clerkUserId: string;
  email?: string | null;
  name?: string | null;
  storageUsed: number;
  storageLimit: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Item = {
  id: string;
  userId: string;
  parentId?: string | null;
  name: string;
  type: "file" | "folder";
  fileType?: string | null;
  sizeBytes: number;
  mimeType?: string | null;
  filePath?: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

// Frontend-compatible type for file/folder display
export type FileItem = {
  id: string;
  name: string;
  type: string; // file type or 'folder'
  size: string; // formatted size
  lastModified: string; // formatted date
  isFolder: boolean;
  sizeBytes: number;
  children?: FileItem[];
};

// Sidebar item type for navigation
export type SidebarItem = {
  id: string;
  name: string;
  type: string;
  isActive?: boolean;
  isExpanded?: boolean;
  children?: SidebarItem[];
};
