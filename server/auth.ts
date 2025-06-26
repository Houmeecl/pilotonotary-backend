import { Request, Response, NextFunction } from "express";
import { storage } from "./storage"; // Ajusta esta ruta si tu storage está en otro lugar

export function authorizeRoles(allowedRoles: string[]) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: "No user ID in session" });
      }

      const user = await storage.getUser(userId);

      if (!user || !user.isActive) {
        return res.status(403).json({ message: "Usuario inactivo o no encontrado" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Acceso denegado por rol" });
      }

      next();
    } catch (err) {
      console.error("Authorization error:", err);
      res.status(500).json({ message: "Error de autorización" });
    }
  };
}
