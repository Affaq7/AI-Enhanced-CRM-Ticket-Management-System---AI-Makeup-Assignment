import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, Lock, Unlock, RefreshCw } from 'lucide-react'
import Badge from '../components/Badge'
import AIPanel from '../components/AIPanel'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

function fmtDateTime(d) {
  return d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}
function initials(n) { return n ? n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?' }

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [history, setHistory] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState(null)
  const pollRef = useRef(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchAll = async () => {
    const [t, c, h] = await Promise.all([
      client.get(`/tickets/${id}`),
      client.get(`/tickets/${id}/comments`),
      client.get(`/tickets/${id}/history`),
    ])
    setTicket(t.data)
    setComments(c.data)
    setHistory(h.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    client.get('/users').then(r => setAgents(r.data.filter(u => u.role === 'agent' && u.is_active)))

    // Poll every 10 seconds for live updates
    pollRef.current = setInterval(fetchAll, 10000)
    return () => clearInterval(pollRef.current)
  }, [id])

  const updateField = async (field, value) => {
    setUpdating(true)
    try {
      await client.put(`/tickets/${id}`, { [field]: value })
      await fetchAll()
      showToast(`${field.replace('_', ' ')} updated`)
    } catch { showToast('Update failed', 'error') }
    finally { setUpdating(false) }
  }

  const submitComment = async () => {
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      await client.post(`/tickets/${id}/comments`, { message: commentText, is_internal: isInternal })
      setCommentText('')
      setIsInternal(false)
      await fetchAll()
      showToast('Comment added')
    } catch { showToast('Comment failed', 'error') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="spinner" />
  if (!ticket) return <div className="empty-state"><p>Ticket not found.</p></div>

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => navigate('/tickets')} style={{ marginTop: '4px' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 700 }}>#{ticket.id}</span>
            </div>
            <h1 className="page-title" style={{ fontSize: '1.3rem' }}>{ticket.title}</h1>
            <div className="ticket-meta-row" style={{ marginTop: '0.5rem' }}>
              <Badge value={ticket.status} />
              <Badge value={ticket.priority} />
              {ticket.ai_metadata?.ai_category && <Badge value={ticket.ai_metadata.ai_category} />}
              {ticket.ai_metadata?.ai_sentiment && <Badge value={ticket.ai_metadata.ai_sentiment} />}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchAll} disabled={updating}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="ticket-detail-grid">
        {/* Left: main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Description */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Description</div>
              <Link to={`/customers/${ticket.customer_id}`} style={{ fontSize: '0.82rem', color: 'var(--primary-light)' }}>
                👤 {ticket.customer?.full_name || 'Customer'}
              </Link>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {ticket.description}
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-3)' }}>Created: </span>
                <span style={{ color: 'var(--text-2)' }}>{fmtDateTime(ticket.created_at)}</span>
              </div>
              {ticket.resolved_at && (
                <div style={{ fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-3)' }}>Resolved: </span>
                  <span style={{ color: 'var(--success)' }}>{fmtDateTime(ticket.resolved_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Comment thread */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '1rem' }}>Activity ({comments.length})</div>
            <div className="comment-thread">
              {comments.map(c => (
                <div key={c.id} className="comment-item">
                  <div className="comment-avatar">{initials(c.agent?.name)}</div>
                  <div className={`comment-bubble${c.is_internal ? ' internal' : ''}`}>
                    <div className="comment-meta">
                      <span className="comment-author">{c.agent?.name || 'Agent'}</span>
                      {c.is_internal && <span className="badge badge-medium" style={{ fontSize: '0.65rem' }}>Internal</span>}
                      <span className="comment-time">{fmtDateTime(c.created_at)}</span>
                    </div>
                    <p className="comment-text">{c.message}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p style={{ color: 'var(--text-3)', fontSize: '0.84rem' }}>No comments yet. Add the first update below.</p>
              )}
            </div>

            <div className="divider" />

            {/* Add comment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <textarea
                id="comment-input"
                className="form-control"
                placeholder={isInternal ? 'Internal note (visible to agents only)…' : 'Add a public comment or update…'}
                rows={3}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                style={{ borderColor: isInternal ? 'rgba(245,158,11,0.4)' : undefined }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  className={`btn btn-sm ${isInternal ? 'btn-secondary' : 'btn-ghost'}`}
                  onClick={() => setIsInternal(v => !v)}
                  style={{ fontSize: '0.78rem' }}
                >
                  {isInternal ? <Lock size={13} /> : <Unlock size={13} />}
                  {isInternal ? 'Internal Note' : 'Public Comment'}
                </button>
                <button
                  id="submit-comment-btn"
                  className="btn btn-primary btn-sm"
                  onClick={submitComment}
                  disabled={submitting || !commentText.trim()}
                >
                  <Send size={13} />
                  {submitting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          </div>

          {/* History timeline */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '1rem' }}>History ({history.length})</div>
            <div className="history-list">
              {history.map(h => (
                <div key={h.id} className="history-item">
                  <div className="history-dot" />
                  <div className="history-content">
                    <div className="history-desc">
                      <strong>{h.agent?.name || 'System'}</strong>
                      {' '}{h.field_changed === 'comment'
                        ? `added a ${h.new_value}`
                        : <>changed <strong>{h.field_changed.replace('_', ' ')}</strong>
                            {h.old_value && <> from <em>{h.old_value}</em></>}
                            {h.new_value && <> to <em>{h.new_value}</em></>}
                          </>
                      }
                    </div>
                    <div className="history-time">{fmtDateTime(h.changed_at)}</div>
                  </div>
                </div>
              ))}
              {history.length === 0 && <p style={{ color: 'var(--text-3)', fontSize: '0.84rem' }}>No history yet.</p>}
            </div>
          </div>
        </div>

        {/* Right: sidebar controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* AI Panel */}
          <AIPanel ticket={ticket} onRefresh={fetchAll} />

          {/* Controls card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card-title">Ticket Controls</div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                id="status-control"
                className="form-control"
                value={ticket.status}
                onChange={e => updateField('status', e.target.value)}
                disabled={updating}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                id="priority-control"
                className="form-control"
                value={ticket.priority}
                onChange={e => updateField('priority', e.target.value)}
                disabled={updating}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Agent</label>
              <select
                id="agent-control"
                className="form-control"
                value={ticket.assigned_agent_id ?? ''}
                onChange={e => updateField('assigned_agent_id', e.target.value || null)}
                disabled={updating}
              >
                <option value="">— Unassigned —</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                id="category-control"
                className="form-control"
                value={ticket.category || 'General'}
                onChange={e => updateField('category', e.target.value)}
                disabled={updating}
              >
                <option value="Billing">Billing</option>
                <option value="Technical">Technical</option>
                <option value="Account">Account</option>
                <option value="Shipping">Shipping</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {/* Customer quick info */}
          {ticket.customer && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: '0.75rem' }}>Customer</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                <div className="avatar">{initials(ticket.customer.full_name)}</div>
                <div>
                  <Link to={`/customers/${ticket.customer.id}`} style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-light)' }}>
                    {ticket.customer.full_name}
                  </Link>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{ticket.customer.email}</div>
                </div>
              </div>
              {ticket.customer.company && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>🏢 {ticket.customer.company}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
