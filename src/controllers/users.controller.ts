// src/controllers/users.controller.ts
import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

// Seleção padrão — apenas campos que existem no schema
const SELECT = {
  id:        true,
  name:      true,
  username:  true,
  email:     true,        // ← adicionado ao schema
  phone:     true,        // ← adicionado ao schema
  avatarUrl: true,        // ← adicionado ao schema
  isActive:  true,
  createdAt: true,
  role:      { select: { id: true, name: true } },
} as const

// ── GET /api/users ────────────────────────────────────────────
export async function getAll(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select:  SELECT,
    orderBy: { name: 'asc' },
  })
  res.json({ ok: true, data: users.map(u => ({ ...u, role: u.role.name })) })
}

// ── GET /api/users/:id ────────────────────────────────────────
export async function getOne(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where:  { id: req.params.id },
    select: SELECT,
  })
  if (!user) {
    res.status(404).json({ ok: false, error: 'Usuário não encontrado' })
    return
  }
  res.json({ ok: true, data: { ...user, role: user.role.name } })
}

// ── POST /api/users ───────────────────────────────────────────
// Apenas GERENTE pode criar usuários (garantido no router)
export async function create(req: Request, res: Response) {
  const { name, username, email, password, roleName, phone } = req.body as {
    name:      string
    username:  string
    email?:    string
    password:  string
    roleName:  string
    phone?:    string
  }

  if (!name || !username || !password || !roleName) {
    res.status(400).json({ ok: false, error: 'name, username, password e roleName são obrigatórios' })
    return
  }

  const role = await prisma.role.findUnique({ where: { name: roleName.toUpperCase() } })
  if (!role) {
    res.status(400).json({ ok: false, error: `Cargo "${roleName}" não existe` })
    return
  }

  const hash = await bcrypt.hash(password, 12)

  try {
    const user = await prisma.user.create({
      data: {
        name,
        username: username.toLowerCase().trim(),
        email:    email?.toLowerCase().trim(),
        phone,
        passwordHash: hash,
        roleId:   role.id,
      },
      select: SELECT,
    })
    res.status(201).json({ ok: true, data: { ...user, role: user.role.name } })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err.code === 'P2002') {
      res.status(409).json({ ok: false, error: 'Username ou email já existe' })
      return
    }
    throw e
  }
}

// ── PATCH /api/users/:id ──────────────────────────────────────
export async function update(req: Request, res: Response) {
  const { name, email, phone, avatarUrl, isActive } = req.body as {
    name?:      string
    email?:     string
    phone?:     string
    avatarUrl?: string
    isActive?:  boolean
  }

  const user = await prisma.user.update({
    where:  { id: req.params.id },
    data:   { name, email, phone, avatarUrl, isActive },
    select: SELECT,
  })
  res.json({ ok: true, data: { ...user, role: user.role.name } })
}

// ── PATCH /api/users/:id/role ─────────────────────────────────
// Troca o cargo do usuário (só GERENTE pode)
export async function changeRole(req: Request, res: Response) {
  const { roleName } = req.body as { roleName?: string }

  if (!roleName) {
    res.status(400).json({ ok: false, error: 'roleName é obrigatório' })
    return
  }

  const role = await prisma.role.findUnique({ where: { name: roleName.toUpperCase() } })
  if (!role) {
    res.status(400).json({ ok: false, error: `Cargo "${roleName}" não existe` })
    return
  }

  const user = await prisma.user.update({
    where:  { id: req.params.id },
    data:   { roleId: role.id },
    select: SELECT,
  })

  res.json({
    ok:      true,
    data:    { ...user, role: user.role.name },
    message: `Cargo alterado para ${roleName}`,
  })
}

// ── DELETE /api/users/:id (soft delete) ───────────────────────
export async function remove(req: Request, res: Response) {
  await prisma.user.update({
    where: { id: req.params.id },
    data:  { isActive: false },
  })
  res.json({ ok: true })
}
