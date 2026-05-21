import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API, setAuth } from '../utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const r = await axios.post(`${API}/auth/login`, { email, password })
      setAuth(r.data.token, r.data.user)
      window.dispatchEvent(new Event('auth-change'))
      navigate('/')
    } catch (e) {
      setError(e.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại.')
    }
    setLoading(false)
  }

  return (
    <div className="page-wrapper animate-in" style={{ maxWidth: '440px', margin: '60px auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🐱</div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Đăng nhập</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13.5px' }}>Chào mừng trở lại CatFood Shop!</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="login-email"
              className="form-input"
              type="text"
              placeholder="email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            id="login-submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? <><span className="spinner"></span> Đang xử lý...</> : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13.5px', color: 'var(--text2)' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: 'var(--accent2)', fontWeight: '600' }}>Đăng ký ngay</Link>
        </div>

      </div>
    </div>
  )
}
