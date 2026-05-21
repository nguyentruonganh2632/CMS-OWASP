import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API, fmt, getToken, getUser } from '../utils'

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const user = getUser()
  const navigate = useNavigate()

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

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      setOrders(r.data.orders || [])
    } catch (e) {
      setError('Lỗi khi tải danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-wrapper"><div className="spinner"></div></div>
    )
  }

  return (
    <div className="page-wrapper animate-in" style={{ maxWidth: '900px' }}>
      <div className="section-header">
        <div>
          <h1 className="page-title">📦 Đơn hàng của tôi</h1>
          <p style={{ color: 'var(--text3)', fontSize: '13.5px', marginTop: '4px' }}>
            Theo dõi tình trạng vận chuyển và hóa đơn các đơn hàng bạn đã mua.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchOrders}>
          🔄 Tải lại
        </button>
      </div>

      {error && <div className="alert alert-error mb-6">{error}</div>}

      {orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🛍️</div>
          <h3>Chưa có đơn hàng nào</h3>
          <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>Hãy chọn sản phẩm ngon tuyệt và đặt hàng nhé!</p>
          <Link to="/" className="btn btn-primary">Mua sắm ngay</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((o) => (
            <div key={o.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent2)' }}>
                    Đơn hàng #{o.id}
                  </span>
                  <span style={{ color: 'var(--text3)', fontSize: '12px', marginLeft: '12px' }}>
                    Đặt ngày: {new Date(o.created_at).toLocaleDateString('vi-VN')} {new Date(o.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <span className={`badge ${getStatusBadgeClass(o.order_status)}`} style={{ padding: '4px 10px', fontSize: '12px' }}>
                  {STATUS_LABELS[o.order_status] || o.order_status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Receiver Info */}
                <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                  <div>
                    <span style={{ color: 'var(--text3)' }}>👤 Người nhận: </span>
                    <strong>{o.receiver_name || user.full_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text3)' }}>📞 Số điện thoại: </span>
                    <strong>{o.receiver_phone}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text3)' }}>📍 Địa chỉ giao hàng: </span>
                    <strong style={{ color: 'var(--text)' }}>{o.receiver_address}</strong>
                  </div>
                  {o.note && (
                    <div>
                      <span style={{ color: 'var(--text3)' }}>📝 Ghi chú: </span>
                      <span style={{ color: 'var(--text2)', fontStyle: 'italic' }}>{o.note}</span>
                    </div>
                  )}
                </div>

                {/* Pricing & Invoice print */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>TỔNG THANH TOÁN</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent2)' }}>
                      {fmt(o.total_amount)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>Thanh toán qua Ví điện tử</div>
                  </div>
                  
                  {/* Vulnerable Invoice SSTI Link for testing */}
                  <a
                    href={`${API}/orders/${o.id}/invoice?title=HOA%20DON%20THANH%20TOAN`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: '12px', fontSize: '12px', gap: '6px', color: 'var(--accent2)', display: 'flex', alignItems: 'center' }}
                  >
                    📄 In Hóa đơn
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
