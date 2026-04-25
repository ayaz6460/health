import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AppleSpinner from '../components/AppleSpinner';
import type { Subscriber, Project } from '../types';

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState<(Subscriber & { health_projects: Project })[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('all');
  const [newEmail, setNewEmail] = useState('');
  const [newProject, setNewProject] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [{ data: subs }, { data: projs }] = await Promise.all([
      supabase.from('health_subscribers').select('*, health_projects(name)').order('subscribed_at', { ascending: false }),
      supabase.from('health_projects').select('*').order('name'),
    ]);
    setSubscribers((subs || []) as never);
    setProjects(projs || []);
    if (projs && projs.length > 0) setNewProject(projs[0].id);
    setLoading(false);
  };

  const addSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newProject) return;
    setAdding(true); setError('');
    const { error } = await supabase.from('health_subscribers').insert({ project_id: newProject, email: newEmail });
    if (error) { setError(error.message); setAdding(false); return; }
    setNewEmail(''); setAdding(false); load();
  };

  const toggleActive = async (sub: Subscriber) => {
    await supabase.from('health_subscribers').update({ is_active: !sub.is_active }).eq('id', sub.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this subscriber?')) return;
    await supabase.from('health_subscribers').delete().eq('id', id);
    load();
  };

  const filtered = filterProject === 'all' ? subscribers : subscribers.filter(s => s.project_id === filterProject);

  if (loading) return <div className="loading"><AppleSpinner size={20} /> Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscribers</h1>
          <p className="page-subtitle">{subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''} across all projects</p>
        </div>
        <select className="form-select" value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="card card-p" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16, letterSpacing: '-0.02em' }}>Add Subscriber</div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={addSubscriber} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select className="form-select" value={newProject} onChange={e => setNewProject(e.target.value)} style={{ flex: '0 0 200px' }} required>
            <option value="">Project...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input
            type="email"
            className="form-input"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="user@example.com"
            required
            style={{ flex: 1, minWidth: 200 }}
          />
          <button type="submit" className="btn btn-primary" disabled={adding}>
            {adding ? 'Adding...' : '+ Add'}
          </button>
        </form>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No subscribers yet</div>
            <div className="empty-state-text">Add subscribers to notify them of outages.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Email</th>
                  <th>Subscribed</th>
                  <th>Active</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => (
                  <tr key={sub.id}>
                    <td className="text-main">{(sub as any).health_projects?.name}</td>
                    <td>{sub.email}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(sub.subscribed_at).toLocaleDateString()}</td>
                    <td>
                      <button className={`toggle ${sub.is_active ? 'on' : ''}`} onClick={() => toggleActive(sub)} />
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(sub.id)}>Remove</button>
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
