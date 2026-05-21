import { useState } from 'react'
import axios from 'axios'
import { API } from '../utils'

export default function FetchPreviewPage() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const doFetch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult('')
    setStatus('')
    try {
      const r = await axios.post(`${API}/fetch-preview`, { url })
      setStatus('success')
      setResult(r.data.content)
    } catch (e) {
      setStatus('error')
      setResult(e.response?.data?.error || e.message)
    }
    setLoading(false)
  }

  return (
    <div className="page-wrapper animate-in" style={{ maxWidth: '720px' }}>
      <h1 className="page-title">🔗 URL Preview</h1>
      <p style={{ color: 'var(--text2)', fontSize: '13.5px', marginBottom: '24px' }}>
        Công cụ xem trước nội dung từ URL bên ngoài — hỗ trợ kiểm tra link sản phẩm và nhà cung cấp.
      </p>

      <div className="card">
        <form onSubmit={doFetch}>
          <div className="form-group">
            <label className="form-label">URL</label>
            <input className="form-input" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/api/products" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><span className="spinner"></span> Đang tải...</> : '🔍 Xem trước'}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: '20px' }}>
            <div className="form-label" style={{ marginBottom: '8px' }}>
              Kết quả {status === 'error' ? '(lỗi)' : ''}
            </div>
            <div style={{
              background: '#040609', border: `1px solid ${status === 'success' ? 'var(--border)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 'var(--r-sm)', padding: '16px',
              fontFamily: 'var(--mono)', fontSize: '12px',
              color: status === 'success' ? 'var(--text)' : '#fca5a5',
              maxHeight: '400px', overflowY: 'auto',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6'
            }}>
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
