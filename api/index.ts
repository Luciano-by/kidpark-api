// api/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// ENTRYPOINT DA VERCEL — Serverless Function
//
// A Vercel trata qualquer arquivo dentro de /api como uma Serverless Function.
// Aqui exportamos o Express como default export para que a Vercel consiga
// executá-lo sem precisar do app.listen().
//
// IMPORTANTE:
//   - Este arquivo FICA em /api/index.ts (raiz do projeto, fora de /src)
//   - O src/server.ts continua existindo — é usado só para desenvolvimento local
//   - Não apague o src/server.ts, pois o npm run dev usa ele
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config'
import { app } from '../src/app'

// A Vercel precisa do export default com o handler Express
export default app
