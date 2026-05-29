import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Tickets from './pages/Tickets'
import TicketDetail from './pages/TicketDetail'
import Agents from './pages/Agents'

function ProtectedRoute({ children, managerOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="spinner" style={{ marginTop: '10vh' }} />
  if (!user) return <Navigate to="/login" replace />
  if (managerOnly && user.role !== 'manager') return <Navigate to="/dashboard" replace />
  return children
}

function Layout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="page fade-in">{children}</div>
      </main>
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute>
      } />
      <Route path="/customers/:id" element={
        <ProtectedRoute><Layout><CustomerDetail /></Layout></ProtectedRoute>
      } />
      <Route path="/tickets" element={
        <ProtectedRoute><Layout><Tickets /></Layout></ProtectedRoute>
      } />
      <Route path="/tickets/:id" element={
        <ProtectedRoute><Layout><TicketDetail /></Layout></ProtectedRoute>
      } />
      <Route path="/agents" element={
        <ProtectedRoute managerOnly><Layout><Agents /></Layout></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
