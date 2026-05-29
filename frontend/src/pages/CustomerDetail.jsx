import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Building, Calendar, Plus } from 'lucide-react'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '—' }
function fmtDateTime(d) { return d ? new Date(d).toLocaleString() : '—' }
function initials(n) { return n ? n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?' }

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [customer, setCustomer] = useState(null)
  const [tickets, setTickets] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [ticketForm, setTicketForm] = useState({ title: '', description: '', priority: 'medium', assigned_agent_id: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    const [c, t] = await Promise.all([
      client.get(`/customers/${id}`),
      client.get(`/customers/${id}/tickets`),
    ])
    setCustomer(c.data)
    setTickets(t.data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  useEffect(() => {
    client.get('/users').then(r => setAgents(r.data.filter(u => u.role === 'agent' && u.is_active)))
  }, [])

  const createTicket = async () => {
    setSaving(true)
    try {
      await client.post('/tickets', {
        ...ticketForm,
        customer_id: parseInt(id),
        assigned_agent_id: ticketForm.assigned_agent_id || null,
      })
      setShowTicketModal(false)
      setTicketForm({ title: '', description: '', priority: 'medium', assigned_agent_id: '' })
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create ticket')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="spinner" />
  if (!customer) return <div className="empty-state"><p>Customer not found.</p></div>

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => navigate('/customers')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="page-title">{customer.full_name}</h1>
            <p className="page-subtitle">Customer Profile</p>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" id="new-ticket-for-customer" onClick={() => setShowTicketModal(true)}>
            <Plus size={15} /> New Ticket
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Profile card */}
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div className="avatar avatar-lg">{initials(customer.full_name)}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{customer.full_name}</div>
              {customer.company && <div style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>{customer.company}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem' }}>
              <Mail size={15} color="var(--text-3)" />
              <span style={{ color: 'var(--text-2)' }}>{customer.email}</span>
            </div>
            {customer.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem' }}>
                <Phone size={15} color="var(--text-3)" />
                <span style={{ color: 'var(--text-2)' }}>{customer.phone}</span>
              </div>
            )}
            {customer.company && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem' }}>
                <Building size={15} color="var(--text-3)" />
                <span style={{ color: 'var(--text-2)' }}>{customer.company}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem' }}>
              <Calendar size={15} color="var(--text-3)" />
              <span style={{ color: 'var(--text-2)' }}>Added {fmtDate(customer.created_at)}</span>
            </div>
          </div>

          {customer.assigned_agent && (
            <>
              <div className="divider" />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: '0.4rem' }}>ASSIGNED AGENT</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                  {initials(customer.assigned_agent.name)}
                </div>
                <span style={{ fontSize: '0.84rem', fontWeight: 500 }}>{customer.assigned_agent.name}</span>
              </div>
            </>
          )}

          {customer.notes && (
            <>
              <div className="divider" />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: '0.4rem' }}>NOTES</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{customer.notes}</p>
            </>
          )}
        </div>

        {/* Ticket history */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem 1rem' }}>
            <div className="card-title">Ticket History ({tickets.length})</div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Title</th><th>Status</th><th>Priority</th><th>Category</th><th>Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tickets/${t.id}`)}>
                    <td style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>#{t.id}</td>
                    <td style={{ fontWeight: 500 }}>{t.title}</td>
                    <td><Badge value={t.status} /></td>
                    <td><Badge value={t.priority} /></td>
                    <td style={{ color: 'var(--text-2)', fontSize: '0.8rem' }}>{t.category || '—'}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>{fmtDate(t.created_at)}</td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr><td colSpan={6}><div className="empty-state"><p>No tickets for this customer yet.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showTicketModal && (
        <Modal
          title="Create Ticket for Customer"
          onClose={() => setShowTicketModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowTicketModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createTicket} disabled={saving} id="create-ticket-submit">
                {saving ? 'Creating…' : 'Create Ticket'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-control" placeholder="Brief issue summary" value={ticketForm.title} onChange={e => setTicketForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-control" placeholder="Detailed description of the issue…" rows={4} value={ticketForm.description} onChange={e => setTicketForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={ticketForm.priority} onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assign Agent</label>
              <select className="form-control" value={ticketForm.assigned_agent_id} onChange={e => setTicketForm(f => ({ ...f, assigned_agent_id: e.target.value }))}>
                <option value="">— Unassigned —</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
