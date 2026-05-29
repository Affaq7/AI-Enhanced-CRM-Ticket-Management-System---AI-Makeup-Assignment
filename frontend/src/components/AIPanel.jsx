import { useState } from 'react'
import { Bot, RefreshCw, Sparkles, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import Badge from './Badge'
import client from '../api/client'

export default function AIPanel({ ticket, onRefresh }) {
  const meta = ticket?.ai_metadata
  const [loadingReply, setLoadingReply] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingAnalyze, setLoadingAnalyze] = useState(false)
  const [showReply, setShowReply] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const reAnalyze = async () => {
    setLoadingAnalyze(true)
    try {
      await client.post(`/ai/analyze/${ticket.id}`)
      onRefresh()
    } finally { setLoadingAnalyze(false) }
  }

  const generateReply = async () => {
    setLoadingReply(true)
    try {
      await client.post(`/ai/suggest-reply/${ticket.id}`)
      onRefresh()
      setShowReply(true)
    } finally { setLoadingReply(false) }
  }

  const generateSummary = async () => {
    setLoadingSummary(true)
    try {
      await client.post(`/ai/summarize/${ticket.id}`)
      onRefresh()
      setShowSummary(true)
    } finally { setLoadingSummary(false) }
  }

  const score = meta?.ai_sentiment_score ?? null
  const tags = meta?.ai_tags ? meta.ai_tags.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <Bot size={16} color="var(--primary-light)" />
        <span className="ai-panel-title">AI Analysis</span>
        <button
          className="btn btn-sm btn-ghost"
          style={{ marginLeft: 'auto', fontSize: '0.72rem', padding: '0.22rem 0.55rem' }}
          onClick={reAnalyze}
          disabled={loadingAnalyze}
        >
          <RefreshCw size={12} className={loadingAnalyze ? 'spin' : ''} />
          {loadingAnalyze ? 'Analyzing…' : 'Re-analyze'}
        </button>
      </div>

      {/* Category */}
      <div className="ai-row">
        <span className="ai-row-label">Category</span>
        {meta?.ai_category
          ? <Badge value={meta.ai_category} />
          : <span style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>Pending…</span>
        }
      </div>

      {/* Sentiment */}
      <div className="ai-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="ai-row-label">Sentiment</span>
          {meta?.ai_sentiment
            ? <Badge value={meta.ai_sentiment} />
            : <span style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>Pending…</span>
          }
        </div>
        {score !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="sentiment-bar">
              <div className="sentiment-fill" style={{ width: `${Math.round(score * 100)}%` }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', minWidth: '30px' }}>
              {Math.round(score * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="ai-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '0.35rem' }}>
          <span className="ai-row-label">Tags</span>
          <div className="tags-wrap">
            {tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
          </div>
        </div>
      )}

      <div className="divider" style={{ margin: '0.85rem 0' }} />

      {/* Suggested Reply */}
      <div style={{ marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>
            <Sparkles size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Draft Reply
          </span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {meta?.ai_suggested_reply && (
              <button
                className="btn btn-sm btn-ghost"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                onClick={() => setShowReply(v => !v)}
              >
                {showReply ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
            <button
              className="btn btn-sm btn-ghost"
              style={{ fontSize: '0.72rem', padding: '0.22rem 0.55rem' }}
              onClick={generateReply}
              disabled={loadingReply}
            >
              {loadingReply ? 'Generating…' : meta?.ai_suggested_reply ? 'Regenerate' : 'Generate'}
            </button>
          </div>
        </div>
        {showReply && meta?.ai_suggested_reply && (
          <div className="reply-box">{meta.ai_suggested_reply}</div>
        )}
        {!meta?.ai_suggested_reply && !loadingReply && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.35rem' }}>
            Click Generate to get an AI-drafted reply.
          </p>
        )}
      </div>

      {/* Summary */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>
            <FileText size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Resolution Summary
          </span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {meta?.ai_summary && (
              <button
                className="btn btn-sm btn-ghost"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                onClick={() => setShowSummary(v => !v)}
              >
                {showSummary ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
            <button
              className="btn btn-sm btn-ghost"
              style={{ fontSize: '0.72rem', padding: '0.22rem 0.55rem' }}
              onClick={generateSummary}
              disabled={loadingSummary}
            >
              {loadingSummary ? 'Generating…' : meta?.ai_summary ? 'Regenerate' : 'Generate'}
            </button>
          </div>
        </div>
        {showSummary && meta?.ai_summary && (
          <div className="summary-box">{meta.ai_summary}</div>
        )}
        {!meta?.ai_summary && !loadingSummary && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.35rem' }}>
            Generate a summary of the full conversation.
          </p>
        )}
      </div>
    </div>
  )
}
