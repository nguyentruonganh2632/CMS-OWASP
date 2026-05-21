import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API } from '../utils'

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '' })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const r = await axios.post(`${API}/auth/register`, form)
      setSuccess(r.data.message || 'Đăng ký thành công!')
      setTimeout(() => navigate('/login'), 2000)
    } catch (e) {
      setError(e.response?.data?.error || 'Đã có lỗi xảy ra.')
    }
    setLoading(false)
  }

  return (
    <div className="page-wrapper animate-in" style={{ maxWidth: '480px', margin: '60px auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🐾</div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Tạo tài khoản</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13.5px' }}>Tham gia CatFood Shop ngay hôm nay!</p>
        </div>

        {/* Welcome bonus */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 'var(--r-sm)', padding: '12px 16px', marginBottom: '20px'
        }}>
          <span style={{ fontSize: '28px' }}>🎁</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px' }}>Ưu đãi thành viên mới</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)' }}>
              Nhận ngay <strong style={{ color: 'var(--accent2)' }}>100,000đ</strong> vào ví khi đăng ký!
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Họ và tên</label>
            <input name="full_name" className="form-input" placeholder="Nguyễn Văn A"
              value={form.full_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-input" placeholder="email@example.com"
              value={form.email} onChange={handleChange} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input name="password" type="password" className="form-input" placeholder="••••••••"
                value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input name="phone" className="form-input" placeholder="09xxxxxxxx"
                value={form.phone} onChange={handleChange} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <><span className="spinner"></span> Đang xử lý...</> : 'Tạo tài khoản'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13.5px', color: 'var(--text2)' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: 'var(--accent2)', fontWeight: '600' }}>Đăng nhập</Link>
        </div>
      </div>
    </div>
  )
}
