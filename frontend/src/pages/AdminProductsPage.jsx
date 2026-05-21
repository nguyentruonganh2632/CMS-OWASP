import { useState, useEffect } from 'react'
import axios from 'axios'
import { API, fmt } from '../utils'

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', price: '', sale_price: '', description: '', category_id: 1, stock_quantity: 10 })
  const [msg, setMsg] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = () => {
    axios.get(`${API}/products`)
      .then(r => setProducts(r.data.products || []))
      .finally(() => setLoading(false))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreateLoading(true)
    setMsg('')
    try {
      await axios.post(`${API}/products`, form)
      setMsg('success:Tạo sản phẩm thành công')
      loadProducts()
      setForm({ name: '', price: '', sale_price: '', description: '', category_id: 1, stock_quantity: 10 })
    } catch (e) {
      setMsg('error:' + (e.response?.data?.error || 'Lỗi tạo sản phẩm'))
    }
    setCreateLoading(false)
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/products/${id}`)
      loadProducts()
    } catch (e) {
      alert(e.response?.data?.error || 'Lỗi xóa sản phẩm')
    }
  }

  const handleEdit = async (p, addStock, newPrice) => {
    try {
      await axios.put(`${API}/products/${p.id}`, {
        price: newPrice !== undefined ? newPrice : p.price,
        stock_quantity: p.stock_quantity + (addStock || 0)
      })
      loadProducts()
    } catch (e) {
      alert(e.response?.data?.error || 'Lỗi cập nhật')
    }
  }

  return (
    <div className="page-wrapper animate-in">
      <h1 className="page-title">📦 Quản lý sản phẩm</h1>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>➕ Thêm sản phẩm</h2>

          {msg && (
            <div className={`alert ${msg.startsWith('success') ? 'alert-success' : 'alert-error'}`}>
              {msg.split(':').slice(1).join(':')}
            </div>
          )}

          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Tên sản phẩm</label>
              <input className="form-input" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ví dụ: Royal Canin 400g" required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Giá gốc (đ)</label>
                <input className="form-input" type="number" value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Giá khuyến mãi</label>
                <input className="form-input" type="number" value={form.sale_price}
                  onChange={e => setForm({ ...form, sale_price: e.target.value })}
                  placeholder="(tùy chọn)" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Danh mục</label>
                <select className="form-input" value={form.category_id}
                  onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value={1}>Thức ăn khô</option>
                  <option value={2}>Thức ăn ướt</option>
                  <option value={3}>Đồ ăn vặt</option>
                  <option value={4}>Sữa & Nước</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tồn kho</label>
                <input className="form-input" type="number" value={form.stock_quantity}
                  onChange={e => setForm({ ...form, stock_quantity: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Mô tả</label>
              <textarea className="form-input" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả sản phẩm..." />
            </div>
            <button type="submit" className="btn btn-primary" disabled={createLoading}>
              {createLoading ? <><span className="spinner"></span> Đang tạo...</> : '✅ Tạo sản phẩm'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
            Danh sách ({products.length})
          </h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : (
            <div style={{ maxHeight: '560px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {products.map(p => (
                <div key={p.id} style={{
                  padding: '12px', background: 'var(--bg3)',
                  borderRadius: 'var(--r-sm)', border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13.5px' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>ID: #{p.id}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--accent2)', fontWeight: '700' }}>{fmt(p.sale_price || p.price)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Còn: {p.stock_quantity}</div>
                      <div style={{ marginTop: '6px', display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button className="btn btn-sm btn-ghost" style={{ padding: '2px 6px', fontSize: '11px', color: 'var(--green)' }} onClick={() => handleEdit(p, 10)}>+10 Kho</button>
                        <button className="btn btn-sm btn-ghost" style={{ padding: '2px 6px', fontSize: '11px', color: 'var(--blue)' }} onClick={() => handleEdit(p, 0, p.price * 1.1)}>+10% Giá</button>
                        <button className="btn btn-sm btn-ghost" style={{ padding: '2px 6px', fontSize: '11px', color: 'var(--red)' }} onClick={() => handleDelete(p.id)}>Xóa</button>
                      </div>
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
