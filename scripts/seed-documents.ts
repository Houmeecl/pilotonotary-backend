import { db } from "../server/db"; // Ajusta según tu configuración real
import { documents } from "../server/db/schema";
import fs from "fs/promises";
import path from "path";

async function seedDocuments() {
  const filePath = path.resolve("data", "documents.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(raw);

  const docData = data.map((d: any) => ({
    id: d.id,
    userId: d.user_id,
    title: d.title,
    type: d.type,
    status: d.status,
    createdAt: new Date(d.created_at),
  }));

  await db.insert(documents).values(docData);
  console.log("Documentos insertados correctamente.");
}

seedDocuments().catch(console.error);
