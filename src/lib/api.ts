// src/lib/api.ts

// ─── PONTO CRÍTICO ────────────────────────────────────────────────────────────
// Se VITE_API_URL não estiver configurada na Vercel, TODAS as chamadas vão
// para localhost:3333 (que não existe em produção) e o frontend quebra silenciosamente.
//
// Esta versão:
//  1. Lança erro claro se a variável estiver faltando em produção
//  2. Mantém localhost como fallback APENAS em desenvolvimento
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL

// Em produção, a variável DEVE estar definida
if (!API_URL && import.meta.env.PROD) {
  throw new Error(
    '[KidPark] VITE_API_URL não está definida!\n' +
    'Configure a variável de ambiente na Vercel:\n' +
    'Settings → Environment Variables → VITE_API_URL = https://kidpark-api.vercel.app/api'
  )
}

const BASE = API_URL ?? 'http://localhost:3333/api'

// Log em desenvolvimento para confirmar qual URL está sendo usada
if (import.meta.env.DEV) {
  console.info(`[KidPark] API URL: ${BASE}`)
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('kidpark_token')

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    })
  } catch (networkErr) {
    // Erro de rede — backend inacessível ou CORS bloqueando
    console.error('[KidPark] Erro de rede:', networkErr)
    throw new ApiError(
      0,
      'Não foi possível conectar ao servidor. Verifique se o backend está online.'
    )
  }

  // 204 No Content — sem body
  if (res.status === 204) return undefined as unknown as T

  const json = await res.json().catch(() => ({
    ok: false,
    error: `Resposta inválida do servidor (${res.status})`,
  }))

  if (!res.ok || json.ok === false) {
    // Token expirado — limpa sessão e redireciona
    if (res.status === 401) {
      localStorage.removeItem('kidpark_token')
      localStorage.removeItem('kidpark_user')
      window.location.href = '/login'
    }

    // CORS ou erro de servidor — log detalhado
    if (res.status === 0 || res.status >= 500) {
      console.error('[KidPark] Erro do servidor:', json)
    }

    throw new ApiError(res.status, json.error ?? `Erro ${res.status}`)
  }

  // Suporta respostas com { data: ... } e respostas diretas
  return (json.data !== undefined ? json.data : json) as T
}

export const api = {
  get:    <T>(p: string)               => request<T>(p),
  post:   <T>(p: string, b?: unknown)  => request<T>(p, { method: 'POST',   body: JSON.stringify(b ?? {}) }),
  patch:  <T>(p: string, b?: unknown)  => request<T>(p, { method: 'PATCH',  body: JSON.stringify(b ?? {}) }),
  delete: <T>(p: string)               => request<T>(p, { method: 'DELETE' }),
}
