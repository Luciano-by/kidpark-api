// api/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// ENTRYPOINT DA VERCEL
//
// A Vercel trata qualquer arquivo dentro de /api como Serverless Function.
// Exportamos o Express como default export — sem app.listen().
//
// O src/server.ts continua existindo para rodar localmente com npm run dev.
// ─────────────────────────────────────────────────────────────────────────────
import 'dotenv/config'
import { app } from '../src/app'

export default app
