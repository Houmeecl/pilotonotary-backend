import { db } from "../server/db"; // Ajusta según tu configuración real
import { sessions } from "../server/db/schema";
import fs from "fs/promises";
import path from "path";

async function seedSessions() {
  const filePath = path.resolve("data", "sessions.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(raw);

  const sessionData = data.map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    createdAt: new Date(s.created_at),
    expiresAt: new Date(s.expires_at),
  }));

  await db.insert(sessions).values(sessionData);
  console.log("Sesiones insertadas correctamente.");
}

seedSessions().catch(console.error);
