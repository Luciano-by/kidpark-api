// src/middleware/rbac.ts
import { Request, Response, NextFunction } from 'express'
import { can, RoleName } from '../lib/permissions'  // ← removido .ts

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role as RoleName
    if (!role || !can(role, permission)) {
      res.status(403).json({ ok: false, error: 'Acesso negado para seu cargo' })
      return
    }
    next()
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ ok: false, error: 'Acesso restrito' })
      return
    }
    next()
  }
}
