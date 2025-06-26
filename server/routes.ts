import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDocumentSchema, insertPosLocationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin user management routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { email, password, firstName, lastName, role, rut, phone } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Create user with credentials
      const newUser = await storage.createUserWithCredentials({
        email,
        password,
        firstName,
        lastName,
        role,
        rut,
        phone,
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post('/api/admin/users/:userId/toggle', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userId } = req.params;
      const { isActive } = req.body;

      const updatedUser = await storage.updateUserStatus(userId, isActive);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // User stats for admin dashboard
  app.get('/api/admin/user-stats', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Simple admin login endpoint for demo
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Simple validation for demo purposes
      if (email === 'admin@notarypro.cl' && password === 'Admin123') {
        // In production, you'd create a proper session here
        res.json({ 
          success: true, 
          user: { 
            id: 'admin_test_001', 
            email: 'admin@notarypro.cl', 
            role: 'superadmin',
            firstName: 'Admin',
            lastName: 'Sistema'
          } 
        });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Error in admin login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Document routes
  app.post('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documentData = insertDocumentSchema.parse({
        ...req.body,
        submitterId: userId,
      });
      
      const document = await storage.createDocument(documentData);
      
      // Create notification for certificador if assigned
      if (document.certificadorId) {
        await storage.createNotification({
          userId: document.certificadorId,
          title: "Nuevo documento para certificar",
          message: `Nuevo documento ${document.type} pendiente de certificación`,
          type: "system",
        });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(400).json({ message: "Failed to create document" });
    }
  });

  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let documents;
      if (user?.role === "certificador") {
        documents = await storage.getDocumentsByCertificador(userId);
      } else {
        documents = await storage.getDocumentsByUser(userId);
      }
      
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get('/api/documents/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "certificador") {
        return res.status(403).json({ message: "Only certificadors can access pending documents" });
      }
      
      const documents = await storage.getDocumentsByStatus("pending_certification");
      res.json(documents);
    } catch (error) {
      console.error("Error fetching pending documents:", error);
      res.status(500).json({ message: "Failed to fetch pending documents" });
    }
  });

  app.patch('/api/documents/:id/certify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documentId = parseInt(req.params.id);
      const { action, rejectionReason, digitalSignature } = req.body;
      
      const user = await storage.getUser(userId);
      if (user?.role !== "certificador") {
        return res.status(403).json({ message: "Only certificadors can certify documents" });
      }
      
      const updateData: any = {
        certificadorId: userId,
      };
      
      let status = "certified";
      if (action === "reject") {
        status = "rejected";
        updateData.rejectionReason = rejectionReason;
      } else {
        updateData.digitalSignature = digitalSignature || `CERT_${Date.now()}_${userId}`;
      }
      
      const document = await storage.updateDocumentStatus(documentId, status, updateData);
      
      // Calculate and create commission if certified
      if (status === "certified") {
        const totalAmount = parseFloat(document.price);
        const vecinoAmount = totalAmount * 0.4;
        const certificadorAmount = totalAmount * 0.35;
        const adminAmount = totalAmount * 0.25;
        
        await storage.createCommission({
          documentId: document.id,
          vecinoId: document.posLocationId ? (await storage.getPosLocationsByOwner(document.submitterId!))[0]?.ownerId : document.submitterId,
          certificadorId: userId,
          vecinoAmount: vecinoAmount.toString(),
          certificadorAmount: certificadorAmount.toString(),
          adminAmount: adminAmount.toString(),
          totalAmount: totalAmount.toString(),
        });
      }
      
      // Create notification for submitter
      await storage.createNotification({
        userId: document.submitterId!,
        title: status === "certified" ? "Documento certificado" : "Documento rechazado",
        message: status === "certified" 
          ? `Su documento ${document.type} ha sido certificado exitosamente`
          : `Su documento ${document.type} ha sido rechazado: ${rejectionReason}`,
        type: "system",
      });
      
      res.json(document);
    } catch (error) {
      console.error("Error certifying document:", error);
      res.status(500).json({ message: "Failed to certify document" });
    }
  });

  // POS Location routes
  app.post('/api/pos-locations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const locationData = insertPosLocationSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      
      const location = await storage.createPosLocation(locationData);
      res.json(location);
    } catch (error) {
      console.error("Error creating POS location:", error);
      res.status(400).json({ message: "Failed to create POS location" });
    }
  });

  app.get('/api/pos-locations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const locations = await storage.getPosLocationsByOwner(userId);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching POS locations:", error);
      res.status(500).json({ message: "Failed to fetch POS locations" });
    }
  });

  // Commission routes
  app.get('/api/commissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commissions = await storage.getCommissionsByUser(userId);
      res.json(commissions);
    } catch (error) {
      console.error("Error fetching commissions:", error);
      res.status(500).json({ message: "Failed to fetch commissions" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Analytics routes (superadmin only)
  app.get('/api/analytics/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "superadmin") {
        return res.status(403).json({ message: "Only superadmin can access analytics" });
      }
      
      const stats = await storage.getDocumentStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching document analytics:", error);
      res.status(500).json({ message: "Failed to fetch document analytics" });
    }
  });

  app.get('/api/analytics/commissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "superadmin") {
        return res.status(403).json({ message: "Only superadmin can access analytics" });
      }
      
      const stats = await storage.getCommissionStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching commission analytics:", error);
      res.status(500).json({ message: "Failed to fetch commission analytics" });
    }
  });

  // Identity verification simulation
  app.post('/api/verify-identity', isAuthenticated, async (req: any, res) => {
    try {
      const { documentId, verificationData } = req.body;
      
      // Simulate identity verification process
      const isVerified = Math.random() > 0.1; // 90% success rate for demo
      
      if (isVerified) {
        await storage.updateDocumentStatus(documentId, "pending_certification", {
          isIdentityVerified: true,
          verificationData: verificationData,
        });
        res.json({ success: true, message: "Identity verified successfully" });
      } else {
        res.status(400).json({ success: false, message: "Identity verification failed" });
      }
    } catch (error) {
      console.error("Error verifying identity:", error);
      res.status(500).json({ message: "Failed to verify identity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
