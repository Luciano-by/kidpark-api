// src/controllers/children.controller.ts
// ARQUIVO: kidpark-api/src/controllers/children.controller.ts
// Schema real: durationMinutes, paymentStatus, amountCents, ENDED, endedAt
// SEM: baseDurationSec, timeRemainingSec, payment{}, registeredById, WAITING/FINISHED

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const INC = {
  toy:            true,
  user:           { select: { id: true, name: true, username: true } },
  timeExtensions: true,
} as const

export async function getActive(_req: Request, res: Response) {
  const s = await prisma.childSession.findMany({
    where: { status: { in: ['SCHEDULED','ACTIVE','PAUSED'] } },
    include: INC, orderBy: { createdAt: 'asc' },
  })
  res.json({ ok: true, data: s })
}

export async function getAll(req: Request, res: Response) {
  const { status, date } = req.query as Record<string,string>
  const where: Record<string,unknown> = {}
  if (status) where.status = status
  if (date) {
    const d = new Date(date), next = new Date(d)
    next.setDate(next.getDate() + 1)
    where.createdAt = { gte: d, lt: next }
  }
  const s = await prisma.childSession.findMany({ where, include: INC, orderBy: { createdAt: 'desc' } })
  res.json({ ok: true, data: s })
}

export async function getOne(req: Request, res: Response) {
  const s = await prisma.childSession.findUnique({ where: { id: req.params.id }, include: INC })
  if (!s) { res.status(404).json({ ok: false, error: 'Sessao nao encontrada' }); return }
  res.json({ ok: true, data: s })
}

export async function create(req: Request, res: Response) {
  const { childName, parentName, phone, toyId, scheduledTime, extraMinutes = 0, notes } = req.body
  if (!childName || !parentName || !phone || !toyId || !scheduledTime) {
    res.status(400).json({ ok: false, error: 'childName, parentName, phone, toyId e scheduledTime sao obrigatorios' })
    return
  }
  const toy = await prisma.toy.findUnique({ where: { id: toyId } })
  if (!toy || !toy.isActive) { res.status(404).json({ ok: false, error: 'Brinquedo nao encontrado' }); return }

  const totalMin    = toy.defaultMinutes + Number(extraMinutes)
  const amountCents = Math.round((toy.pricePerSession / toy.defaultMinutes) * totalMin)

  const s = await prisma.childSession.create({
    data: {
      childName, parentName, phone, toyId,
      userId:          req.user!.userId,
      scheduledTime:   String(scheduledTime),
      durationMinutes: totalMin,
      amountCents,
      notes: notes || null,
    },
    include: INC,
  })
  res.status(201).json({ ok: true, data: s })
}

export async function update(req: Request, res: Response) {
  const { childName, parentName, phone, notes } = req.body
  const s = await prisma.childSession.update({ where: { id: req.params.id }, data: { childName, parentName, phone, notes }, include: INC })
  res.json({ ok: true, data: s })
}

export async function start(req: Request, res: Response) {
  const s = await prisma.childSession.update({ where: { id: req.params.id }, data: { status: 'ACTIVE', startedAt: new Date() }, include: INC })
  res.json({ ok: true, data: s })
}

export async function pause(req: Request, res: Response) {
  const cur = await prisma.childSession.findUnique({ where: { id: req.params.id } })
  if (!cur) { res.status(404).json({ ok: false, error: 'Sessao nao encontrada' }); return }
  const s = await prisma.childSession.update({
    where: { id: req.params.id },
    data: { status: cur.isPaused ? 'ACTIVE' : 'PAUSED', isPaused: !cur.isPaused, pausedAt: cur.isPaused ? null : new Date() },
    include: INC,
  })
  res.json({ ok: true, data: s })
}

export async function addTime(req: Request, res: Response) {
  const minutes = Number(req.body.minutes ?? (req.body.seconds ? Math.round(Number(req.body.seconds)/60) : 5))
  const cur = await prisma.childSession.findUnique({ where: { id: req.params.id }, include: { toy: true } })
  if (!cur) { res.status(404).json({ ok: false, error: 'Sessao nao encontrada' }); return }
  const extraCents = Math.round((cur.toy.pricePerSession / cur.toy.defaultMinutes) * minutes)
  const s = await prisma.childSession.update({
    where: { id: req.params.id },
    data: { durationMinutes: { increment: minutes }, amountCents: { increment: extraCents }, timeExtensions: { create: { minutes, amountCents: extraCents } } },
    include: INC,
  })
  res.json({ ok: true, data: s })
}

export async function tick(req: Request, res: Response) {
  const { timeRemainingSec } = req.body as { timeRemainingSec: number }
  if (typeof timeRemainingSec === 'number' && timeRemainingSec <= 0) {
    const s = await prisma.childSession.update({ where: { id: req.params.id }, data: { status: 'ENDED', endedAt: new Date() }, include: INC })
    res.json({ ok: true, data: s, autoEnded: true })
    return
  }
  res.json({ ok: true, data: { id: req.params.id, timeRemainingSec } })
}

export async function end(req: Request, res: Response) {
  const s = await prisma.childSession.update({ where: { id: req.params.id }, data: { status: 'ENDED', endedAt: new Date() }, include: INC })
  res.json({ ok: true, data: s })
}

export async function markPaid(req: Request, res: Response) {
  const s = await prisma.childSession.update({ where: { id: req.params.id }, data: { paymentStatus: 'PAID' }, include: INC })
  res.json({ ok: true, data: s })
}

export async function remove(req: Request, res: Response) {
  await prisma.childSession.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
}