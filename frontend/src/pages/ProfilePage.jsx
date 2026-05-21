import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API, getToken, getUser, fmt } from '../utils'

export default function ProfilePage() {
  const user = getUser()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address: '',
  })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [targetUID, setTargetUID] = useState(user?.id || '')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadMyOrders()
  }, [])

  const loadMyOrders = async () => {
    setOrdersLoading(true)
    try {
      const r = await axios.get(`${API}/orders`, {
        params: { user_id: targetUID || user?.id },
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      setOrders(r.data.orders || [])
    } catch { setOrders([]) }
    setOrdersLoading(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      const r = await axios.put(`${API}/profile`, form, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      setMsg('success:' + r.data.message)
    } catch (e) {
      setMsg('error:' + (e.response?.data?.error || 'Lỗi cập nhật'))
    }
    setLoading(false)
  }

  if (!user) return null

  const STATUS_LABELS = {
    'Cho xac nhan': 'Chờ xác nhận',
    'Da duyet': 'Đã duyệt',
    'Dang giao': 'Đang giao',
    'Da giao': 'Đã giao',
    'Hoan thanh': 'Hoàn thành',
    'Da huy': 'Đã hủy'
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Cho xac nhan': return 'badge-yellow'
      case 'Da duyet': return 'badge-blue'
      case 'Dang giao': return 'badge-yellow'
      case 'Da giao': return 'badge-green'
      case 'Hoan thanh': return 'badge-green'
      case 'Da huy': return 'badge-red'
      default: return 'badge-gray'
    }
  }

  return (
    <div className="page-wrapper animate-in">
      <h1 className="page-title">👤 Tài khoản của tôi</h1>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left: Profile + Balance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Balance card */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(79,70,229,0.05))',
            borderColor: 'rgba(99,102,241,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '40px' }}>💰</div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>SỐ DƯ VÍ</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent2)' }}>
                  {fmt(user.balance || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Account info */}
          <div className="card">
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Thông tin cá nhân</h2>

            {msg && (
              <div className={`alert ${msg.startsWith('success') ? 'alert-success' : 'alert-error'}`}>
                {msg.split(':').slice(1).join(':')}
              </div>
            )}

            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input className="form-input" value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={user.email} disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input className="form-input" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Địa chỉ</label>
                <input className="form-input" value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Địa chỉ giao hàng mặc định" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner"></span> Đang lưu...</> : '💾 Lưu thay đổi'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Orders */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700' }}>📦 Đơn hàng</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                className="form-input"
                style={{ width: '80px', padding: '6px 10px', fontSize: '13px' }}
                value={targetUID}
                onChange={e => setTargetUID(e.target.value)}
                min="1"
              />
              <button className="btn btn-primary btn-sm" onClick={loadMyOrders} disabled={ordersLoading}>
                {ordersLoading ? <span className="spinner"></span> : 'Tải'}
              </button>
            </div>
          </div>

          {ordersLoading ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <p>Chưa có đơn hàng nào</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {orders.map(o => (
                <div key={o.id} style={{
                  padding: '14px', background: 'var(--bg3)',
                  borderRadius: 'var(--r-sm)', border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '14px' }}>Đơn #{o.id}</strong>
                    <span className={`badge ${getStatusBadgeClass(o.order_status)}`}>
                      {STATUS_LABELS[o.order_status] || o.order_status}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.7' }}>
                    <div>👤 {o.receiver_name} — {o.receiver_phone}</div>
                    <div>📍 {o.receiver_address}</div>
                    <div style={{ fontWeight: '700', color: 'var(--accent2)', marginTop: '4px' }}>
                      💰 {fmt(o.total_amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
