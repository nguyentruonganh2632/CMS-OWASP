import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { API, fmt, getUser, getToken } from '../utils'

const EMOJIS = ['🐱', '🐟', '🍖', '🐾', '✨']

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [selectedCat, setSelectedCat] = useState(null)
  const navigate = useNavigate()
  const user = getUser()

  const QUICK_CATS = [
    { id: 1, label: 'Thức ăn khô', icon: '🥩' },
    { id: 2, label: 'Pate ướt', icon: '🥫' },
    { id: 3, label: 'Đồ ăn vặt', icon: '🍬' },
    { id: 4, label: 'Sữa & Nước', icon: '🥛' }
  ]

  useEffect(() => {
    axios.get(`${API}/products`)
      .then(r => setProducts(r.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQ.trim()) navigate(`/search?q=${encodeURIComponent(searchQ)}`)
  }

  const handleAddToCart = async (e, productId) => {
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }
    try {
      await axios.post(`${API}/cart/add`, { product_id: productId, quantity: 1 }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      // Trigger update for Layout cart count
      window.dispatchEvent(new Event('cart-update'))
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi thêm vào giỏ')
    }
  }

  // Filter products by selected category dynamically
  const displayedProducts = selectedCat
    ? products.filter(p => p.category_id === selectedCat)
    : products;

  return (
    <div className="page-wrapper animate-in">
      {/* Hero */}
      <div className="hero">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1>🐱 CatFood Shop</h1>
            <p>Thức ăn cao cấp cho boss nhà bạn. Hàng nhập khẩu chính hãng từ Pháp, Nhật, Mỹ.</p>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginTop: '24px', maxWidth: '440px' }}>
              <input
                className="search-input"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Tìm</button>
            </form>
          </div>
          <div style={{ fontSize: '80px', opacity: 0.3 }}>🐾</div>
        </div>
      </div>

      {/* Danh mục nhanh (Lọc sản phẩm động) */}
      <div className="grid-4 mb-6">
        {QUICK_CATS.map((c) => {
          const isActive = selectedCat === c.id;
          return (
            <div
              key={c.id}
              className="card-sm animate-in"
              style={{
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.22s ease',
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                background: isActive ? 'var(--accent-dim)' : 'var(--bg2)',
                transform: isActive ? 'translateY(-2px)' : 'none',
                boxShadow: isActive ? '0 8px 24px rgba(99,102,241,0.2)' : 'none'
              }}
              onClick={() => setSelectedCat(selectedCat === c.id ? null : c.id)}
            >
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{c.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: isActive ? 'var(--text)' : 'var(--text2)' }}>
                {c.label} {isActive && '✓'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Sản phẩm nổi bật */}
      <div className="section-header">
        <h2 className="section-title">
          {selectedCat 
            ? `🔥 Danh sách: ${QUICK_CATS.find(c => c.id === selectedCat)?.label}` 
            : '🔥 Sản phẩm nổi bật'
          }
        </h2>
        {selectedCat && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCat(null)}>
            Xem tất cả
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
          <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto 12px' }}></div>
          <p>Đang tải sản phẩm...</p>
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="alert alert-info">
          Chưa có sản phẩm nào thuộc danh mục này!
        </div>
      ) : (
        <div className="products-grid">
          {displayedProducts.map((p, i) => (
            <div key={p.id} className="product-card" onClick={() => navigate(`/product/${p.id}`)}>
              <div className="product-img">{EMOJIS[i % EMOJIS.length]}</div>
              <div className="product-body">
                <div className="product-brand">{p.brand_name || 'No brand'}</div>
                <div className="product-name">{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="product-price">
                      {fmt(p.sale_price || p.price)}
                    </span>
                    {p.sale_price && (
                      <span className="product-old-price" style={{ marginLeft: 0, marginTop: '2px' }}>{fmt(p.price)}</span>
                    )}
                  </div>
                  <button 
                    className="btn btn-sm btn-primary" 
                    style={{ padding: '4px 8px', fontSize: '11px', flexShrink: 0 }}
                    onClick={(e) => handleAddToCart(e, p.id)}
                  >
                    Thêm 🛒
                  </button>
                </div>
                {p.stock_quantity <= 10 && p.stock_quantity > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <span className="badge badge-yellow">Sắp hết</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Banner */}
      {!user && (
        <div className="card mt-8" style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(79,70,229,0.05))',
          borderColor: 'rgba(99,102,241,0.2)',
          textAlign: 'center',
          padding: '32px'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎁</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Mua 3 tặng 1 cho thành viên mới</h3>
          <p style={{ color: 'var(--text2)', marginBottom: '16px', fontSize: '13.5px' }}>
            Đăng ký tài khoản ngay để nhận ưu đãi đặc biệt
          </p>
          <Link to="/register" className="btn btn-primary">Đăng ký ngay</Link>
        </div>
      )}
    </div>
  )
}
