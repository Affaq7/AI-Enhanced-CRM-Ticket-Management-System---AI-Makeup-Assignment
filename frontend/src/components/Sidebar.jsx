import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Ticket, UserCircle,
  LogOut, ChevronRight, Bot
} from 'lucide-react'

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      <Icon size={17} />
      {label}
    </NavLink>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>⚡ TechServe CRM</h2>
        <span>AI-Enhanced Support</span>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-label">Main</span>
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/customers" icon={Users} label="Customers" />
        <NavItem to="/tickets" icon={Ticket} label="Tickets" />

        {user?.role === 'manager' && (
          <>
            <span className="nav-label" style={{ marginTop: '0.5rem' }}>Management</span>
            <NavItem to="/agents" icon={UserCircle} label="Agents" />
          </>
        )}

        <span className="nav-label" style={{ marginTop: '0.5rem' }}>System</span>
        <div className="nav-item" style={{ cursor: 'default', opacity: 0.5 }}>
          <Bot size={17} />
          AI Engine Active
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
