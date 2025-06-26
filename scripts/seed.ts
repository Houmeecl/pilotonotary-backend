import { db } from "../server/db"; // Ajusta según tu configuración real
import { users, roles, userRoles } from "../server/db/schema";
import fs from "fs/promises";
import path from "path";

async function seedRoles() {
  const roleNames = ["superadmin", "notary", "client"];
  const insertedRoles = await Promise.all(roleNames.map(async (name) => {
    const [role] = await db.insert(roles).values({ name }).returning();
    return role;
  }));
  return Object.fromEntries(insertedRoles.map((r) => [r.name, r.id]));
}

async function seedUsers(roleMap: Record<string, string>) {
  const filePath = path.resolve("data", "users.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(raw);

  for (const u of data) {
    await db.insert(users).values({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      isActive: u.is_active,
    });

    const roleId = roleMap[u.role];
    if (roleId) {
      await db.insert(userRoles).values({
        userId: u.id,
        roleId,
      });
    }
  }

  console.log("Usuarios y roles insertados correctamente.");
}

async function main() {
  const roleMap = await seedRoles();
  await seedUsers(roleMap);
}

main().catch(console.error);
