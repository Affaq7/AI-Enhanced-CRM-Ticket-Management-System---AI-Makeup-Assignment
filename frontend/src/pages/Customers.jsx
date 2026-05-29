import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Edit2, Trash2, ExternalLink } from 'lucide-react'
import Modal from '../components/Modal'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const emptyForm = { full_name: '', email: '', phone: '', company: '', notes: '', assigned_agent_id: '' }

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString() : '—'
}

export default function Customers() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [agents, setAgents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchCustomers = async () => {
    const params = search ? { search } : {}
    const { data } = await client.get('/customers', { params })
    setCustomers(data)
    setLoading(false)
  }

  useEffect(() => { fetchCustomers() }, [search])

  useEffect(() => {
    client.get('/users').then(r => setAgents(r.data.filter(u => u.role === 'agent')))
  }, [])

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (c) => { setEditTarget(c); setForm({ ...c, assigned_agent_id: c.assigned_agent_id ?? '' }); setShowModal(true) }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, assigned_agent_id: form.assigned_agent_id || null }
      if (editTarget) await client.put(`/customers/${editTarget.id}`, payload)
      else await client.post('/customers', payload)
      setShowModal(false)
      fetchCustomers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer and all their tickets?')) return
    await client.delete(`/customers/${id}`)
    fetchCustomers()
  }

  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{customers.length} total records</p>
        </div>
        <div className="page-actions">
          <button id="add-customer-btn" className="btn btn-primary" onClick={openCreate}>
            <Plus size={15} /> Add Customer
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-wrap">
          <Search size={15} />
          <input
            id="customer-search"
            type="text"
            className="form-control search-input"
            placeholder="Search name, email, company…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Assigned Agent</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div className="avatar">{initials(c.full_name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>{c.company || '—'}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>{c.phone || '—'}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>
                      {c.assigned_agent?.name || <span style={{ color: 'var(--text-3)' }}>Unassigned</span>}
                    </td>
                    <td style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>{fmtDate(c.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn-icon" title="View Profile" onClick={() => navigate(`/customers/${c.id}`)}>
                          <ExternalLink size={14} />
                        </button>
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(c)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-icon" title="Delete" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(c.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr><td colSpan={6}>
                    <div className="empty-state">
                      <Users size={32} />
                      <h3>No customers found</h3>
                      <p>Add your first customer to get started.</p>
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
          title={editTarget ? 'Edit Customer' : 'Add New Customer'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-customer-btn">
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Customer'}
              </button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Jane Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@company.com" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555 0100" />
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-control" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Corp" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Assigned Agent</label>
            <select className="form-control" value={form.assigned_agent_id} onChange={e => setForm(f => ({ ...f, assigned_agent_id: e.target.value }))}>
              <option value="">— Unassigned —</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any relevant notes about this customer…" />
          </div>
        </Modal>
      )}
    </>
  )
}
