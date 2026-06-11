// src/lib/permissions.ts
// Define o que cada cargo pode fazer no sistema

export const ROLES = {
  GERENTE:   'GERENTE',
  ATENDENTE: 'ATENDENTE',
} as const

export type RoleName = keyof typeof ROLES

// Mapa de permissões por cargo
export const PERMISSIONS: Record<RoleName, string[]> = {
  GERENTE: [
    'dashboard:view',
    'children:create',
    'children:read',
    'children:update',
    'children:delete',
    'toys:create',
    'toys:read',
    'toys:update',
    'toys:delete',
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'users:change-role',
    'reports:daily',
    'reports:monthly',
  ],
  ATENDENTE: [
    'dashboard:view',
    'children:create',
    'children:read',
    'children:update',
    'toys:read',
  ],
}

export function can(role: RoleName, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false
}
