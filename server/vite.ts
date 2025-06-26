import express, { type Express } from "express";
import fs from "fs";
import path, { dirname, resolve } from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { fileURLToPath } from "url";
import { type Server } from "http";
import { nanoid } from "nanoid";

const __dirname = dirname(fileURLToPath(import.meta.url));
const viteLogger = createLogger();

export async function setupVite(app: Express, server: Server) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("setupVite debe ejecutarse solo en desarrollo");
  }

  const vite = await createViteServer({
    configFile: resolve(__dirname, "..", "vite.config.ts"),
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true,
    },
    appType: "custom",
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const templatePath = resolve(__dirname, "..", "client", "index.html");
      let template = await fs.promises.readFile(templatePath, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

