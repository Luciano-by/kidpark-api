// kidpark-api/src/routes/index.ts
// SUBSTITUIR o arquivo inteiro.
// Adicionada rota: GET /toys/:id/slots

import { Router } from 'express'
import { authenticate }                   from '../middleware/authenticate'
import { requireRole, requirePermission } from '../middleware/rbac'

import { login, me, updateMe }            from '../controllers/auth.controller'
import { totemRegister, totemGetToys }    from '../controllers/totem.controller'
import {
  getAll as getToys,
  getOne as getToy,
  getSlots as getToySlots,
  create as createToy,
  update as updateToy,
  remove as removeToy,
} from '../controllers/toys.controller'
import {
  getActive, getAll, getOne, create, update,
  start, pause, addTime, tick, end, markPaid, remove,
} from '../controllers/children.controller'
import {
  getAll as getUsers, getOne as getUser,
  create as createUser, update as updateUser,
  changeRole, remove as removeUser,
} from '../controllers/users.controller'
import { daily, monthly } from '../controllers/reports.controller'

const router = Router()

// ── Auth ────────────────────────────────────────────────────────
router.post ('/auth/login', login)
router.get  ('/auth/me',    authenticate, me)
router.patch('/auth/me',    authenticate, updateMe)

// ── Totem — PÚBLICO ─────────────────────────────────────────────
router.get ('/totem/toys',     totemGetToys)
router.post('/totem/register', totemRegister)

// ── Brinquedos ─────────────────────────────────────────────────
// ATENÇÃO: /toys/:id/slots deve vir ANTES de /toys/:id
router.get   ('/toys',              authenticate, getToys)
router.get   ('/toys/:id/slots',    authenticate, getToySlots)
router.get   ('/toys/:id',          authenticate, getToy)
router.post  ('/toys',              authenticate, requirePermission('toys:create'), createToy)
router.patch ('/toys/:id',          authenticate, requirePermission('toys:update'), updateToy)
router.delete('/toys/:id',          authenticate, requirePermission('toys:delete'), removeToy)

// ── Crianças ────────────────────────────────────────────────────
router.get   ('/children/active',       authenticate, requirePermission('children:read'),   getActive)
router.get   ('/children',              authenticate, requirePermission('children:read'),   getAll)
router.get   ('/children/:id',          authenticate, requirePermission('children:read'),   getOne)
router.post  ('/children',              authenticate, requirePermission('children:create'), create)
router.patch ('/children/:id',          authenticate, requirePermission('children:update'), update)
router.patch ('/children/:id/start',    authenticate, requirePermission('children:update'), start)
router.patch ('/children/:id/pause',    authenticate, requirePermission('children:update'), pause)
router.patch ('/children/:id/add-time', authenticate, requirePermission('children:update'), addTime)
router.patch ('/children/:id/tick',     authenticate, requirePermission('children:update'), tick)
router.patch ('/children/:id/end',      authenticate, requirePermission('children:update'), end)
router.patch ('/children/:id/payment',  authenticate, requirePermission('children:update'), markPaid)
router.delete('/children/:id',          authenticate, requirePermission('children:delete'), remove)

// ── Usuários — só GERENTE ───────────────────────────────────────
router.get   ('/users',          authenticate, requireRole('GERENTE'), getUsers)
router.get   ('/users/:id',      authenticate, requireRole('GERENTE'), getUser)
router.post  ('/users',          authenticate, requireRole('GERENTE'), createUser)
router.patch ('/users/:id',      authenticate, requireRole('GERENTE'), updateUser)
router.patch ('/users/:id/role', authenticate, requireRole('GERENTE'), changeRole)
router.delete('/users/:id',      authenticate, requireRole('GERENTE'), removeUser)

// ── Relatórios — só GERENTE ─────────────────────────────────────
router.get('/reports/daily',   authenticate, requireRole('GERENTE'), daily)
router.get('/reports/monthly', authenticate, requireRole('GERENTE'), monthly)

export { router }