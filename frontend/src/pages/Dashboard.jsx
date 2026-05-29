import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Ticket, Users, AlertTriangle, CheckCircle,
  Clock, UserCog, TrendingUp, Activity
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import client from '../api/client'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
)

const chartDefaults = {
  plugins: { legend: { labels: { color: '#9090b8', font: { size: 12 } } } },
  scales: {
    x: { ticks: { color: '#5a5a80' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#5a5a80' }, grid: { color: 'rgba(255,255,255,0.04)' } },
  },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [trends, setTrends] = useState([])
  const [categories, setCategories] = useState([])
  const [workload, setWorkload] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      client.get('/dashboard/stats'),
      client.get('/dashboard/resolution-trends'),
      client.get('/dashboard/category-breakdown'),
      client.get('/dashboard/agent-workload'),
      client.get('/dashboard/recent-tickets'),
    ]).then(([s, t, c, w, r]) => {
      setStats(s.data)
      setTrends(t.data)
      setCategories(c.data)
      setWorkload(w.data)
      setRecent(r.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />

  const lineData = {
    labels: trends.map(t => t.date),
    datasets: [
      {
        label: 'Created',
        data: trends.map(t => t.created),
        borderColor: '#7c6aff',
        backgroundColor: 'rgba(124,106,255,0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Resolved',
        data: trends.map(t => t.resolved),
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0,212,255,0.08)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const donutColors = ['#7c6aff','#00d4ff','#22c55e','#f59e0b','#ef4444']
  const donutData = {
    labels: categories.map(c => c.category),
    datasets: [{
      data: categories.map(c => c.count),
      backgroundColor: donutColors,
      borderColor: 'transparent',
      hoverOffset: 8,
    }],
  }

  const barData = {
    labels: workload.map(w => w.agent_name.split(' ')[0]),
    datasets: [
      {
        label: 'Open',
        data: workload.map(w => w.open_tickets),
        backgroundColor: 'rgba(124,106,255,0.7)',
        borderRadius: 6,
      },
      {
        label: 'Total',
        data: workload.map(w => w.total_tickets),
        backgroundColor: 'rgba(0,212,255,0.35)',
        borderRadius: 6,
      },
    ],
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">TechServe CRM — Overview & Analytics</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={<Ticket size={20} color="#7c6aff" />} label="Total Tickets" value={stats?.total_tickets} />
        <StatCard icon={<Activity size={20} color="#3b82f6" />} label="Open Tickets" value={stats?.open_tickets} color="#3b82f6" iconBg="var(--info-bg)" />
        <StatCard icon={<AlertTriangle size={20} color="#ef4444" />} label="Critical" value={stats?.critical_tickets} color="#ef4444" iconBg="var(--danger-bg)" />
        <StatCard icon={<CheckCircle size={20} color="#22c55e" />} label="Resolved Today" value={stats?.resolved_today} color="#22c55e" iconBg="var(--success-bg)" />
        <StatCard icon={<Users size={20} color="#00d4ff" />} label="Customers" value={stats?.total_customers} color="#00d4ff" iconBg="var(--accent-dim)" />
        <StatCard icon={<UserCog size={20} color="#f59e0b" />} label="Active Agents" value={stats?.total_agents} color="#f59e0b" iconBg="var(--warning-bg)" />
        <StatCard icon={<Clock size={20} color="#9d8fff" />} label="Avg Resolution (h)" value={stats?.avg_resolution_time_hours ?? 'N/A'} color="#9d8fff" />
        <StatCard icon={<TrendingUp size={20} color="#f97316" />} label="In Progress" value={stats?.in_progress_tickets} color="#f97316" iconBg="var(--orange-bg)" />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Ticket Trends (7 Days)</div>
              <div className="card-subtitle">Created vs Resolved</div>
            </div>
          </div>
          <Line data={lineData} options={{ ...chartDefaults, responsive: true, maintainAspectRatio: true, aspectRatio: 2.5 }} />
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Category Breakdown</div>
              <div className="card-subtitle">AI-classified</div>
            </div>
          </div>
          {categories.length > 0
            ? <Doughnut
                data={donutData}
                options={{
                  plugins: { legend: { position: 'bottom', labels: { color: '#9090b8', font: { size: 11 }, padding: 12 } } },
                  maintainAspectRatio: true,
                  cutout: '65%',
                }}
              />
            : <div className="empty-state"><p>No data yet</p></div>
          }
        </div>
      </div>

      {/* Agent Workload + Recent Tickets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Agent Workload</div>
          </div>
          {workload.length > 0
            ? <Bar data={barData} options={{ ...chartDefaults, responsive: true, maintainAspectRatio: true, aspectRatio: 1.6 }} />
            : <div className="empty-state"><p>No agents assigned yet</p></div>
          }
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Tickets</div>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('/tickets')}>View all</button>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(t => (
                  <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tickets/${t.id}`)}>
                    <td style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>#{t.id}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </td>
                    <td><Badge value={t.status} /></td>
                    <td><Badge value={t.priority} /></td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td colSpan={4}><div className="empty-state"><p>No tickets yet</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
