import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, insertPosLocationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Ruta básica para verificación
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Login básico para superadmin
  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@notarypro.cl" && password === "Admin123") {
      res.json({
        success: true,
        user: {
          id: "admin_test_001",
          email,
          role: "superadmin",
          firstName: "Admin",
          lastName: "Sistema",
        },
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  // Obtener todos los usuarios
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Crear documento (sin auth)
  app.post("/api/documents", async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse({
        ...req.body,
        submitterId: "demo_user", // valor fijo mientras no hay auth
      });
      const doc = await storage.createDocument(documentData);
      res.json(doc);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Obtener documentos de prueba
  app.get("/api/documents", async (_req, res) => {
    try {
      const docs = await storage.getAllDocuments?.() || [];
      res.json(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Crear ubicación POS
  app.post("/api/pos-locations", async (req, res) => {
    try {
      const data = insertPosLocationSchema.parse({
        ...req.body,
        ownerId: "demo_user",
      });
      const location = await storage.createPosLocation(data);
      res.json(location);
    } catch (error) {
      console.error("Error creating POS location:", error);
      res.status(400).json({ message: "Invalid location data" });
    }
  });

  // Consultar ubicaciones POS
  app.get("/api/pos-locations", async (_req, res) => {
    try {
      const locations = await storage.getPosLocationsByOwner("demo_user");
      res.json(locations);
    } catch (error) {
      console.error("Error fetching POS locations:", error);
      res.status(500).json({ message: "Failed to fetch POS locations" });
    }
  });

  const server = createServer(app);
  return server;
}

