import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AppleSpinner from '../components/AppleSpinner';
import type { Project } from '../types';

const EMPTY: Omit<Project, 'id' | 'created_at' | 'updated_at'> = {
  name: '', base_url: '', description: '', public_visible: true,
};

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('health_projects').select('*').order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  };

  const openNew = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true); };
  const openEdit = (p: Project) => { setEditing(p); setForm({ name: p.name, base_url: p.base_url, description: p.description || '', public_visible: p.public_visible }); setError(''); setShowModal(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    if (editing) {
      const { error } = await supabase.from('health_projects').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('health_projects').insert(form);
      if (error) { setError(error.message); setSaving(false); return; }
    }
    setSaving(false); setShowModal(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this project and all its data?')) return;
    await supabase.from('health_projects').delete().eq('id', id);
    load();
  };

  if (loading) return <div className="loading"><AppleSpinner size={20} /> Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <div className="empty-state-title">No projects yet</div>
            <div className="empty-state-text">Create your first project to start monitoring.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {projects.map(p => (
            <div key={p.id} className="card card-p" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>{p.name}</span>
                  {p.public_visible
                    ? <span className="badge badge-up" style={{ fontSize: 10 }}>Public</span>
                    : <span className="badge badge-neutral" style={{ fontSize: 10 }}>Private</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'SF Mono', Menlo, monospace" }}>{p.base_url}</div>
                {p.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{p.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Project' : 'New Project'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={save}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Awesome App" required />
              </div>
              <div className="form-group">
                <label className="form-label">Base URL *</label>
                <input className="form-input" value={form.base_url} onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))} placeholder="https://api.example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" className={`toggle ${form.public_visible ? 'on' : ''}`} onClick={() => setForm(f => ({ ...f, public_visible: !f.public_visible }))} />
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Show on public status page</span>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Project' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
