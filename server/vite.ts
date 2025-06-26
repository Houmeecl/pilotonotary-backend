import express, { type Express } from "express";
import fs from "fs";
import path from "path";

// Simple logger
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// No usado en producción en Render, se deja como placeholder
export async function setupVite(_app: Express, _server: any) {
  console.warn("setupVite() no está activo – solo para modo desarrollo local.");
}

// Servir archivos estáticos precompilados (dist/public)
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `❌ No se encontró el directorio: ${distPath}. Asegúrate de compilar el frontend si es monolítico.`
    );
  }

  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

