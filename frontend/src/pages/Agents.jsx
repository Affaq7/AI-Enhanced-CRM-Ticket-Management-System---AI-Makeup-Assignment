import { useEffect, useState } from 'react'
import { UserPlus, Edit2, UserX, Ticket, ShieldCheck, ShieldAlert } from 'lucide-react'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '—' }
function initials(n) { return n ? n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?' }

export default function Agents() {
  const { user: currentUser } = useAuth()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent' })
  const [saving, setSaving] = useState(false)

  const fetchAgents = async () => {
    const { data } = await client.get('/users')
    setAgents(data)
    setLoading(false)
  }

  useEffect(() => { fetchAgents() }, [])

  const openCreate = () => {
    setEditTarget(null)
    setForm({ name: '', email: '', password: '', role: 'agent' })
    setShowModal(true)
  }

  const openEdit = (a) => {
    setEditTarget(a)
    setForm({ name: a.name, email: a.email, password: '', role: a.role })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editTarget) {
        const payload = { name: form.name, email: form.email, role: form.role }
        await client.put(`/users/${editTarget.id}`, payload)
      } else {
        await client.post('/users', form)
      }
      setShowModal(false)
      fetchAgents()
    } catch (err) {
      alert(err.response?.data?.detail || 'Save failed')
    } finally { setSaving(false) }
  }

  const toggleActive = async (agent) => {
    if (agent.id === currentUser.id) return alert("You can't deactivate yourself.")
    await client.delete(`/users/${agent.id}`)
    fetchAgents()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Agent Management</h1>
          <p className="page-subtitle">Manage support team members and roles</p>
        </div>
        <div className="page-actions">
          <button id="add-agent-btn" className="btn btn-primary" onClick={openCreate}>
            <UserPlus size={15} /> Add Agent
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div className="avatar">{initials(a.name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {a.name}
                            {a.id === currentUser.id && (
                              <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--primary-light)' }}>(you)</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        {a.role === 'manager'
                          ? <ShieldCheck size={14} color="var(--primary-light)" />
                          : <ShieldAlert size={14} color="var(--accent)" />
                        }
                        <span style={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>{a.role}</span>
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${a.is_active ? 'badge-resolved' : 'badge-closed'}`}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{fmtDate(a.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(a)}>
                          <Edit2 size={14} />
                        </button>
                        {a.id !== currentUser.id && (
                          <button
                            className="btn-icon"
                            title={a.is_active ? 'Deactivate' : 'Already inactive'}
                            style={{ color: 'var(--danger)' }}
                            onClick={() => toggleActive(a)}
                            disabled={!a.is_active}
                          >
                            <UserX size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title={editTarget ? 'Edit User' : 'Add New Agent'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button id="save-agent-btn" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Agent'}
              </button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Agent Name" />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="agent">Agent</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="agent@techserve.com" />
          </div>
          {!editTarget && (
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" className="form-control" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Minimum 8 characters" />
            </div>
          )}
        </Modal>
      )}
    </>
  )
}
