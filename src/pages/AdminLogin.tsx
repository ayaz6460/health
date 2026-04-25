import { useState } from 'react';
import { supabase } from '../lib/supabase';
import AppleSpinner from '../components/AppleSpinner';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@vigilnode.dev');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="card login-card">
        <div className="login-logo">
          <div className="login-logo-icon">⚡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>VigilNode</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Admin Portal</div>
          </div>
        </div>
        <div className="login-title">Welcome back</div>
        <div className="login-sub">Sign in to manage your monitoring infrastructure</div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@vigilnode.dev"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px 20px' }}>
            {loading ? <><AppleSpinner size={16} /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Default Credentials</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📧 admin@vigilnode.dev</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🔑 Admin@VigilNode2024!</div>
        </div>
      </div>
    </div>
  );
}
