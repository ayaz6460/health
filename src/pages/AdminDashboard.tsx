import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AppleSpinner from '../components/AppleSpinner';
import type { Project, Endpoint, HealthLog } from '../types';

interface Stats {
  projects: number;
  endpoints: number;
  avgUptime: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ projects: 0, endpoints: 0, avgUptime: 100 });
  const [recentLogs, setRecentLogs] = useState<(HealthLog & { health_endpoints: Endpoint & { health_projects: Project } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const [{ count: pCount }, { count: eCount }, { data: logs }, { data: logStats }] = await Promise.all([
      supabase.from('health_projects').select('*', { count: 'exact', head: true }),
      supabase.from('health_endpoints').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('health_logs')
        .select('*, health_endpoints(name, path, health_projects(name))')
        .order('checked_at', { ascending: false })
        .limit(10),
      supabase.from('health_logs')
        .select('status')
        .gte('checked_at', new Date(Date.now() - 86400000 * 30).toISOString()),
    ]);

    const upCount = logStats?.filter(l => l.status === 'UP').length || 0;
    const totalCount = logStats?.length || 1;
    const uptime = Math.round((upCount / totalCount) * 10000) / 100;

    setStats({
      projects: pCount || 0,
      endpoints: eCount || 0,
      avgUptime: uptime,
    });
    setRecentLogs((logs || []) as never);
    setLoading(false);
  };

  const statCards = [
    { icon: '📁', label: 'Projects', value: stats.projects, color: '#0071e3' },
    { icon: '🔗', label: 'Active Endpoints', value: stats.endpoints, color: '#5856d6' },
    { icon: '📈', label: '30-Day Uptime', value: `${stats.avgUptime}%`, color: stats.avgUptime > 99 ? '#34c759' : stats.avgUptime > 95 ? '#ff9500' : '#ff3b30' },
  ];

  if (loading) return (
    <div className="loading">
      <AppleSpinner size={20} />
      <span>Loading dashboard...</span>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Real-time monitoring summary · Auto-refreshes every 30s</p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={loadDashboard}
          style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, border: '1px solid var(--border)' }}
          aria-label="Refresh dashboard"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        {statCards.map((s) => (
          <div key={s.label} className="card stat-card" style={{ '--accent-card': s.color } as React.CSSProperties}>
            <div className="stat-icon" style={{ background: `${s.color}14`, color: s.color }}>
              {s.icon}
            </div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.02em' }}>Live Check Feed</div>
          <span className="badge badge-neutral" style={{ fontSize: 11 }}>Last 10 checks</span>
        </div>
        {recentLogs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📡</div>
            <div className="empty-state-title">No checks yet</div>
            <div className="empty-state-text">Add endpoints and trigger a monitoring run to see logs here.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Endpoint</th>
                  <th>Status</th>
                  <th>Response Time</th>
                  <th>Code</th>
                  <th>Checked At</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map(log => (
                  <tr key={log.id}>
                    <td className="text-main">{(log.health_endpoints as any)?.health_projects?.name || '—'}</td>
                    <td><code style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>{(log.health_endpoints as any)?.path || log.endpoint_id}</code></td>
                    <td>
                      <span className={`badge badge-${log.status === 'UP' ? 'up' : 'down'}`}>
                        <span className={`dot dot-${log.status === 'UP' ? 'up' : 'down'}`} />
                        {log.status}
                      </span>
                    </td>
                    <td>{log.response_time ? `${log.response_time}ms` : '—'}</td>
                    <td>{log.status_code || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {new Date(log.checked_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
