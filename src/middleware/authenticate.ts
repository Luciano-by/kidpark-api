// src/middleware/authenticate.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface JwtPayload {
  userId: string
  role:   string
  name:   string
}

declare global {
  namespace Express {
    interface Request { user?: JwtPayload }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: 'Token não fornecido' })
    return
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as JwtPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ ok: false, error: 'Token inválido ou expirado' })
  }
}
