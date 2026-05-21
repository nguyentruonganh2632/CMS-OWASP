import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API, getToken, getUser, fmt } from '../utils'

export default function AdminOrdersPage() {
  const navigate = useNavigate()
  const user = getUser()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => {
    // Bảo vệ phía client (nhưng backend dính lỗi BOLA/IDOR)
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
      const r = await axios.get(`${API}/admin/orders`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      setOrders(r.data.orders || [])
    } catch (e) {
      setError(e.response?.data?.error || 'Không thể tải danh sách đơn hàng')
    }
    setLoading(false)
  }

  const updateStatus = async (orderId, newStatus) => {
    setActionMsg('')
    try {
      const r = await axios.post(`${API}/admin/orders/${orderId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      setActionMsg(`success:${r.data.message}`)
      fetchOrders() // Reload list
    } catch (e) {
      setActionMsg(`error:${e.response?.data?.error || 'Cập nhật trạng thái thất bại'}`)
    }
  }

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
      <div className="section-header">
        <div>
          <h1 className="page-title">🧾 Quản lý Đơn hàng (Admin)</h1>
          <p style={{ color: 'var(--text3)', fontSize: '13.5px', marginTop: '4px' }}>
            Duyệt, hủy hoặc cập nhật trạng thái đơn hàng của tất cả khách hàng trong hệ thống.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchOrders} disabled={loading}>
          🔄 Tải lại
        </button>
      </div>

      {actionMsg && (
        <div className={`alert ${actionMsg.startsWith('success') ? 'alert-success' : 'alert-error'} mb-6`}>
          {actionMsg.split(':').slice(1).join(':')}
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-6">{error}</div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto' }}></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
          Hiện chưa có đơn hàng nào trong hệ thống.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '14px', textAlign: 'left' }}>Mã đơn</th>
                <th style={{ padding: '14px', textAlign: 'left' }}>Khách hàng</th>
                <th style={{ padding: '14px', textAlign: 'left' }}>Địa chỉ nhận</th>
                <th style={{ padding: '14px', textAlign: 'right' }}>Tổng tiền</th>
                <th style={{ padding: '14px', textAlign: 'center' }}>Trạng thái</th>
                <th style={{ padding: '14px', textAlign: 'center' }}>Ngày đặt</th>
                <th style={{ padding: '14px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '14px', fontWeight: '700' }}>
                    {/* Link directly to vulnerable SSTI invoice preview */}
                    <a 
                      href={`${API}/orders/${o.id}/invoice?title=HOA%20DON%20THANH%20TOAN`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Click để xem & test SSTI Invoice!"
                      style={{ color: 'var(--accent2)', textDecoration: 'underline' }}
                    >
                      #{o.id}
                    </a>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div><strong>{o.customer_name || 'Khách vãng lai'}</strong></div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>SĐT: {o.receiver_phone}</div>
                  </td>
                  <td style={{ padding: '14px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.receiver_address}>
                    {o.receiver_address}
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right', fontWeight: '700', color: 'var(--accent2)' }}>
                    {fmt(o.total_amount)}
                  </td>
                  <td style={{ padding: '14px', textAlign: 'center' }}>
                    <span className={`badge ${getStatusBadgeClass(o.order_status)}`}>
                      {STATUS_LABELS[o.order_status] || o.order_status}
                    </span>
                  </td>
                  <td style={{ padding: '14px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px' }}>
                    {new Date(o.created_at).toLocaleDateString('vi-VN')} {new Date(o.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td style={{ padding: '14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      {o.order_status === 'Cho xac nhan' && (
                        <>
                          <button 
                            className="btn btn-sm btn-primary" 
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => updateStatus(o.id, 'Da duyet')}
                          >
                            ✔️ Duyệt
                          </button>
                          <button 
                            className="btn btn-sm btn-ghost" 
                            style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--red2)', borderColor: 'rgba(239,68,68,0.2)' }}
                            onClick={() => updateStatus(o.id, 'Da huy')}
                          >
                            ❌ Hủy
                          </button>
                        </>
                      )}
                      {o.order_status === 'Da duyet' && (
                        <>
                          <button 
                            className="btn btn-sm btn-secondary" 
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => updateStatus(o.id, 'Dang giao')}
                          >
                            🚚 Giao hàng
                          </button>
                          <button 
                            className="btn btn-sm btn-ghost" 
                            style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--red2)', borderColor: 'rgba(239,68,68,0.2)' }}
                            onClick={() => updateStatus(o.id, 'Da huy')}
                          >
                            ❌ Hủy
                          </button>
                        </>
                      )}
                      {o.order_status === 'Dang giao' && (
                        <>
                          <button 
                            className="btn btn-sm btn-primary" 
                            style={{ padding: '3px 8px', fontSize: '11px', background: 'var(--green)', color: 'white', border: 'none' }}
                            onClick={() => updateStatus(o.id, 'Hoan thanh')}
                          >
                            📦 Hoàn thành
                          </button>
                          <button 
                            className="btn btn-sm btn-ghost" 
                            style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--red2)', borderColor: 'rgba(239,68,68,0.2)' }}
                            onClick={() => updateStatus(o.id, 'Da huy')}
                          >
                            ❌ Hủy
                          </button>
                        </>
                      )}
                      {(o.order_status === 'Hoan thanh' || o.order_status === 'Da giao' || o.order_status === 'Da huy') && (
                        <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Đã xong</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
