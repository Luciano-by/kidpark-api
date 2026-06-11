// prisma/prisma.config.ts
// Configura conexão direta (sem pooler) para migrations no Neon
// Compatível com Prisma v6.x

import path from "node:path"
import { defineConfig } from "prisma/config"
import "dotenv/config"

export default defineConfig({
  schema: path.join(import.meta.dirname ?? __dirname, "schema.prisma"),
  migrate: {
    async adapter(env) {
      const { PrismaNeon } = await import("@prisma/adapter-neon")
      const { Pool }       = await import("@neondatabase/serverless")

      // Usa a URL direta (sem pooler) para que as migrations funcionem
      const connectionString =
        env.DATABASE_URL_UNPOOLED ??
        env.DATABASE_URL

      const pool = new Pool({ connectionString })
      return new PrismaNeon(pool)
    },
  },
})
