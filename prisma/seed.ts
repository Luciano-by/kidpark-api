// kidpark-api/prisma/seed.ts
// SUBSTITUIR o arquivo inteiro por este.
// Adicionado usuário-sistema "totem" — usado como userId nas sessões criadas pelo totem.

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do KidPark...\n')

  // ── 1. Cargos ──────────────────────────────────────────────
  const roleGerente = await prisma.role.upsert({
    where:  { name: 'GERENTE' },
    update: {},
    create: { name: 'GERENTE', description: 'Acesso total ao sistema' },
  })
  const roleAtendente = await prisma.role.upsert({
    where:  { name: 'ATENDENTE' },
    update: {},
    create: { name: 'ATENDENTE', description: 'Atendimento e cadastro' },
  })
  console.log('✅ Cargos: GERENTE e ATENDENTE')

  // ── 2. Usuários ────────────────────────────────────────────
  const usuarios = [
    { username: 'luciano',   name: 'Luciano',        senha: '123',          roleId: roleGerente.id   },
    { username: 'gerente',   name: 'Carlos Gerente', senha: 'gerente123',   roleId: roleGerente.id   },
    { username: 'atendente', name: 'Ana Atendente',  senha: 'atendente123', roleId: roleAtendente.id },
  ]
  for (const u of usuarios) {
    const passwordHash = await bcrypt.hash(u.senha, 12)
    await prisma.user.upsert({
      where:  { username: u.username },
      update: { passwordHash, roleId: u.roleId },
      create: { username: u.username, name: u.name, passwordHash, roleId: u.roleId },
    })
  }
  console.log('✅ Usuários:')
  console.log('   👑 luciano    / 123')
  console.log('   👔 gerente    / gerente123')
  console.log('   🧑 atendente  / atendente123')

  // ── 3. Usuário-sistema do Totem ────────────────────────────
  // Este usuário não faz login — é usado como userId nas sessões criadas pelo totem.
  const totemUser = await prisma.user.upsert({
    where:  { username: 'totem' },
    update: {},
    create: {
      username:     'totem',
      name:         'Totem Auto-Atendimento',
      passwordHash: await bcrypt.hash('totem-nao-faz-login-' + Date.now(), 12),
      roleId:       roleAtendente.id,
      isActive:     false, // bloqueia login manual
    },
  })
  console.log('\n🤖 Usuário-sistema do Totem criado:')
  console.log(`   ID: ${totemUser.id}`)
  console.log('   ⚠️  Copie este ID e coloque no .env do backend:')
  console.log(`   TOTEM_USER_ID=${totemUser.id}\n`)

  // ── 4. Brinquedos ──────────────────────────────────────────
  const count = await prisma.toy.count()
  if (count === 0) {
    await prisma.toy.createMany({
      data: [
        { name: 'Cama Elástica',       type: 'pula-pula',    maxCapacity: 2, defaultMinutes: 15, pricePerSession: 1600 },
        { name: 'Piscina de Bolinhas', type: 'piscina',      maxCapacity: 4, defaultMinutes: 15, pricePerSession: 1600 },
        { name: 'Tobogã',              type: 'escorregador',  maxCapacity: 2, defaultMinutes: 15, pricePerSession: 1600 },
        { name: 'Gira-Gira',           type: 'giratório',    maxCapacity: 3, defaultMinutes: 15, pricePerSession: 1200 },
        { name: 'Gangorra',            type: 'balanço',      maxCapacity: 2, defaultMinutes: 15, pricePerSession: 1000 },
      ],
    })
    console.log('✅ Brinquedos criados')
  } else {
    console.log('⏭️  Brinquedos já existem — pulando')
  }

  console.log('\n🎉 Seed concluído!')
}

main()
  .catch(e => { console.error('❌ Erro no seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
