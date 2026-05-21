import { useState } from 'react'

const severityLabel = { crit: 'CRITICAL', high: 'HIGH', med: 'MEDIUM' }
const severityClass = { crit: 'vuln-item-crit', high: 'vuln-item-high', med: 'vuln-item-med' }
const severityColor = { crit: '#ef4444', high: '#f97316', med: '#ca8a04' }

export default function VulnHintPanel({ hints = [] }) {
  const [open, setOpen] = useState(false)

  if (hints.length === 0) return null

  return (
    <div className="vuln-panel">
      {open && (
        <div className="vuln-hints-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h4 style={{ margin: 0 }}>🎯 GỢI Ý LỖ HỔNG TRANG NÀY</h4>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
            >✕</button>
          </div>
          {hints.map(h => (
            <div key={h.id} className={`vuln-item ${severityClass[h.severity]}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="vuln-item-title" style={{ color: severityColor[h.severity] }}>{h.title}</span>
                <span style={{
                  fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px',
                  background: `${severityColor[h.severity]}25`, color: severityColor[h.severity],
                  fontFamily: 'var(--mono)', textTransform: 'uppercase'
                }}>
                  {severityLabel[h.severity]}
                </span>
              </div>
              <p className="vuln-item-desc">{h.desc}</p>
              {h.payload && (
                <div className="vuln-item-payload">{h.payload}</div>
              )}
            </div>
          ))}
          <p style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '8px', fontStyle: 'italic' }}>
            ⚠️ Chỉ dùng cho mục đích học tập
          </p>
        </div>
      )}
      <button className="vuln-toggle" onClick={() => setOpen(!open)} style={{ marginLeft: 'auto' }}>
        <span className="dot"></span>
        {hints.length} lỗ hổng trên trang này
      </button>
    </div>
  )
}
