import { useState, useEffect } from 'react'
import axios from 'axios'
import { API, getUser, getToken } from '../utils'

const BLOG_EMOJIS = ['📰', '🐈', '🐟', '💡', '🍖', '🐾']

export default function BlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states for Create/Edit
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const user = getUser()
  const isAdmin = user?.role_id === 1

  // Fetch all posts
  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/posts`)
      setPosts(res.data.posts || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // Delete post (Vulnerable to IDOR!)
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return
    setError('')
    setSuccess('')

    try {
      const res = await axios.post(
        `${API}/posts/delete/${postId}`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )
      setSuccess(res.data.message || 'Xóa bài viết thành công!')
      fetchPosts()
    } catch (err) {
      setError(err.response?.data?.error || 'Không có quyền xóa bài viết!')
    }
  }

  // Submit search to the vulnerable search API (Triggers Reflected XSS under the hood!)
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchQ.trim()) return
    // Redirect to the vulnerable backend search endpoint to trigger Reflected XSS
    const searchUrl = `${API.replace('/api', '')}/api/posts/search?q=${searchQ}`
    window.location.href = searchUrl
  }

  // Filter posts locally for basic display
  const filteredPosts = posts.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchQ.toLowerCase()) ||
      p.content?.toLowerCase().includes(searchQ.toLowerCase())
  )

  const handleOpenCreate = () => {
    setEditingPost(null)
    setFormTitle('')
    setFormContent('')
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleOpenEdit = (post) => {
    setEditingPost(post)
    setFormTitle(post.title)
    setFormContent(post.content)
    setShowForm(true)
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!formTitle.trim() || !formContent.trim()) {
      setError('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết!')
      return
    }
    setFormLoading(true)
    setError('')
    setSuccess('')
    try {
      if (editingPost) {
        // Edit post
        const res = await axios.put(`${API}/posts/${editingPost.id}`, {
          title: formTitle,
          content: formContent
        }, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
        setSuccess(res.data.message || 'Cập nhật bài viết thành công!')
      } else {
        // Create post
        const res = await axios.post(`${API}/posts`, {
          title: formTitle,
          content: formContent
        }, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
        setSuccess(res.data.message || 'Tạo bài viết thành công!')
      }
      setShowForm(false)
      setFormTitle('')
      setFormContent('')
      setEditingPost(null)
      fetchPosts()
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi xử lý bài viết!')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="page-wrapper animate-in" style={{ maxWidth: '900px' }}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">📝 Tin tức & Cẩm nang</h1>
          <p className="page-subtitle">Cập nhật tin tức mới nhất về thú cưng và các chương trình ưu đãi từ CatShop.</p>
        </div>
        {isAdmin && !showForm && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            ➕ Viết bài mới
          </button>
        )}
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {success && <div className="alert alert-success mb-4">{success}</div>}

      {/* Write / Edit Form Card */}
      {showForm && (
        <div className="card mb-6" style={{ background: 'var(--bg2)', borderColor: 'var(--accent)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--accent2)' }}>
            {editingPost ? `✏️ Chỉnh sửa bài viết #${editingPost.id}` : '📝 Tạo bài viết mới'}
          </h2>
          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label className="form-label">Tiêu đề bài viết</label>
              <input
                className="form-input"
                placeholder="Nhập tiêu đề hấp dẫn..."
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nội dung chi tiết</label>
              <textarea
                className="form-input"
                placeholder="Viết nội dung chia sẻ bí quyết nuôi mèo của bạn tại đây..."
                style={{ minHeight: '200px', resize: 'vertical', fontFamily: 'inherit' }}
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowForm(false); setEditingPost(null) }}
                disabled={formLoading}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formLoading}
              >
                {formLoading ? <span className="spinner"></span> : '💾 Lưu bài viết'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ marginTop: '20px' }}>
        {/* Simple, normal search bar */}
        <div className="card mb-6" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              className="search-input"
              placeholder="Tìm kiếm bài viết..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Posts list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
            <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto 12px' }}></div>
            <p>Đang tải danh sách bài viết...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="alert alert-info">Không tìm thấy bài viết nào phù hợp.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredPosts.map((post, i) => (
              <div
                key={post.id}
                className="card"
                style={{
                  display: 'flex',
                  gap: '20px',
                  position: 'relative',
                  transition: 'all 0.2s',
                  border: '1px solid var(--border)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    background: 'var(--bg3)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    flexShrink: 0
                  }}
                >
                  {BLOG_EMOJIS[i % BLOG_EMOJIS.length]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>
                      {post.title}
                    </h2>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                      {new Date(post.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px' }}>
                    👤 Tác giả: <strong>{post.author_name || 'Ban biên tập'}</strong>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text2)', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                    {post.content}
                  </p>

                  {/* Edit / Delete actions for Author or Admin */}
                  {user && (user.id === post.author_id || user.role_id === 1) && (
                    <div style={{ marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{
                          color: 'var(--accent2)',
                          borderColor: 'rgba(99,102,241,0.15)',
                          fontSize: '11px',
                          padding: '4px 10px'
                        }}
                        onClick={() => handleOpenEdit(post)}
                      >
                        ✏️ Sửa bài viết
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{
                          color: 'var(--red2)',
                          borderColor: 'rgba(239,68,68,0.15)',
                          fontSize: '11px',
                          padding: '4px 10px'
                        }}
                        onClick={() => handleDeletePost(post.id)}
                      >
                        Xóa bài viết
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
