import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AppleSpinner from '../components/AppleSpinner';
import type { Endpoint, Project } from '../types';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'];
const EMPTY = { project_id: '', name: '', path: '/', method: 'GET', expected_status: 200, keyword_check: '', check_interval_seconds: 120, is_active: true };

export default function AdminEndpoints() {
  const [endpoints, setEndpoints] = useState<(Endpoint & { health_projects: Project })[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Endpoint | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [checkingId, setCheckingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [{ data: eps }, { data: projs }] = await Promise.all([
      supabase.from('health_endpoints').select('*, health_projects(*)').order('created_at', { ascending: false }),
      supabase.from('health_projects').select('*').order('name'),
    ]);
    setEndpoints((eps || []) as never);
    setProjects(projs || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, project_id: projects[0]?.id || '' });
    setError(''); setShowModal(true);
  };
  const openEdit = (ep: Endpoint) => {
    setEditing(ep);
    setForm({ project_id: ep.project_id, name: ep.name, path: ep.path, method: ep.method, expected_status: ep.expected_status, keyword_check: ep.keyword_check || '', check_interval_seconds: ep.check_interval_seconds, is_active: ep.is_active });
    setError(''); setShowModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    const payload = { ...form, keyword_check: form.keyword_check || null };
    const { error } = editing
      ? await supabase.from('health_endpoints').update(payload).eq('id', editing.id)
      : await supabase.from('health_endpoints').insert(payload);
    if (error) { setError(error.message); setSaving(false); return; }
    setSaving(false); setShowModal(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this endpoint?')) return;
    await supabase.from('health_endpoints').delete().eq('id', id);
    load();
  };

  const toggleActive = async (ep: Endpoint) => {
    await supabase.from('health_endpoints').update({ is_active: !ep.is_active }).eq('id', ep.id);
    load();
  };

  const checkNow = async (id: string) => {
    setCheckingId(id);
    try {
      const res = await fetch('https://terqresjhmivqwnsivzb.supabase.co/functions/v1/health-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force_check_endpoint_id: id })
      });
      if (!res.ok) throw new Error('Request failed');
      alert('Check triggered successfully. See logs for result.');
    } catch (e) {
      alert('Failed to check: ' + String(e));
    } finally {
      setCheckingId(null);
    }
  };

  const filtered = filterProject === 'all' ? endpoints : endpoints.filter(e => e.project_id === filterProject);

  if (loading) return <div className="loading"><AppleSpinner size={20} /> Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Endpoints</h1>
          <p className="page-subtitle">{endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''} configured</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="form-select" value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ width: 'auto' }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openNew}>+ Add Endpoint</button>
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔗</div>
            <div className="empty-state-title">No endpoints</div>
            <div className="empty-state-text">Add endpoints to start monitoring.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Name</th>
                  <th>Path</th>
                  <th>Method</th>
                  <th>Expected</th>
                  <th>Interval</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ep => (
                  <tr key={ep.id}>
                    <td className="text-main">{(ep as any).health_projects?.name}</td>
                    <td>{ep.name}</td>
                    <td><code style={{ fontSize: 13, background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>{ep.path}</code></td>
                    <td><span className="endpoint-method">{ep.method}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{ep.expected_status}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{ep.check_interval_seconds}s</td>
                    <td>
                      <button className={`toggle ${ep.is_active ? 'on' : ''}`} onClick={() => toggleActive(ep)} title={ep.is_active ? 'Active' : 'Paused'} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => checkNow(ep.id)} disabled={checkingId === ep.id}>
                          {checkingId === ep.id ? '⏳' : '⚡ Check'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(ep)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(ep.id)}>Delete</button>
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
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Endpoint' : 'New Endpoint'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={save}>
              <div className="form-group">
                <label className="form-label">Project *</label>
                <select className="form-select" value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} required>
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Login API" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Method</label>
                  <select className="form-select" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                    {METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Path *</span>
                    <select
                      className="form-select"
                      style={{ padding: '0px 4px', fontSize: 12, height: 24, width: 'auto', minHeight: 'unset', background: 'transparent', border: '1px solid var(--border)' }}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        if (val === '/auth/v1/health' || val === '/rest/v1/' || val === '/realtime/v1/health' || val === '/graphql/v1') {
                           setForm(f => ({ ...f, path: val, expected_status: 401 }));
                        } else if (val === '/storage/v1/health') {
                           setForm(f => ({ ...f, path: val, expected_status: 400 }));
                        } else {
                           setForm(f => ({ ...f, path: val, expected_status: 200 }));
                        }
                        e.target.value = '';
                      }}
                    >
                      <option value="">+ Presets</option>
                      <option value="/">Root ( / )</option>
                      <option value="/api/health">API Health</option>
                      <option disabled>--- Supabase ---</option>
                      <option value="/auth/v1/health">Supabase Auth (401)</option>
                      <option value="/rest/v1/">Supabase Database (401)</option>
                      <option value="/storage/v1/health">Supabase Storage (400)</option>
                      <option value="/realtime/v1/health">Supabase Realtime (401)</option>
                      <option value="/graphql/v1">Supabase GraphQL (401)</option>
                    </select>
                  </label>
                  <input className="form-input" value={form.path} onChange={e => setForm(f => ({ ...f, path: e.target.value }))} placeholder="/api/health" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Expected Status</label>
                  <input className="form-input" type="number" value={form.expected_status} onChange={e => setForm(f => ({ ...f, expected_status: +e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Keyword Check <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(optional)</span></label>
                  <input className="form-input" value={form.keyword_check} onChange={e => setForm(f => ({ ...f, keyword_check: e.target.value }))} placeholder="ok" />
                </div>
                <div className="form-group">
                  <label className="form-label">Check Interval (Seconds)</label>
                  <input className="form-input" type="number" min="60" value={form.check_interval_seconds} onChange={e => setForm(f => ({ ...f, check_interval_seconds: +e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" className={`toggle ${form.is_active ? 'on' : ''}`} onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} />
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Active monitoring</span>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Endpoint'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
