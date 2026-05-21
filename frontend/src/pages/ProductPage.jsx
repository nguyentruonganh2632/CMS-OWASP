import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API, getToken, getUser, fmt } from '../utils'

const EMOJIS = ['🐱', '🐟', '🍖', '🐾', '✨', '🥩', '🥫', '🍗']

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(5)
  const [submitMsg, setSubmitMsg] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [buyLoading, setBuyLoading] = useState(false)
  const [buyMsg, setBuyMsg] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [qty, setQty] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const user = getUser()

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/products/${id}`),
      axios.get(`${API}/reviews`, { params: { product_id: id } })
    ]).then(([pRes, rRes]) => {
      setProduct(pRes.data.product)
      setReviews(rRes.data.reviews || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const submitReview = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    setSubmitLoading(true)
    try {
      await axios.post(`${API}/reviews`, {
        product_id: parseInt(id), rating, comment
      }, { headers: { Authorization: `Bearer ${getToken()}` } })
      setSubmitMsg('success')
      const r = await axios.get(`${API}/reviews`, { params: { product_id: id } })
      setReviews(r.data.reviews || [])
      setComment('')
    } catch (e) {
      setSubmitMsg('error:' + (e.response?.data?.error || 'Lỗi khi gửi đánh giá'))
    }
    setSubmitLoading(false)
  }

  const handleBuy = async () => {
    if (!user) { navigate('/login'); return }
    setBuyLoading(true)
    setBuyMsg('')
    try {
      const r = await axios.post(`${API}/purchase`, {
        product_id: parseInt(id),
        quantity,
        address: address || 'Địa chỉ mặc định',
        phone: phone || user.phone || ''
      }, { headers: { Authorization: `Bearer ${getToken()}` } })
      setBuyMsg('success:' + r.data.message)
      // Update balance in localStorage
      const updatedUser = { ...user, balance: r.data.balance_after }
      localStorage.setItem('cms_user', JSON.stringify(updatedUser))
      window.dispatchEvent(new Event('auth-change'))
      setTimeout(() => setShowBuyModal(false), 2000)
    } catch (e) {
      setBuyMsg('error:' + (e.response?.data?.error || 'Mua hàng thất bại'))
    }
    setBuyLoading(false)
  }

  const addToCart = async () => {
    if (!user) return navigate('/login')
    setCartLoading(true)
    try {
      await axios.post(`${API}/cart/add`, { product_id: product.id, quantity: qty }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      alert('Đã thêm vào giỏ hàng!')
      window.dispatchEvent(new Event('cart-update'))
      navigate('/cart')
    } catch (e) {
      alert(e.response?.data?.error || 'Lỗi thêm giỏ hàng')
    }
    setCartLoading(false)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text3)' }}>
      <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto' }}></div>
    </div>
  )

  if (!product) return (
    <div className="page-wrapper"><div className="alert alert-error">Không tìm thấy sản phẩm!</div></div>
  )

  const displayPrice = product.sale_price || product.price
  const total = Number(displayPrice) * quantity

  return (
    <div className="page-wrapper animate-in">
      <div className="breadcrumb">
        <Link to="/" style={{ color: 'var(--text3)' }}>Trang chủ</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to="/search" style={{ color: 'var(--text3)' }}>Sản phẩm</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{product.name}</span>
      </div>

      <div className="grid-2 mb-8" style={{ alignItems: 'start' }}>
        <div className="card" style={{ textAlign: 'center', fontSize: '100px', padding: '40px' }}>
          {EMOJIS[id % EMOJIS.length]}
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>{product.name}</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13.5px', marginBottom: '16px', lineHeight: '1.7' }}>{product.description}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '30px', fontWeight: '800', color: 'var(--accent2)' }}>
              {fmt(displayPrice)}
            </span>
            {product.sale_price && (
              <>
                <span style={{ fontSize: '16px', color: 'var(--text3)', textDecoration: 'line-through' }}>
                  {fmt(product.price)}
                </span>
                <span className="badge badge-red">SALE</span>
              </>
            )}
          </div>

          <div className="card-sm" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              <div><span style={{ color: 'var(--text3)' }}>Tồn kho:</span> <strong>{product.stock_quantity}</strong></div>
              <div><span style={{ color: 'var(--text3)' }}>Danh mục:</span> <strong>{product.category_name || 'Khác'}</strong></div>
            </div>
          </div>

          {/* Quantity & Buy */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg3)', borderRadius: 'var(--r-sm)', padding: '4px 8px' }}>
              <button className="btn btn-ghost btn-sm" style={{ padding: '4px 10px' }}
                onClick={() => { setQuantity(Math.max(1, quantity - 1)); setQty(Math.max(1, qty - 1)) }}>−</button>
              <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '700' }}>{quantity}</span>
              <button className="btn btn-ghost btn-sm" style={{ padding: '4px 10px' }}
                onClick={() => { setQuantity(quantity + 1); setQty(qty + 1) }}>+</button>
            </div>
            <button className="btn btn-secondary btn-lg" onClick={addToCart} disabled={cartLoading}>
              {cartLoading ? 'Đang thêm...' : '🛒 Thêm vào giỏ'}
            </button>
            <button className="btn btn-primary btn-lg" style={{ flex: 1 }}
              onClick={() => { user ? setShowBuyModal(true) : navigate('/login') }}>
              💳 Mua ngay — {fmt(total)}
            </button>
          </div>

          {user && (
            <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
              💰 Số dư ví: <strong style={{ color: 'var(--accent2)' }}>{fmt(user.balance || 0)}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Buy Modal */}
      {showBuyModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '460px', maxWidth: '95vw' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Xác nhận đặt hàng</h2>

            <div className="card-sm" style={{ marginBottom: '16px', background: 'var(--bg3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                <span>{product.name} × {quantity}</span>
                <strong>{fmt(total)}</strong>
              </div>
            </div>

            {buyMsg && (
              <div className={`alert ${buyMsg.startsWith('success') ? 'alert-success' : 'alert-error'}`}>
                {buyMsg.split(':').slice(1).join(':')}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Địa chỉ giao hàng</label>
              <input className="form-input" value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Số nhà, đường, quận, thành phố..." />
            </div>
            <div className="form-group">
              <label className="form-label">Số điện thoại nhận hàng</label>
              <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="09xxxxxxxx" />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-ghost" onClick={() => setShowBuyModal(false)} style={{ flex: 1 }}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleBuy} disabled={buyLoading} style={{ flex: 2 }}>
                {buyLoading ? <><span className="spinner"></span> Đang xử lý...</> : `✅ Xác nhận thanh toán`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="card">
        <div className="section-header">
          <h2 className="section-title">💬 Đánh giá ({reviews.length})</h2>
        </div>

        {reviews.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: '13.5px', padding: '20px 0' }}>
            Chưa có đánh giá nào. Hãy là người đầu tiên!
          </p>
        ) : (
          reviews.map(r => (
            <div key={r.id} className="review-item">
              <div className="review-header">
                <div className="review-avatar">{(r.full_name || 'K')[0]}</div>
                <div>
                  <div className="review-name">{r.full_name || `Khách hàng #${r.user_id}`}</div>
                  <div className="review-stars">{'⭐'.repeat(r.rating || 5)}</div>
                </div>
                <span className="review-date">{r.created_at?.split('T')[0] || 'Hôm nay'}</span>
              </div>
              {/* Stored XSS: dangerouslySetInnerHTML renders raw HTML from DB */}
              <div className="review-content" dangerouslySetInnerHTML={{ __html: r.comment }} />
            </div>
          ))
        )}

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>Viết đánh giá</h3>

          {submitMsg === 'success' && (
            <div className="alert alert-success">Cảm ơn bạn đã đánh giá!</div>
          )}
          {submitMsg.startsWith('error:') && (
            <div className="alert alert-error">{submitMsg.slice(6)}</div>
          )}

          <form onSubmit={submitReview}>
            <div className="form-group">
              <label className="form-label">Đánh giá sao</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" className="star-btn" onClick={() => setRating(s)}>
                    {s <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Nhận xét</label>
              <textarea className="form-input" placeholder="Chia sẻ trải nghiệm của bạn..."
                value={comment} onChange={e => setComment(e.target.value)} required />
            </div>
            {user ? (
              <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                {submitLoading ? <><span className="spinner"></span> Đang gửi...</> : '📤 Gửi đánh giá'}
              </button>
            ) : (
              <Link to="/login" className="btn btn-ghost">Đăng nhập để đánh giá</Link>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
