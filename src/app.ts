// src/app.ts
import express from 'express'
import cors    from 'cors'
import helmet  from 'helmet'
import morgan  from 'morgan'
import { router } from './routes/index'  // ← removido .ts

export const app = express()

// ── Segurança ─────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin:      process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))

// ── Parsers ───────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Logs ──────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// ── Healthcheck ───────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ ok: true, service: 'KidPark API', ts: new Date() })
)

// ── API routes ────────────────────────────────────────────────
app.use('/api', router)

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ ok: false, error: 'Rota não encontrada' })
)

// ── Error handler global ──────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌', err.message)
  res.status(500).json({ ok: false, error: 'Erro interno do servidor' })
})
