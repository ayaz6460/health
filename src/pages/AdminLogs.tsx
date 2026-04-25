import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import AppleSpinner from '../components/AppleSpinner';
import type { HealthLog, Endpoint, Project } from '../types';

export default function AdminLogs() {
  const [logs, setLogs] = useState<(HealthLog & { health_endpoints: Endpoint & { health_projects: Project } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('health_logs')
      .select('*, health_endpoints(name, path, health_projects(name, id))')
      .order('checked_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterStatus !== 'all') q = q.eq('status', filterStatus);
    const { data } = await q;
    const allLogs = (data || []) as never[];

    const filtered = filterProject === 'all'
      ? allLogs
      : allLogs.filter((l: any) => l.health_endpoints?.health_projects?.id === filterProject);

    setLogs(filtered as never);
    setLoading(false);
  }, [filterProject, filterStatus, page]);

  useEffect(() => {
    supabase.from('health_projects').select('id, name').order('name').then(({ data }) => setProjects(data || []));
  }, []);

  useEffect(() => { setPage(0); }, [filterProject, filterStatus]);
  useEffect(() => { load(); }, [load]);

  const upCount = logs.filter(l => l.status === 'UP').length;
  const downCount = logs.filter(l => l.status === 'DOWN').length;
  const avgRt = logs.filter(l => l.response_time).reduce((a, l) => a + (l.response_time || 0), 0) / (logs.filter(l => l.response_time).length || 1);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Logs & Analytics</h1>
          <p className="page-subtitle">Showing {logs.length} records · Page {page + 1}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-select" value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ width: 'auto' }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto' }}>
            <option value="all">All Status</option>
            <option value="UP">UP only</option>
            <option value="DOWN">DOWN only</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={load}>↻</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(52,199,89,0.08)', color: '#34c759' }}>✅</div>
          <div className="stat-value" style={{ color: '#34c759' }}>{upCount}</div>
          <div className="stat-label">UP checks (this page)</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255,59,48,0.06)', color: '#ff3b30' }}>🔴</div>
          <div className="stat-value" style={{ color: '#ff3b30' }}>{downCount}</div>
          <div className="stat-label">DOWN checks</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0,113,227,0.06)', color: '#0071e3' }}>⚡</div>
          <div className="stat-value" style={{ color: '#0071e3' }}>{Math.round(avgRt)}ms</div>
          <div className="stat-label">Avg Response Time</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><AppleSpinner size={20} /> Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No logs found</div>
            <div className="empty-state-text">Run the monitoring engine to generate logs.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Endpoint</th>
                  <th>Status</th>
                  <th>Code</th>
                  <th>Response Time</th>
                  <th>Checked At</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="text-main">{(log.health_endpoints as any)?.health_projects?.name || '—'}</td>
                    <td><code style={{ fontSize: 12, background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>{(log.health_endpoints as any)?.path || '—'}</code></td>
                    <td>
                      <span className={`badge badge-${log.status === 'UP' ? 'up' : 'down'}`}>
                        <span className={`dot dot-${log.status === 'UP' ? 'up' : 'down'}`} />
                        {log.status}
                      </span>
                    </td>
                    <td style={{ color: log.status_code && log.status_code < 400 ? 'var(--up)' : 'var(--down)' }}>
                      {log.status_code || '—'}
                    </td>
                    <td>
                      {log.response_time ? (
                        <span style={{ color: log.response_time > 2000 ? 'var(--warn)' : log.response_time > 1000 ? 'var(--text-secondary)' : 'var(--up)' }}>
                          {log.response_time}ms
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(log.checked_at).toLocaleString()}</td>
                    <td style={{ fontSize: 12, color: 'var(--down)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.error_message || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Previous</button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>Page {page + 1}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={logs.length < PAGE_SIZE}>Next →</button>
        </div>
      </div>
    </div>
  );
}
