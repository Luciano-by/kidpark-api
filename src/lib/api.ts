// // src/lib/api.ts
// // ARQUIVO: src/lib/api.ts
// // Corrigido: extrai json.data automaticamente para não precisar de .then(r => r.data) em todo lugar
// // Backend responde { ok: true, data: ... } → retornamos data direto

// const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api'

// export class ApiError extends Error {
//   constructor(public status: number, message: string) {
//     super(message)
//     this.name = 'ApiError'
//   }
// }

// async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
//   const token = localStorage.getItem('kidpark_token')

//   const res = await fetch(`${BASE}${path}`, {
//     ...options,
//     headers: {
//       'Content-Type': 'application/json',
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       ...(options.headers ?? {}),
//     },
//   })

//   if (res.status === 204) return undefined as unknown as T

//   const json = await res.json().catch(() => ({ ok: false, error: 'Resposta inválida' }))

//   if (!res.ok || json.ok === false) {
//     if (res.status === 401) {
//       localStorage.removeItem('kidpark_token')
//       localStorage.removeItem('kidpark_user')
//       window.location.href = '/login'
//     }
//     throw new ApiError(res.status, json.error ?? `Erro ${res.status}`)
//   }

//   // Extrai json.data automaticamente — todos os serviços recebem o dado direto
//   return (json.data !== undefined ? json.data : json) as T
// }

// export const api = {
//   get:    <T>(path: string)                  => request<T>(path, { method: 'GET' }),
//   post:   <T>(path: string, body?: unknown)  => request<T>(path, { method: 'POST',   body: JSON.stringify(body ?? {}) }),
//   patch:  <T>(path: string, body?: unknown)  => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body ?? {}) }),
//   delete: <T>(path: string)                  => request<T>(path, { method: 'DELETE' }),
// }
