// Shared auth helpers
export const getToken = () => localStorage.getItem('cms_token')
export const getUser  = () => {
  try { return JSON.parse(localStorage.getItem('cms_user')) } catch { return null }
}
export const setAuth  = (token, user) => {
  localStorage.setItem('cms_token', token)
  localStorage.setItem('cms_user', JSON.stringify(user))
}
export const clearAuth = () => {
  localStorage.removeItem('cms_token')
  localStorage.removeItem('cms_user')
}

export const authHeader = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken() || ''}`
})

// Khi chạy local: set VITE_API_URL=http://localhost:5000/api trong .env
// Khi chạy Docker: Nginx proxy /api/ → backend, dùng đường dẫn tương đối
export const API = import.meta.env.VITE_API_URL || '/api'

export const fmt = (num) =>
  Number(num).toLocaleString('vi-VN') + ' VNĐ'
