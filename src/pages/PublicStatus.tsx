import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AppleSpinner from '../components/AppleSpinner';
import type { Project, Endpoint, HealthLog } from '../types';

interface ProjectWithStatus extends Project {
  endpoints: (Endpoint & { latestLog: HealthLog | null; uptime: number })[];
}

export default function PublicStatus() {
  const [projects, setProjects] = useState<ProjectWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribeForms, setSubscribeForms] = useState<Record<string, string>>({});
  const [subscribeStatus, setSubscribeStatus] = useState<Record<string, string>>({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    const since30d = new Date(Date.now() - 86400000 * 30).toISOString();
    const [{ data: projs }, { data: eps }] = await Promise.all([
      supabase.from('health_projects').select('*').eq('public_visible', true).order('name'),
      supabase.from('health_endpoints').select('*').eq('is_active', true),
    ]);

    const projectsWithStatus: ProjectWithStatus[] = await Promise.all(
      (projs || []).map(async (proj) => {
        const projEndpoints = (eps || []).filter(e => e.project_id === proj.id);
        const endpointsWithStatus = await Promise.all(
          projEndpoints.map(async (ep) => {
            const [{ data: latest }, { data: logs30d }] = await Promise.all([
              supabase.from('health_logs').select('*').eq('endpoint_id', ep.id).order('checked_at', { ascending: false }).limit(1),
              supabase.from('health_logs').select('status').eq('endpoint_id', ep.id).gte('checked_at', since30d),
            ]);
            const upCount = (logs30d || []).filter(l => l.status === 'UP').length;
            const total = (logs30d || []).length || 1;
            return { ...ep, latestLog: latest?.[0] || null, uptime: Math.round((upCount / total) * 10000) / 100 };
          })
        );
        return { ...proj, endpoints: endpointsWithStatus };
      })
    );

    setProjects(projectsWithStatus);
    setLoading(false);
  };

  const globalUp = projects.every(p => p.endpoints.every(e => !e.latestLog || e.latestLog.status === 'UP'));

  const subscribe = async (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    const email = subscribeForms[projectId];
    if (!email) return;
    const { error } = await supabase.from('health_subscribers').insert({ project_id: projectId, email });
    setSubscribeStatus(s => ({ ...s, [projectId]: error ? `Error: ${error.message}` : 'subscribed' }));
    if (!error) setSubscribeForms(f => ({ ...f, [projectId]: '' }));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
          <AppleSpinner size={24} />
          <span style={{ fontSize: 14 }}>Loading status...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* Navigation */}
      <nav style={{
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700
            }}>⚡</div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>VigilNode</span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, fontWeight: 500 }}>
            <a href="#" style={{ color: 'var(--accent)' }}>Status</a>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Global Status */}
        <section style={{ marginBottom: 40 }}>
          <div className="card" style={{
            padding: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            borderLeft: `4px solid ${globalUp ? 'var(--up)' : 'var(--down)'}`,
          }}>
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              background: globalUp ? 'var(--up)' : 'var(--down)',
              boxShadow: globalUp ? '0 0 8px rgba(52,199,89,0.4)' : '0 0 8px rgba(255,59,48,0.4)',
              flexShrink: 0,
            }} />
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 2 }}>
                {globalUp ? 'All Systems Operational' : 'Partial System Outage'}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Last updated {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </section>

        {/* Projects */}
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 16 }}>
            Services
          </h2>

          {projects.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📡</div>
                <div className="empty-state-title">No public services configured</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {projects.map(proj => {
                const projDown = proj.endpoints.some(e => e.latestLog?.status === 'DOWN');
                const avgUptime = proj.endpoints.length > 0
                  ? Math.round(proj.endpoints.reduce((a, e) => a + e.uptime, 0) / proj.endpoints.length * 100) / 100
                  : 100;

                return (
                  <div key={proj.id} className="card" style={{ overflow: 'hidden' }}>
                    {/* Project header */}
                    <div style={{
                      padding: '20px 24px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-tertiary)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>{proj.name}</h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{avgUptime}% uptime</span>
                        <span className={`badge ${projDown ? 'badge-down' : 'badge-up'}`} style={{ fontSize: 11 }}>
                          {projDown ? 'Degraded' : 'Operational'}
                        </span>
                      </div>
                    </div>

                    {/* Endpoints */}
                    {proj.endpoints.length === 0 ? (
                      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                        No services in this project
                      </div>
                    ) : (
                      proj.endpoints.map(ep => {
                        const isUp = !ep.latestLog || ep.latestLog.status === 'UP';
                        return (
                          <div key={ep.id} style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 16,
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{
                                  fontSize: 10, fontWeight: 600, padding: '1px 6px',
                                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                  borderRadius: 4, color: 'var(--text-muted)',
                                }}>{ep.method}</span>
                                <code style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{ep.path}</code>
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ep.name || 'Service Endpoint'}</div>
                            </div>

                            {/* Mini uptime bar */}
                            <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 24, width: 120, flexShrink: 0 }}>
                              {Array.from({ length: 30 }, (_, i) => {
                                const dayUp = i < Math.round(ep.uptime / 100 * 30);
                                return (
                                  <div
                                    key={i}
                                    style={{
                                      flex: 1,
                                      height: dayUp ? '100%' : '50%',
                                      background: dayUp ? 'var(--up)' : 'var(--down)',
                                      borderRadius: '1px',
                                      opacity: dayUp ? 0.5 : 0.6,
                                    }}
                                  />
                                );
                              })}
                            </div>

                            <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                              <div style={{
                                fontSize: 16, fontWeight: 600,
                                color: isUp ? 'var(--up)' : 'var(--down)',
                              }}>
                                {ep.latestLog?.response_time ? `${ep.latestLog.response_time}ms` : '--'}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {isUp ? 'response' : 'failing'}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Subscribe */}
                    <div style={{ padding: '16px 24px', background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border)' }}>
                      {subscribeStatus[proj.id] === 'subscribed' ? (
                        <div style={{ color: 'var(--up)', fontSize: 13, fontWeight: 500, textAlign: 'center' }}>
                          ✓ You're subscribed to updates for {proj.name}
                        </div>
                      ) : (
                        <form onSubmit={e => subscribe(e, proj.id)} style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="email"
                            placeholder="Get notified — enter your email"
                            value={subscribeForms[proj.id] || ''}
                            onChange={e => setSubscribeForms(f => ({ ...f, [proj.id]: e.target.value }))}
                            required
                            style={{
                              flex: 1, padding: '8px 14px', fontSize: 13,
                              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                              background: '#fff', color: 'var(--text-primary)',
                              outline: 'none',
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                          />
                          <button type="submit" className="btn btn-primary btn-sm">Subscribe</button>
                        </form>
                      )}
                      {subscribeStatus[proj.id] && subscribeStatus[proj.id] !== 'subscribed' && (
                        <div style={{ color: 'var(--down)', fontSize: 12, marginTop: 6 }}>{subscribeStatus[proj.id]}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '32px 24px',
        textAlign: 'center',
        background: '#fff',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.01em' }}>
            VigilNode
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16, fontSize: 13 }}>
            <a href="#" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }}>Status</a>
            <a href="#" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }}>Documentation</a>
            <a href="#" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }}>Privacy</a>
            <a href="#" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }}>Security</a>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
            Developed By Mohammed Ayaz<br />
            Copyright © Iamayaz.me All Rights Reserved
          </div>
        </div>
      </footer>
    </div>
  );
}
