// kidpark-api/src/controllers/toys.controller.ts
// SUBSTITUIR o arquivo inteiro.
// Adicionado: GET /toys/:id/slots — retorna horários com ocupação real vs capacidade máxima

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

// ── GET /api/toys ─────────────────────────────────────────────
// Retorna todos os brinquedos ativos (atendente) ou todos (gerente)
export async function getAll(req: Request, res: Response) {
  const isGerente = req.user?.role === 'GERENTE'
  const toys = await prisma.toy.findMany({
    where:   isGerente ? {} : { isActive: true },
    orderBy: { name: 'asc' },
  })
  res.json({ ok: true, data: toys })
}

// ── GET /api/toys/:id ─────────────────────────────────────────
export async function getOne(req: Request, res: Response) {
  const toy = await prisma.toy.findUnique({ where: { id: req.params.id } })
  if (!toy) {
    res.status(404).json({ ok: false, error: 'Brinquedo não encontrado' })
    return
  }
  res.json({ ok: true, data: toy })
}

// ── GET /api/toys/:id/slots?date=YYYY-MM-DD ───────────────────
// Retorna os horários do dia com quantos já estão ocupados.
// Um horário fica INDISPONÍVEL quando sessões agendadas/ativas
// naquele slot atingem a capacidade máxima do brinquedo.
export async function getSlots(req: Request, res: Response) {
  const toy = await prisma.toy.findUnique({ where: { id: req.params.id } })
  if (!toy || !toy.isActive) {
    res.status(404).json({ ok: false, error: 'Brinquedo não encontrado' })
    return
  }

  // Gera slots de 10:00 a 19:45 em intervalos de 15 min
  const allSlots: string[] = []
  for (let h = 10; h < 20; h++) {
    for (const m of [0, 15, 30, 45]) {
      allSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }

  // Conta sessões ativas/agendadas por horário para este brinquedo hoje
  const targetDate = (req.query.date as string) ?? new Date().toISOString().split('T')[0]
  const sessions = await prisma.childSession.findMany({
    where: {
      toyId:  toy.id,
      status: { in: ['SCHEDULED', 'ACTIVE', 'PAUSED'] },
      scheduledTime: { not: null },
      // Filtra pelo dia — scheduledTime é string "HH:MM", então buscamos por data de criação
      createdAt: {
        gte: new Date(`${targetDate}T00:00:00.000Z`),
        lte: new Date(`${targetDate}T23:59:59.999Z`),
      },
    },
    select: { scheduledTime: true },
  })

  // Conta ocupação por slot
  const occupancy: Record<string, number> = {}
  for (const s of sessions) {
    if (s.scheduledTime) {
      occupancy[s.scheduledTime] = (occupancy[s.scheduledTime] ?? 0) + 1
    }
  }

  const result = allSlots.map(slot => ({
    time:        slot,
    ocupado:     occupancy[slot] ?? 0,
    capacidade:  toy.maxCapacity,
    disponivel:  (occupancy[slot] ?? 0) < toy.maxCapacity,
  }))

  res.json({ ok: true, data: result })
}

// ── POST /api/toys ────────────────────────────────────────────
export async function create(req: Request, res: Response) {
  const {
    name,
    slug,
    emoji           = '🎠',
    type            = 'outro',
    maxCapacity     = 1,
    defaultMinutes  = 15,
    pricePerSession = 16,
  } = req.body as {
    name:             string
    slug?:            string
    emoji?:           string
    type?:            string
    maxCapacity?:     number
    defaultMinutes?:  number
    pricePerSession?: number
  }

  if (!name) {
    res.status(400).json({ ok: false, error: 'name é obrigatório' })
    return
  }

  // Gera slug automaticamente se não fornecido
  const finalSlug = slug ?? name.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  try {
    const toy = await prisma.toy.create({
      data: { name, slug: finalSlug, emoji, type, maxCapacity, defaultMinutes, pricePerSession },
    })
    res.status(201).json({ ok: true, data: toy })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err.code === 'P2002') {
      res.status(409).json({ ok: false, error: `Já existe um brinquedo com esse slug` })
      return
    }
    throw e
  }
}

// ── PATCH /api/toys/:id ───────────────────────────────────────
export async function update(req: Request, res: Response) {
  const allowed = ['name', 'slug', 'emoji', 'type', 'maxCapacity', 'defaultMinutes', 'pricePerSession', 'isActive']
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key]
  }

  try {
    const toy = await prisma.toy.update({ where: { id: req.params.id }, data })
    res.json({ ok: true, data: toy })
  } catch {
    res.status(404).json({ ok: false, error: 'Brinquedo não encontrado' })
  }
}

// ── DELETE /api/toys/:id (soft delete) ────────────────────────
export async function remove(req: Request, res: Response) {
  try {
    await prisma.toy.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ ok: true })
  } catch {
    res.status(404).json({ ok: false, error: 'Brinquedo não encontrado' })
  }
}