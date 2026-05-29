import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await client.post('/auth/login', form)
      login(data.access_token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  const fillCredentials = (email, password) => {
    setForm({ email, password })
  }

  return (
    <div className="login-page">
      {/* Background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />

      <div className="login-card">
        <div className="login-logo">
          <h1>⚡ TechServe CRM</h1>
          <p>AI-Enhanced Support Platform</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} id="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="you@techserve.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary login-submit"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="demo-creds">
          <strong>Demo Credentials</strong>
          <span style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-3)' }}>
            Click to fill:
          </span>
          <button
            type="button"
            style={{ all: 'unset', cursor: 'pointer', display: 'block', marginBottom: '4px' }}
            onClick={() => fillCredentials('admin@techserve.com', 'Admin@123')}
          >
            <code>👑 Manager: admin@techserve.com / Admin@123</code>
          </button>
          <button
            type="button"
            style={{ all: 'unset', cursor: 'pointer', display: 'block', marginBottom: '4px' }}
            onClick={() => fillCredentials('sarah@techserve.com', 'Agent@123')}
          >
            <code>🎧 Agent: sarah@techserve.com / Agent@123</code>
          </button>
          <button
            type="button"
            style={{ all: 'unset', cursor: 'pointer' }}
            onClick={() => fillCredentials('john@techserve.com', 'Agent@123')}
          >
            <code>🎧 Agent: john@techserve.com / Agent@123</code>
          </button>
        </div>
      </div>
    </div>
  )
}
