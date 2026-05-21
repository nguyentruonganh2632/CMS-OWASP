import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProductPage from './pages/ProductPage'
import SearchPage from './pages/SearchPage'
import ProfilePage from './pages/ProfilePage'
import CartPage from './pages/CartPage'
import MyOrdersPage from './pages/MyOrdersPage'
import BlogPage from './pages/BlogPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminProductsPage from './pages/AdminProductsPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import DebugPage from './pages/DebugPage'
import FetchPreviewPage from './pages/FetchPreviewPage'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="admin/products" element={<AdminProductsPage />} />
          <Route path="admin/orders" element={<AdminOrdersPage />} />
          <Route path="admin/debug" element={<DebugPage />} />
          <Route path="tools/fetch-preview" element={<FetchPreviewPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

