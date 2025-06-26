import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", [
  "superadmin",
  "certificador",
  "vecino",
  "usuario_final",
  "socios",
  "rrhh"
]);

// Document types enum
export const documentTypeEnum = pgEnum("document_type", [
  "declaracion_jurada",
  "finiquito_laboral",
  "contrato_simple"
]);

// Document status enum
export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "pending_verification",
  "pending_certification",
  "certified",
  "rejected",
  "cancelled"
]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("usuario_final"),
  isActive: boolean("is_active").default(true),
  rut: varchar("rut").unique(),
  phone: varchar("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// POS Locations table
export const posLocations = pgTable("pos_locations", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  address: text("address").notNull(),
  ownerId: varchar("owner_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("40.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  type: documentTypeEnum("type").notNull(),
  status: documentStatusEnum("status").default("draft"),
  title: varchar("title").notNull(),
  content: jsonb("content").notNull(),
  submitterId: varchar("submitter_id").references(() => users.id),
  certificadorId: varchar("certificador_id").references(() => users.id),
  posLocationId: integer("pos_location_id").references(() => posLocations.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isIdentityVerified: boolean("is_identity_verified").default(false),
  verificationData: jsonb("verification_data"),
  digitalSignature: text("digital_signature"),
  qrValidationCode: varchar("qr_validation_code").unique(),
  pdfPath: varchar("pdf_path"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  certifiedAt: timestamp("certified_at"),
});

// Commissions table
export const commissions = pgTable("commissions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id),
  vecinoId: varchar("vecino_id").references(() => users.id),
  certificadorId: varchar("certificador_id").references(() => users.id),
  vecinoAmount: decimal("vecino_amount", { precision: 10, scale: 2 }).notNull(),
  certificadorAmount: decimal("certificador_amount", { precision: 10, scale: 2 }).notNull(),
  adminAmount: decimal("admin_amount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean("is_paid").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // email, whatsapp, system
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  posLocations: many(posLocations),
  commissions: many(commissions),
  notifications: many(notifications),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  submitter: one(users, {
    fields: [documents.submitterId],
    references: [users.id],
  }),
  certificador: one(users, {
    fields: [documents.certificadorId],
    references: [users.id],
  }),
  posLocation: one(posLocations, {
    fields: [documents.posLocationId],
    references: [posLocations.id],
  }),
  commissions: many(commissions),
}));

export const posLocationsRelations = relations(posLocations, ({ one, many }) => ({
  owner: one(users, {
    fields: [posLocations.ownerId],
    references: [users.id],
  }),
  documents: many(documents),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  document: one(documents, {
    fields: [commissions.documentId],
    references: [documents.id],
  }),
  vecino: one(users, {
    fields: [commissions.vecinoId],
    references: [users.id],
  }),
  certificador: one(users, {
    fields: [commissions.certificadorId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  certifiedAt: true,
});

export const insertPosLocationSchema = createInsertSchema(posLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommissionSchema = createInsertSchema(commissions).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type PosLocation = typeof posLocations.$inferSelect;
export type InsertPosLocation = z.infer<typeof insertPosLocationSchema>;
export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
