import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getUser, clearAuth, getToken, API, fmt } from '../utils'
import axios from 'axios'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(getUser())
  const [cartCount, setCartCount] = useState(0)

  const syncUser = () => setUser(getUser())

  useEffect(() => {
    window.addEventListener('auth-change', syncUser)
    return () => window.removeEventListener('auth-change', syncUser)
  }, [])

  // Refresh balance from server periodically
  useEffect(() => {
    if (!user) return
    const refresh = async () => {
      try {
        const r = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
        const updated = { ...user, balance: r.data.user.balance }
        localStorage.setItem('cms_user', JSON.stringify(updated))
        setUser(updated)

        // Lấy số lượng giỏ hàng
        const cRes = await axios.get(`${API}/cart`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
        if (cRes.data.items) {
          const totalQty = cRes.data.items.reduce((sum, item) => sum + item.quantity, 0)
          setCartCount(totalQty)
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 404) {
          clearAuth()
          setUser(null)
          setCartCount(0)
          window.dispatchEvent(new Event('auth-change'))
          navigate('/')
        }
      }
    }

    refresh()
    window.addEventListener('cart-update', refresh)
    return () => window.removeEventListener('cart-update', refresh)
  }, [location.pathname, user?.id])

  const handleLogout = () => {
    clearAuth()
    setUser(null)
    window.dispatchEvent(new Event('auth-change'))
    navigate('/')
  }

  const isAdmin = user && user.role_id === 1
  const isSuperAdmin = user && user.role_id === 1
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="nav-logo">
            <div className="nav-logo-icon">🐱</div>
            CatFood<span style={{ color: 'var(--accent2)' }}>Shop</span>
          </Link>

          <div className="nav-links">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Trang chủ</Link>
            <Link to="/search" className={`nav-link ${isActive('/search') ? 'active' : ''}`}>Sản phẩm</Link>
            <Link to="/blog" className={`nav-link ${isActive('/blog') ? 'active' : ''}`}>📝 Tin tức</Link>
            <Link to="/tools/fetch-preview" className={`nav-link ${isActive('/tools') ? 'active' : ''}`}>🔗 Preview</Link>
          </div>

          <div className="nav-right">
            {user ? (
              <>
                {/* Cart link */}
                <Link to="/cart" className={`btn btn-ghost btn-sm ${isActive('/cart') ? 'active' : ''}`} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  🛒 Giỏ hàng
                  {cartCount > 0 && (
                    <span style={{
                      background: 'var(--accent)', color: 'white', fontSize: '10px', fontWeight: '800',
                      padding: '2px 6px', borderRadius: '10px', marginLeft: '2px'
                    }}>
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Wallet balance */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '20px', padding: '5px 12px', fontSize: '13px'
                }}>
                  <span>💰</span>
                  <span style={{ fontWeight: '700', color: 'var(--accent2)' }}>
                    {fmt(user.balance || 0)}
                  </span>
                </div>

                <div className="user-dropdown-container">
                  <div className="nav-user" style={{ cursor: 'pointer' }}>
                    <div className="nav-avatar">{user.full_name?.[0] || '?'}</div>
                    <span>{user.full_name}</span>
                    {user.role_id === 1 && (
                      <span style={{ color: 'var(--yellow)', fontSize: '10px' }}>ADMIN</span>
                    )}
                  </div>
                  
                  <div className="user-dropdown-menu">
                    <Link to="/profile" className="dropdown-item">👤 Hồ sơ của tôi</Link>
                    <Link to="/orders" className="dropdown-item">📦 Đơn hàng của tôi</Link>
                    
                    {isAdmin && (
                      <>
                        <div className="dropdown-divider"></div>
                        <Link to="/admin/users" className="dropdown-item" style={{color: 'var(--yellow)'}}>👥 Quản lý Users</Link>
                        <Link to="/admin/products" className="dropdown-item" style={{color: 'var(--yellow)'}}>📦 Quản lý Sản phẩm</Link>
                        <Link to="/admin/orders" className="dropdown-item" style={{color: 'var(--yellow)'}}>🧾 Quản lý Đơn hàng</Link>
                      </>
                    )}
                    {isSuperAdmin && (
                      <Link to="/admin/debug" className="dropdown-item" style={{color: 'var(--yellow)'}}>⚙️ Cấu hình & Debug</Link>
                    )}
                    
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item" onClick={handleLogout} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'var(--red2)'}}>
                      🚪 Đăng xuất
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Đăng nhập</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </>
  )
}
