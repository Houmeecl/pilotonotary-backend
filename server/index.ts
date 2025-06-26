import express from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { serveStatic } from "./serveStatic";

const app = express();
const server = createServer(app);
const isDev = process.env.NODE_ENV !== "production";

(async () => {
  if (isDev) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  await registerRoutes(app);
  server.listen(process.env.PORT || 3000, () => {
    console.log(`Server listening on port ${process.env.PORT || 3000}`);
  });
})();
