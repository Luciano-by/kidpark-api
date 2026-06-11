// src/server.ts
import 'dotenv/config'
import { app }    from './app'        // ← removido .ts
import { prisma } from './lib/prisma' // ← removido .ts

const PORT = Number(process.env.PORT ?? 3333)

async function main() {
  try {
    await prisma.$connect()
    console.log('✅ Conectado ao NeonDB (PostgreSQL)')
  } catch (err) {
    console.error('❌ Falha ao conectar ao banco:', err)
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 KidPark API — Rodando em http://localhost:${PORT}`)
    console.log(`   Ambiente: ${process.env.NODE_ENV ?? 'development'}`)
    console.log(`   Banco:    NeonDB (online)\n`)
  })
}

main()
