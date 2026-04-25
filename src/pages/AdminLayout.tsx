import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import MotionDiv from '../components/MotionDiv';

const NAV = [
  { to: '', label: 'Overview', icon: '📊', end: true },
  { to: 'projects', label: 'Projects', icon: '📁' },
  { to: 'endpoints', label: 'Endpoints', icon: '🔗' },
  { to: 'logs', label: 'Logs & Analytics', icon: '📈' },
  { to: 'smtp', label: 'SMTP Config', icon: '✉️' },
  { to: 'subscribers', label: 'Subscribers', icon: '👥' },
];

export default function AdminLayout({ session }: { session: Session | null }) {
  const navigate = useNavigate();
  const isAdminDomain = window.location.hostname.startsWith('admin.');
  const basePath = isAdminDomain ? '/' : '/admin/';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(isAdminDomain ? '/login' : '/admin/login');
  };

  return (
    <div className="admin-layout">
      <MotionDiv
        className="sidebar"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      >
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon animate-[float_3s_ease-in-out_infinite]">⚡</div>
          <div>
            <div className="sidebar-logo-text">VigilNode</div>
            <div className="sidebar-logo-sub">Monitoring</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink
              key={label}
              to={`${basePath}${to}`}
              end={end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            Signed in as<br />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{session?.user?.email}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
            Sign Out
          </button>
        </div>
      </MotionDiv>

      <main className="admin-main">
        <MotionDiv
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          <Outlet />
        </MotionDiv>
      </main>
    </div>
  );
}
