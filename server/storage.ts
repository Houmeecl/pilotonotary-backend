import {
  users,
  documents,
  posLocations,
  commissions,
  notifications,
  type User,
  type UpsertUser,
  type Document,
  type InsertDocument,
  type PosLocation,
  type InsertPosLocation,
  type Commission,
  type InsertCommission,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Admin user management
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUserWithCredentials(userData: any): Promise<User>;
  updateUserStatus(userId: string, isActive: boolean): Promise<User>;
  getUserStats(): Promise<any>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByStatus(status: string): Promise<Document[]>;
  getDocumentsByUser(userId: string): Promise<Document[]>;
  getDocumentsByCertificador(certificadorId: string): Promise<Document[]>;
  updateDocumentStatus(id: number, status: string, updateData?: Partial<Document>): Promise<Document>;
  
  // POS Location operations
  createPosLocation(location: InsertPosLocation): Promise<PosLocation>;
  getPosLocationsByOwner(ownerId: string): Promise<PosLocation[]>;
  updatePosLocationStatus(id: number, isActive: boolean): Promise<PosLocation>;
  
  // Commission operations
  createCommission(commission: InsertCommission): Promise<Commission>;
  getCommissionsByUser(userId: string): Promise<Commission[]>;
  getUnpaidCommissions(): Promise<Commission[]>;
  markCommissionAsPaid(id: number): Promise<Commission>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification>;
  
  // Analytics
  getDocumentStats(): Promise<any>;
  getCommissionStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Document operations
  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values({
        ...documentData,
        qrValidationCode: `QR${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      })
      .returning();
    return document;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocumentsByStatus(status: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.status, status as any)).orderBy(desc(documents.createdAt));
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.submitterId, userId)).orderBy(desc(documents.createdAt));
  }

  async getDocumentsByCertificador(certificadorId: string): Promise<Document[]> {
    return db.select().from(documents)
      .where(
        and(
          eq(documents.certificadorId, certificadorId),
          or(
            eq(documents.status, "pending_certification"),
            eq(documents.status, "certified"),
            eq(documents.status, "rejected")
          )
        )
      )
      .orderBy(desc(documents.createdAt));
  }

  async updateDocumentStatus(id: number, status: string, updateData?: Partial<Document>): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set({
        status: status as any,
        updatedAt: new Date(),
        ...(status === "certified" && { certifiedAt: new Date() }),
        ...updateData,
      })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  // POS Location operations
  async createPosLocation(locationData: InsertPosLocation): Promise<PosLocation> {
    const [location] = await db
      .insert(posLocations)
      .values(locationData)
      .returning();
    return location;
  }

  async getPosLocationsByOwner(ownerId: string): Promise<PosLocation[]> {
    return db.select().from(posLocations).where(eq(posLocations.ownerId, ownerId));
  }

  async updatePosLocationStatus(id: number, isActive: boolean): Promise<PosLocation> {
    const [location] = await db
      .update(posLocations)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(posLocations.id, id))
      .returning();
    return location;
  }

  // Commission operations
  async createCommission(commissionData: InsertCommission): Promise<Commission> {
    const [commission] = await db
      .insert(commissions)
      .values(commissionData)
      .returning();
    return commission;
  }

  async getCommissionsByUser(userId: string): Promise<Commission[]> {
    return db.select().from(commissions)
      .where(
        or(
          eq(commissions.vecinoId, userId),
          eq(commissions.certificadorId, userId)
        )
      )
      .orderBy(desc(commissions.createdAt));
  }

  async getUnpaidCommissions(): Promise<Commission[]> {
    return db.select().from(commissions).where(eq(commissions.isPaid, false));
  }

  async markCommissionAsPaid(id: number): Promise<Commission> {
    const [commission] = await db
      .update(commissions)
      .set({ isPaid: true })
      .where(eq(commissions.id, id))
      .returning();
    return commission;
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  // Analytics
  async getDocumentStats(): Promise<any> {
    const totalDocuments = await db.select({ count: sql<number>`count(*)` }).from(documents);
    const certifiedDocuments = await db.select({ count: sql<number>`count(*)` }).from(documents).where(eq(documents.status, "certified"));
    const pendingDocuments = await db.select({ count: sql<number>`count(*)` }).from(documents).where(eq(documents.status, "pending_certification"));
    
    return {
      total: totalDocuments[0]?.count || 0,
      certified: certifiedDocuments[0]?.count || 0,
      pending: pendingDocuments[0]?.count || 0,
    };
  }

  async getCommissionStats(): Promise<any> {
    const totalCommissions = await db.select({ 
      total: sql<number>`sum(total_amount)`,
      count: sql<number>`count(*)`
    }).from(commissions);
    
    const paidCommissions = await db.select({ 
      total: sql<number>`sum(total_amount)`,
      count: sql<number>`count(*)`
    }).from(commissions).where(eq(commissions.isPaid, true));
    
    return {
      totalAmount: totalCommissions[0]?.total || 0,
      totalCount: totalCommissions[0]?.count || 0,
      paidAmount: paidCommissions[0]?.total || 0,
      paidCount: paidCommissions[0]?.count || 0,
    };
  }

  // Admin user management methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUserWithCredentials(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    rut?: string;
    phone?: string;
  }): Promise<User> {
    // Generate unique ID for manual user creation
    const userId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role as any,
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return user;
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  async getUserStats(): Promise<any> {
    const [totalUsers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const roleStats = await db
      .select({
        role: users.role,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .groupBy(users.role);

    const stats: any = {
      totalUsers: totalUsers.count,
    };

    // Convert role stats to object
    roleStats.forEach(stat => {
      const roleName = stat.role?.replace('_', '') || 'unknown';
      stats[`${roleName}s`] = stat.count;
    });

    return stats;
  }
}

export const storage = new DatabaseStorage();
