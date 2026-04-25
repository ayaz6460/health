import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AppleSpinner from '../components/AppleSpinner';
import type { Project } from '../types';

interface SmtpForm {
  project_id: string;
  host: string;
  port: number;
  email: string;
  password: string;
  from_name: string;
}

const EMPTY: SmtpForm = { project_id: '', host: '', port: 587, email: '', password: '', from_name: 'VigilNode' };

export default function AdminSMTP() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<SmtpForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [{ data: projs }, { data: cfgs }] = await Promise.all([
      supabase.from('health_projects').select('*').order('name'),
      supabase.from('health_smtp_configs').select('*, health_projects(name)'),
    ]);
    setProjects(projs || []);
    setConfigs(cfgs || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, project_id: projects[0]?.id || '' });
    setError(''); setShowModal(true);
  };
  const openEdit = (cfg: any) => {
    setEditing(cfg);
    setForm({ project_id: cfg.project_id, host: cfg.host, port: cfg.port, email: cfg.email, password: '', from_name: cfg.from_name });
    setError(''); setShowModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.password && !editing) { setError('Password is required for new SMTP config.'); return; }
    setSaving(true); setError('');

    const encRes = await supabase.functions.invoke('health-encrypt', { body: { password: form.password || '___keep___' } });
    if (encRes.error) { setError('Encryption failed: ' + encRes.error.message); setSaving(false); return; }

    const payload: any = {
      project_id: form.project_id,
      host: form.host,
      port: form.port,
      email: form.email,
      from_name: form.from_name,
    };

    if (form.password) {
      payload.password_encrypted = encRes.data.encrypted;
    } else if (editing) {
      payload.password_encrypted = editing.password_encrypted;
    }

    const { error } = editing
      ? await supabase.from('health_smtp_configs').update(payload).eq('id', editing.id)
      : await supabase.from('health_smtp_configs').insert(payload);

    if (error) { setError(error.message); setSaving(false); return; }
    setSaving(false); setShowModal(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this SMTP config?')) return;
    await supabase.from('health_smtp_configs').delete().eq('id', id);
    load();
  };

  if (loading) return <div className="loading"><AppleSpinner size={20} /> Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">SMTP Configuration</h1>
          <p className="page-subtitle">Per-project email sender settings. Passwords are AES-256 encrypted.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add SMTP</button>
      </div>

      <div className="alert alert-warn" style={{ marginBottom: 20 }}>
        🔐 SMTP passwords are encrypted using AES-256 before storage. They are never stored in plaintext.
      </div>

      {configs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">✉️</div>
            <div className="empty-state-title">No SMTP configs</div>
            <div className="empty-state-text">Add an SMTP config to enable email notifications.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {configs.map(cfg => (
            <div key={cfg.id} className="card card-p" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, letterSpacing: '-0.01em' }}>{cfg.health_projects?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span>🖥️ {cfg.host}:{cfg.port}</span>
                  <span>✉️ {cfg.email}</span>
                  <span>👤 {cfg.from_name}</span>
                  <span style={{ color: 'var(--up)' }}>🔑 Encrypted</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(cfg)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(cfg.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit SMTP' : 'New SMTP Config'}</span>
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
                  <label className="form-label">SMTP Host *</label>
                  <input className="form-input" value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} placeholder="smtp.gmail.com" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Port</label>
                  <input className="form-input" type="number" value={form.port} onChange={e => setForm(f => ({ ...f, port: +e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">From Email *</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="alerts@yourapp.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">From Name</label>
                <input className="form-input" value={form.from_name} onChange={e => setForm(f => ({ ...f, from_name: e.target.value }))} placeholder="VigilNode" />
              </div>
              <div className="form-group">
                <label className="form-label">SMTP Password {editing && <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(leave blank to keep current)</span>}</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editing ? '••••••••' : 'Enter SMTP password'} style={{ paddingRight: 44 }} required={!editing} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Config'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
