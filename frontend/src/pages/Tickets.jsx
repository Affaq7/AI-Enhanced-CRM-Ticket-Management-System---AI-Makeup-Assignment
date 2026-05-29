import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Ticket } from 'lucide-react'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '—' }

export default function Tickets() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [customers, setCustomers] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' })
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', customer_id: '', assigned_agent_id: '' })
  const [saving, setSaving] = useState(false)

  const fetchTickets = async () => {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.priority) params.priority = filters.priority
    if (filters.search) params.search = filters.search
    const { data } = await client.get('/tickets', { params })
    setTickets(data)
    setLoading(false)
  }

  useEffect(() => { fetchTickets() }, [filters])

  useEffect(() => {
    Promise.all([
      client.get('/customers'),
      client.get('/users'),
    ]).then(([c, u]) => {
      setCustomers(c.data)
      setAgents(u.data.filter(a => a.role === 'agent' && a.is_active))
    })
  }, [])

  const handleCreate = async () => {
    if (!form.customer_id) return alert('Please select a customer')
    setSaving(true)
    try {
      const res = await client.post('/tickets', {
        ...form,
        customer_id: parseInt(form.customer_id),
        assigned_agent_id: form.assigned_agent_id || null,
      })
      setShowModal(false)
      setForm({ title: '', description: '', priority: 'medium', customer_id: '', assigned_agent_id: '' })
      fetchTickets()
      navigate(`/tickets/${res.data.id}`)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create ticket')
    } finally { setSaving(false) }
  }

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }))

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tickets</h1>
          <p className="page-subtitle">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} shown</p>
        </div>
        <div className="page-actions">
          <button id="create-ticket-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> New Ticket
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-wrap">
          <Search size={15} />
          <input
            id="ticket-search"
            type="text"
            className="form-control search-input"
            placeholder="Search tickets…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
        </div>
        <select id="status-filter" className="filter-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select id="priority-filter" className="filter-select" value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Category</th>
                  <th>Agent</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tickets/${t.id}`)}>
                    <td style={{ color: 'var(--text-3)', fontSize: '0.78rem', fontWeight: 600 }}>#{t.id}</td>
                    <td>
                      <div style={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>{t.customer?.full_name || '—'}</td>
                    <td><Badge value={t.status} /></td>
                    <td><Badge value={t.priority} /></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{t.category || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>
                      {t.assigned_agent?.name || <span style={{ color: 'var(--text-3)' }}>Unassigned</span>}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{fmtDate(t.created_at)}</td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <Ticket size={32} />
                      <h3>No tickets found</h3>
                      <p>Create a new ticket or adjust your filters.</p>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title="Create New Ticket"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button id="submit-new-ticket" className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating…' : 'Create Ticket'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-control" placeholder="Brief summary of the issue" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-control" placeholder="Detailed description…" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Customer *</label>
              <select className="form-control" value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
                <option value="">— Select Customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Assign Agent</label>
            <select className="form-control" value={form.assigned_agent_id} onChange={e => setForm(f => ({ ...f, assigned_agent_id: e.target.value }))}>
              <option value="">— Unassigned —</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </Modal>
      )}
    </>
  )
}
