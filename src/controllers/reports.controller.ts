// src/controllers/reports.controller.ts
// ARQUIVO: kidpark-api/src/controllers/reports.controller.ts
// Usa: s.paymentStatus, s.amountCents, s.userId, s.user, status: ENDED
// SEM: s.toy.slug, s.toy.emoji, s.registeredBy, s.payment{}, FINISHED

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const EMOJI: Record<string,string> = {
  'pula-pula':'🤸', piscina:'⚽', escorregador:'🛝', giratório:'🎡', balanço:'⚖️', outro:'🎠',
}

export async function daily(_req: Request, res: Response) {
  const start = new Date(); start.setHours(0,0,0,0)
  const end   = new Date(); end.setHours(23,59,59,999)

  const sessions = await prisma.childSession.findMany({
    where:   { createdAt: { gte: start, lte: end } },
    include: { toy: true, user: { select: { id: true, name: true } } },
  })

  // const totalArrecadado = sessions
  //   .filter(s => s.paymentStatus === 'PAID')
  //   .reduce((acc, s) => acc + s.amountCents, 0) / 100
  const totalArrecadado =
  sessions
    .filter((s) => s.paymentStatus === 'PAID')
    .reduce((acc: number, s) => acc + s.amountCents, 0) / 100

  const toyMap: Record<string,{ nome: string; emoji: string; total: number }> = {}
  for (const s of sessions) {
    const k = s.toyId
    if (!toyMap[k]) toyMap[k] = { nome: s.toy.name, emoji: EMOJI[s.toy.type?.toLowerCase()] ?? '🎠', total: 0 }
    toyMap[k].total++
  }

  const attMap: Record<string,{ nome: string; total: number }> = {}
  for (const s of sessions) {
    const k = s.userId
    if (!attMap[k]) attMap[k] = { nome: s.user.name, total: 0 }
    attMap[k].total++
  }

  // const porStatus = sessions.reduce<Record<string,number>>((acc,s) => {
  //   acc[s.status] = (acc[s.status] ?? 0) + 1; return acc
  // }, {})
  const porStatus = sessions.reduce(
  (acc: Record<string, number>, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1
    return acc
  },
  {} as Record<string, number>
)

  res.json({ ok: true, data: {
    totalTickets:      sessions.length,
    totalArrecadado,
    pendentePagamento: sessions.filter(s => s.paymentStatus === 'PENDING').length,
    brinquedos:        Object.values(toyMap).sort((a,b) => b.total - a.total),
    atendentes:        Object.values(attMap).sort((a,b) => b.total - a.total),
    porStatus,
    ultimaAtualizacao: new Date().toISOString(),
  }})
}

export async function monthly(req: Request, res: Response) {
  const year  = parseInt(req.query.year  as string) || new Date().getFullYear()
  const month = parseInt(req.query.month as string) || new Date().getMonth() + 1
  const start = new Date(year, month - 1, 1)
  const end   = new Date(year, month, 1)

  const sessions = await prisma.childSession.findMany({
    where:   { createdAt: { gte: start, lt: end }, status: 'ENDED' },
    include: { toy: true, user: { select: { id: true, name: true } } },
  })

  const dayMap: Record<string,{ tickets: number; arrecadado: number }> = {}
  for (const s of sessions) {
    const dia = s.createdAt.toISOString().slice(0,10)
    if (!dayMap[dia]) dayMap[dia] = { tickets: 0, arrecadado: 0 }
    dayMap[dia].tickets++
    if (s.paymentStatus === 'PAID') dayMap[dia].arrecadado += s.amountCents / 100
  }

  const toyMap: Record<string,{ nome: string; emoji: string; total: number }> = {}
  for (const s of sessions) {
    const k = s.toyId
    if (!toyMap[k]) toyMap[k] = { nome: s.toy.name, emoji: EMOJI[s.toy.type?.toLowerCase()] ?? '🎠', total: 0 }
    toyMap[k].total++
  }

  const attMap: Record<string,{ nome: string; total: number }> = {}
  for (const s of sessions) {
    const k = s.userId
    if (!attMap[k]) attMap[k] = { nome: s.user.name, total: 0 }
    attMap[k].total++
  }

  // const totalArrecadado = sessions
  //   .filter(s => s.paymentStatus === 'PAID')
  //   .reduce((acc,s) => acc + s.amountCents, 0) / 100
  const totalArrecadado =
  sessions
    .filter((s) => s.paymentStatus === 'PAID')
    .reduce((acc: number, s) => acc + s.amountCents, 0) / 100

  res.json({ ok: true, data: {
    periodo:         { inicio: start.toISOString().slice(0,10), fim: new Date(end.getTime()-1).toISOString().slice(0,10) },
    totalTickets:    sessions.length,
    totalArrecadado,
    brinquedos:      Object.values(toyMap).sort((a,b) => b.total - a.total),
    atendentes:      Object.values(attMap).sort((a,b) => b.total - a.total),
    porDia:          Object.entries(dayMap).map(([dia,v]) => ({ dia, ...v })).sort((a,b) => a.dia.localeCompare(b.dia)),
  }})
}