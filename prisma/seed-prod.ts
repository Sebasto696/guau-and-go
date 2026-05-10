/**
 * Run this ONCE after deploying to seed Turso with demo data:
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx prisma/seed-prod.ts
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("❌ TURSO_DATABASE_URL is required");
  process.exit(1);
}

const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

async function main() {
  const walkersData = [
    {
      name: "Andrés Morales",
      email: "andres@guaugo.com",
      bio: "Amante de los perros con 5 años de experiencia. Especialista en razas grandes y medianas.",
      experience: 5, rating: 4.9, totalWalks: 142,
      lat: 4.6502, lng: -74.0553,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=andres&backgroundColor=b6e3f4",
    },
    {
      name: "Laura Quintero",
      email: "laura@guaugo.com",
      bio: "Veterinaria en formación. Cuido a cada perro como si fuera el mío. Primeros auxilios.",
      experience: 3, rating: 5.0, totalWalks: 89,
      lat: 4.6254, lng: -74.0781,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=laura&backgroundColor=ffd5dc",
    },
    {
      name: "Carlos Herrera",
      email: "carlos@guaugo.com",
      bio: "Ex-entrenador canino. Manejo hasta 4 perros simultáneamente con total seguridad.",
      experience: 7, rating: 4.8, totalWalks: 220,
      lat: 4.5981, lng: -74.0762,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos&backgroundColor=c0aede",
    },
    {
      name: "Valentina Ríos",
      email: "valentina@guaugo.com",
      bio: "Estudiante de biología. Apasionada por los animales. Rutas seguras por Chapinero y Usaquén.",
      experience: 2, rating: 4.7, totalWalks: 54,
      lat: 4.6700, lng: -74.0528,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=valentina&backgroundColor=d1f5d3",
    },
    {
      name: "Sebastián Gómez",
      email: "sebastian.w@guaugo.com",
      bio: "Paseador certificado por GuauGo. Zona norte de Bogotá.",
      experience: 4, rating: 4.6, totalWalks: 176,
      lat: 4.6850, lng: -74.0427,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sebs&backgroundColor=ffdfbf",
    },
  ];

  const password = await bcrypt.hash("password123", 10);

  for (const w of walkersData) {
    await prisma.user.upsert({
      where: { email: w.email },
      update: {},
      create: {
        email: w.email, password, role: "walker",
        name: w.name, avatar: w.avatar,
        walkerProfile: {
          create: { bio: w.bio, experience: w.experience, rating: w.rating, totalWalks: w.totalWalks, lat: w.lat, lng: w.lng },
        },
      },
    });
    console.log(`✓ Walker: ${w.name}`);
  }

  await prisma.user.upsert({
    where: { email: "cliente@guaugo.com" },
    update: {},
    create: {
      email: "cliente@guaugo.com", password, role: "client",
      name: "María García",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria&backgroundColor=ffd5dc",
      clientProfile: {
        create: {
          address: "Calle 93 #13-24, Bogotá",
          dogs: {
            create: [
              { name: "Luna", breed: "Golden Retriever", age: 3, weight: 28, notes: "Muy amigable con otros perros" },
              { name: "Max", breed: "Bulldog Francés", age: 1, weight: 10, notes: "Necesita descansos frecuentes" },
            ],
          },
        },
      },
    },
  });

  console.log("✓ Cliente: María García");
  console.log("\n✅ Seed de producción completado");
  console.log("📧 cliente@guaugo.com / password123");
  console.log("📧 andres@guaugo.com  / password123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
