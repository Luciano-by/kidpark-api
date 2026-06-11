// kidpark-api/src/controllers/totem.controller.ts
//
// Rota PÚBLICA — sem autenticação.
// O totem cria a sessão usando um usuário-sistema reservado (TOTEM_USER_ID no .env).
// Após criar, a sessão aparece no Dashboard automaticamente com status SCHEDULED.

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export async function totemRegister(req: Request, res: Response) {
  const {
    childName,
    parentName,
    phone,
    toyId,
    scheduledTime,
    extraMinutes = 0,
  } = req.body

  // Validação básica
  if (!childName || !parentName || !phone || !toyId || !scheduledTime) {
    res.status(400).json({
      ok: false,
      error: 'childName, parentName, phone, toyId e scheduledTime são obrigatórios',
    })
    return
  }

  // O usuário-sistema do totem deve existir no banco (criado pelo seed)
  const totemUserId = process.env.TOTEM_USER_ID
  if (!totemUserId) {
    res.status(500).json({
      ok: false,
      error: 'TOTEM_USER_ID não configurado no servidor',
    })
    return
  }

  // Valida se o brinquedo existe e está ativo
  const toy = await prisma.toy.findUnique({ where: { id: toyId } })
  if (!toy || !toy.isActive) {
    res.status(404).json({ ok: false, error: 'Brinquedo não encontrado ou inativo' })
    return
  }

  // Calcula duração e valor
  const totalMin    = toy.defaultMinutes + Number(extraMinutes)
  const amountCents = Math.round((toy.pricePerSession / toy.defaultMinutes) * totalMin)

  // Cria a sessão — começa como SCHEDULED (atendente pode iniciar no Dashboard)
  const session = await prisma.childSession.create({
    data: {
      childName:       childName.trim(),
      parentName:      parentName.trim(),
      phone:           phone.trim(),
      toyId,
      userId:          totemUserId,
      scheduledTime:   String(scheduledTime),
      durationMinutes: totalMin,
      amountCents,
      status:          'SCHEDULED',
    },
    include: {
      toy:  true,
      user: { select: { id: true, name: true, username: true } },
    },
  })

  res.status(201).json({ ok: true, data: session })
}

// GET /totem/toys — lista brinquedos ativos para o totem (sem auth)
export async function totemGetToys(_req: Request, res: Response) {
  const toys = await prisma.toy.findMany({
    where:   { isActive: true },
    orderBy: { name: 'asc' },
  })
  res.json({ ok: true, data: toys })
}
