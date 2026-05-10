/**
 * Aplica el schema y los datos demo directamente a Turso.
 * Uso:
 *   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx tsx scripts/setup-turso.ts
 */
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("❌  Falta TURSO_DATABASE_URL");
  process.exit(1);
}

function cuid() {
  return "c" + Math.random().toString(36).slice(2, 13) +
    Math.random().toString(36).slice(2, 13);
}

async function main() {
  const db = createClient({ url: url!, authToken });

  // ── 1. Aplicar schema ──────────────────────────────────────────
  console.log("📦 Aplicando schema...");

  const sql = readFileSync(
    join(process.cwd(), "prisma/migrations/20260510025414_init/migration.sql"),
    "utf8"
  );

  const statements = sql
    .split(";")
    .map(s =>
      s
        .split("\n")
        .filter(line => !line.trimStart().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    try {
      await db.execute(stmt);
    } catch (e: unknown) {
      const msg = (e as Error).message ?? "";
      if (msg.includes("already exists") || msg.includes("duplicate")) continue;
      console.error(`⚠️  ${msg}\n   SQL: ${stmt.slice(0, 80)}`);
    }
  }
  console.log("✅ Schema aplicado");

  // ── 2. Insertar datos demo ─────────────────────────────────────
  console.log("\n🌱 Insertando datos demo...");

  const password = await bcrypt.hash("password123", 10);
  const now = new Date().toISOString();

  const walkers = [
    { name: "Andrés Morales",   email: "andres@guaugo.com",      bio: "Amante de los perros con 5 años de experiencia. Especialista en razas grandes y medianas.", exp: 5, rating: 4.9, walks: 142, lat: 4.6502, lng: -74.0553, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=andres&backgroundColor=b6e3f4" },
    { name: "Laura Quintero",   email: "laura@guaugo.com",       bio: "Veterinaria en formación. Primeros auxilios incluidos.",                                       exp: 3, rating: 5.0, walks: 89,  lat: 4.6254, lng: -74.0781, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=laura&backgroundColor=ffd5dc" },
    { name: "Carlos Herrera",   email: "carlos@guaugo.com",      bio: "Ex-entrenador canino. Manejo hasta 4 perros simultáneamente.",                                 exp: 7, rating: 4.8, walks: 220, lat: 4.5981, lng: -74.0762, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos&backgroundColor=c0aede" },
    { name: "Valentina Ríos",   email: "valentina@guaugo.com",   bio: "Estudiante de biología. Rutas seguras por Chapinero y Usaquén.",                               exp: 2, rating: 4.7, walks: 54,  lat: 4.6700, lng: -74.0528, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=valentina&backgroundColor=d1f5d3" },
    { name: "Sebastián Gómez",  email: "sebastian.w@guaugo.com", bio: "Paseador certificado por GuauGo. Zona norte de Bogotá.",                                       exp: 4, rating: 4.6, walks: 176, lat: 4.6850, lng: -74.0427, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sebs&backgroundColor=ffdfbf" },
  ];

  for (const w of walkers) {
    const existing = await db.execute({
      sql: "SELECT id FROM User WHERE email = ?",
      args: [w.email],
    });
    if (existing.rows.length > 0) {
      console.log(`  ⏭️  Ya existe: ${w.name}`);
      continue;
    }

    const userId = cuid();
    const profileId = cuid();

    await db.execute({
      sql: `INSERT INTO User (id, email, password, role, name, avatar, createdAt)
            VALUES (?, ?, ?, 'walker', ?, ?, ?)`,
      args: [userId, w.email, password, w.name, w.avatar, now],
    });

    await db.execute({
      sql: `INSERT INTO WalkerProfile (id, userId, bio, experience, rating, totalWalks, isAvailable, lat, lng)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [profileId, userId, w.bio, w.exp, w.rating, w.walks, w.lat, w.lng],
    });

    console.log(`  ✓ ${w.name}`);
  }

  // Cliente demo
  const clientEmail = "cliente@guaugo.com";
  const clientExisting = await db.execute({
    sql: "SELECT id FROM User WHERE email = ?",
    args: [clientEmail],
  });

  if (clientExisting.rows.length > 0) {
    console.log("  ⏭️  Ya existe: María García");
  } else {
    const clientId  = cuid();
    const profileId = cuid();
    const dog1Id    = cuid();
    const dog2Id    = cuid();

    await db.execute({
      sql: `INSERT INTO User (id, email, password, role, name, avatar, createdAt)
            VALUES (?, ?, ?, 'client', 'María García', ?, ?)`,
      args: [clientId, clientEmail, password,
        "https://api.dicebear.com/7.x/avataaars/svg?seed=maria&backgroundColor=ffd5dc", now],
    });

    await db.execute({
      sql: `INSERT INTO ClientProfile (id, userId, address) VALUES (?, ?, ?)`,
      args: [profileId, clientId, "Calle 93 #13-24, Bogotá"],
    });

    await db.execute({
      sql: `INSERT INTO Dog (id, name, breed, age, weight, notes, clientProfileId)
            VALUES (?, 'Luna', 'Golden Retriever', 3, 28, 'Muy amigable con otros perros', ?)`,
      args: [dog1Id, profileId],
    });

    await db.execute({
      sql: `INSERT INTO Dog (id, name, breed, age, weight, notes, clientProfileId)
            VALUES (?, 'Max', 'Bulldog Francés', 1, 10, 'Necesita descansos frecuentes', ?)`,
      args: [dog2Id, profileId],
    });

    console.log("  ✓ María García (+ Luna y Max)");
  }

  console.log("\n🎉 Base de datos lista en Turso!");
  console.log("   📧 cliente@guaugo.com  /  password123");
  console.log("   📧 andres@guaugo.com   /  password123");

  db.close();
}

main().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
