// src/controllers/auth.controller.ts
// Erro corrigido:
//  ts(2769) jwt.sign — 'expiresIn' não existe em SignOptions junto com callback
//  Solução: cast explícito para jwt.SignOptions sem callback (síncrono)

import { Request, Response } from 'express'
import bcrypt                from 'bcryptjs'
import jwt                   from 'jsonwebtoken'
import { prisma }            from '../lib/prisma'

const JWT_SECRET     = process.env.JWT_SECRET     ?? 'kidpark-dev-secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '8h'

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ ok: false, error: 'username e password são obrigatórios' })
    return
  }

  const user = await prisma.user.findUnique({
    where:   { username: String(username).toLowerCase().trim() },
    include: { role: true },
  })

  if (!user || !user.isActive) {
    res.status(401).json({ ok: false, error: 'Credenciais inválidas' })
    return
  }

  const passwordOk = await bcrypt.compare(String(password), user.passwordHash)
  if (!passwordOk) {
    res.status(401).json({ ok: false, error: 'Credenciais inválidas' })
    return
  }

  // Geração do token — sem callback (síncrono) para evitar ts(2769)
  const payload = { userId: user.id, role: user.role.name, name: user.name }
  const options: jwt.SignOptions = { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  const token = jwt.sign(payload, JWT_SECRET, options)

  res.json({
    ok:   true,
    data: {
      token,
      user: {
        id:        user.id,
        name:      user.name,
        username:  user.username,
        email:     user.email     ?? null,
        phone:     user.phone     ?? null,
        avatarUrl: user.avatarUrl ?? null,
        role:      user.role.name,
      },
    },
  })
}

// GET /api/auth/me
export async function me(req: Request, res: Response) {
  const userId = (req as Request & { userId?: string }).userId
  if (!userId) { res.status(401).json({ ok: false, error: 'Não autorizado' }); return }

  const user = await prisma.user.findUnique({
    where:   { id: userId },
    include: { role: true },
  })

  if (!user) { res.status(404).json({ ok: false, error: 'Usuário não encontrado' }); return }

  res.json({
    ok:   true,
    data: {
      id:        user.id,
      name:      user.name,
      username:  user.username,
      email:     user.email     ?? null,
      phone:     user.phone     ?? null,
      avatarUrl: user.avatarUrl ?? null,
      role:      user.role.name,
    },
  })
}

// PATCH /api/auth/me
export async function updateMe(req: Request, res: Response) {
  const userId = (req as Request & { userId?: string }).userId
  if (!userId) { res.status(401).json({ ok: false, error: 'Não autorizado' }); return }

  const { name, email, phone } = req.body
  const updated = await prisma.user.update({
    where: { id: userId },
    data:  { name, email, phone },
    include: { role: true },
  })

  res.json({
    ok:   true,
    data: {
      id:       updated.id,
      name:     updated.name,
      username: updated.username,
      email:    updated.email    ?? null,
      phone:    updated.phone    ?? null,
      role:     updated.role.name,
    },
  })
}
