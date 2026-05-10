import path from "node:path";
import { defineConfig } from "prisma/config";

const isTurso = !!process.env.TURSO_DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: isTurso
    ? (() => {
        const { PrismaLibSql } = require("@prisma/adapter-libsql");
        return {
          adapter: new PrismaLibSql({
            url: process.env.TURSO_DATABASE_URL!,
            authToken: process.env.TURSO_AUTH_TOKEN,
          }),
        };
      })()
    : {
        url: `file:${path.join(process.cwd(), "prisma/dev.db")}`,
      },
});
