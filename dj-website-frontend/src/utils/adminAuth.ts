const KEY = 'adminToken'

export const getToken = () => localStorage.getItem(KEY)
export const setToken = (token: string) => localStorage.setItem(KEY, token)
export const clearToken = () => localStorage.removeItem(KEY)

export const authHeaders = (json = true): Record<string, string> => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  Authorization: `Bearer ${getToken()}`,
})
