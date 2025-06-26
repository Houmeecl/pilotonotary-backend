 Piloto Notary – Backend

Este es el backend de la aplicación Piloto Notary. Desarrollado en **Express.js**, usa **Drizzle ORM** para interactuar con PostgreSQL.

## 📦 Comandos

```bash
npm install         # Instalar dependencias
npm run dev         # Modo desarrollo con Vite + Express
npm run build       # Compilar para producción
npm run start       # Iniciar servidor (producción)
```

## 🌐 Despliegue en Render

Render usa `render.yaml`, que configura:

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`
- **Puerto:** `5000`

### ⚙️ Variables de entorno

Crea `.env`:

```
DATABASE_URL=postgresql://user:password@host:port/dbname
```

## 🧪 Importación de datos

```bash
npx drizzle-kit push
npx tsx scripts/seed.ts
npx tsx scripts/seed-documents.ts
npx tsx scripts/seed-sessions.ts
```

## 📂 Carpetas importantes

- `server/` – lógica Express + rutas
- `scripts/` – scripts de carga
- `data/` – archivos JSON
- `server/db/schema.ts` – modelo con Drizzle ORM
