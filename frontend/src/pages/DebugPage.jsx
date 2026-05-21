import { useState, useEffect } from 'react'
import axios from 'axios'
import { API } from '../utils'

export default function DebugPage() {
  const [config, setConfig] = useState(null)
  const [pingIp, setPingIp] = useState('127.0.0.1')
  const [pingResult, setPingResult] = useState('')
  const [pingLoading, setPingLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/debug/config`)
      .then(r => setConfig(r.data))
      .catch(() => setConfig(null))
      .finally(() => setLoading(false))
  }, [])

  const items = config ? [
    { label: 'SECRET_KEY', value: config.SECRET_KEY },
    { label: 'ENV', value: config.ENV },
    { label: 'DEBUG', value: String(config.DEBUG) },
    { label: 'MYSQL_HOST', value: config.MYSQL_HOST },
    { label: 'MYSQL_USER', value: config.MYSQL_USER },
    { label: 'MYSQL_PASSWORD', value: config.MYSQL_PASSWORD },
    { label: 'MYSQL_DB', value: config.MYSQL_DB },
  ] : []

  return (
    <div className="page-wrapper animate-in">
      <h1 className="page-title">⚙️ Cấu hình hệ thống</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '24px', fontSize: '13.5px' }}>
        Thông tin cấu hình server — chỉ dành cho Developer
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }}></div>
        </div>
      ) : !config ? (
        <div className="alert alert-error">Không thể tải cấu hình.</div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '12px 16px', background: 'var(--bg3)',
                borderRadius: 'var(--r-sm)', border: '1px solid var(--border)'
              }}>
                <code style={{
                  fontSize: '12px', fontWeight: '700', color: 'var(--text3)',
                  minWidth: '160px', fontFamily: 'var(--mono)'
                }}>{item.label}</code>
                <code style={{ fontSize: '13px', color: 'var(--text)', wordBreak: 'break-all' }}>
                  {item.value || '(empty)'}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mt-8">
        <div className="section-header">
          <h2 className="section-title">🌐 Công cụ chẩn đoán mạng (Network Ping)</h2>
        </div>
        <p style={{ color: 'var(--text2)', marginBottom: '16px', fontSize: '13.5px' }}>
          Kiểm tra kết nối từ máy chủ hiện tại tới các hệ thống đích thông qua lệnh ping.
        </p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <input 
            className="form-input" 
            value={pingIp} 
            onChange={e => setPingIp(e.target.value)}
            placeholder="Nhập IP hoặc Domain (VD: 8.8.8.8)" 
          />
          <button 
            className="btn btn-primary" 
            onClick={async () => {
              setPingLoading(true)
              try {
                const r = await axios.post(`${API}/admin/ping`, { ip: pingIp })
                setPingResult(r.data.result)
              } catch (e) {
                setPingResult(e.response?.data?.result || 'Lỗi kết nối')
              }
              setPingLoading(false)
            }}
            disabled={pingLoading}
          >
            {pingLoading ? 'Đang chạy...' : 'Ping hệ thống'}
          </button>
        </div>
        
        {pingResult && (
          <div style={{ background: '#000', color: '#0f0', padding: '16px', borderRadius: 'var(--r-sm)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto', fontSize: '13px' }}>
            {pingResult}
          </div>
        )}
      </div>

    </div>
  )
}
