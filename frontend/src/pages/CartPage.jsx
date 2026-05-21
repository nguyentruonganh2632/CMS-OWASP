import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API, fmt, getToken, getUser } from '../utils'

export default function CartPage() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const user = getUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const r = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      setItems(r.data.items || [])
      setTotal(r.data.total || 0)
    } catch (e) {
      setError('Lỗi tải giỏ hàng')
    }
    setLoading(false)
  }

  const handleRemove = async (itemId) => {
    try {
      await axios.delete(`${API}/cart/remove/${itemId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      loadCart()
      window.dispatchEvent(new Event('cart-update'))
    } catch (e) {
      alert('Lỗi xóa sản phẩm')
    }
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    setCheckoutLoading(true)
    setError('')
    try {
      const form = new FormData(e.target)
      const data = {
        address: form.get('address'),
        phone: form.get('phone')
      }
      const r = await axios.post(`${API}/cart/checkout`, data, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      setSuccess(r.data.message)
      setItems([])
      setTotal(0)
      window.dispatchEvent(new Event('auth-change')) // To update wallet balance in navbar
      window.dispatchEvent(new Event('cart-update'))
    } catch (e) {
      setError(e.response?.data?.error || 'Thanh toán thất bại')
    }
    setCheckoutLoading(false)
  }

  if (loading) return <div className="page-wrapper"><div className="spinner"></div></div>

  return (
    <div className="page-wrapper animate-in" style={{ maxWidth: '800px' }}>
      <h1 className="page-title">🛒 Giỏ hàng của bạn</h1>
      
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🪹</div>
          <h3>Giỏ hàng trống</h3>
          <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>Bạn chưa có sản phẩm nào trong giỏ.</p>
          <Link to="/search" className="btn btn-primary">Mua sắm ngay</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          {/* Item List */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map(item => (
              <div key={item.cart_item_id} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div style={{ width: '80px', height: '80px', background: 'var(--bg2)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>
                  📦
                </div>
                <div style={{ flex: 1 }}>
                  <Link to={`/product/${item.product_id}`} style={{ fontWeight: '600', fontSize: '16px', color: 'var(--text)', textDecoration: 'none' }}>
                    {item.name}
                  </Link>
                  <div style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '4px' }}>Số lượng: {item.quantity}</div>
                  <div style={{ color: 'var(--accent2)', fontWeight: '700', marginTop: '4px' }}>{fmt(item.actual_price)}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => handleRemove(item.cart_item_id)} style={{ color: 'var(--red)', alignSelf: 'flex-start' }}>
                  Xóa
                </button>
              </div>
            ))}
          </div>

          {/* Checkout Panel */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Tổng quan</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>
              <span>Tổng tiền:</span>
              <span style={{ color: 'var(--accent2)' }}>{fmt(total)}</span>
            </div>
            
            <form onSubmit={handleCheckout}>
              <div className="form-group">
                <label className="form-label">SĐT người nhận</label>
                <input name="phone" className="form-input" defaultValue={user?.phone} required />
              </div>
              <div className="form-group">
                <label className="form-label">Địa chỉ nhận hàng</label>
                <textarea name="address" className="form-input" rows="3" placeholder="Nhập địa chỉ..." required></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={checkoutLoading}>
                {checkoutLoading ? 'Đang xử lý...' : 'Thanh toán ngay'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
