import { useState, useEffect } from 'react'
import axios from 'axios'
import { API, fmt } from '../utils'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const loadUsers = () => {
    setLoading(true)
    axios.get(`${API}/admin/users`)
      .then(r => setUsers(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleDelete = async (id) => {
    // Thay thế window.confirm để không dùng popup của trình duyệt
    try {
      await axios.delete(`${API}/admin/users/${id}`)
      loadUsers()
    } catch (e) {
      alert(e.response?.data?.error || 'Lỗi xóa')
    }
  }

  const handleAddMoney = async (id, amount) => {
    try {
      await axios.post(`${API}/admin/users/${id}/money`, { amount })
      loadUsers()
    } catch (e) {
      alert('Lỗi bơm tiền')
    }
  }

  const roleLabel = { 1: '👑 Admin', 2: '👤 Khách hàng', 3: '👤 Khách hàng', 4: '👤 Khách hàng' }

  return (
    <div className="page-wrapper animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">👥 Quản lý người dùng</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13.5px' }}>Danh sách tài khoản trong hệ thống</p>
        </div>
        <span className="badge badge-blue">{users.length} tài khoản</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }}></div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Điện thoại</th>
                <th>Vai trò</th>
                <th>Số dư</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontFamily: 'var(--mono)', color: 'var(--text3)' }}>#{u.id}</td>
                  <td style={{ fontWeight: '600' }}>{u.full_name}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '12.5px' }}>{u.email}</td>
                  <td style={{ color: 'var(--text2)' }}>{u.phone || '—'}</td>
                  <td>{roleLabel[u.role_id] || `Role ${u.role_id}`}</td>
                  <td style={{ fontWeight: '700', color: 'var(--accent2)' }}>{fmt(u.balance || 0)}</td>

                  <td style={{ color: 'var(--text3)', fontSize: '12px' }}>
                    {u.created_at?.split('T')[0] || '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button className="btn btn-sm btn-ghost" style={{color: 'var(--green)', fontSize: '11px', padding: '4px 8px'}} onClick={() => handleAddMoney(u.id, 100000)}>+100k</button>
                      <button className="btn btn-sm btn-ghost" style={{color: 'var(--blue)', fontSize: '11px', padding: '4px 8px'}} onClick={() => handleAddMoney(u.id, 1000000)}>+1M</button>
                      <button className="btn btn-sm btn-ghost" style={{color: 'var(--red)', fontSize: '11px', padding: '4px 8px'}} onClick={() => handleDelete(u.id)} disabled={u.id === 1}>Xóa</button>
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
