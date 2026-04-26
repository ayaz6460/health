import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdminDomain = window.location.hostname.startsWith('admin.');
  const basePath = isAdminDomain ? '/' : '/admin/';

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(isAdminDomain ? '/login' : '/admin/login');
  };

  const currentPage = NAV.find(n =>
    n.end
      ? location.pathname === basePath || location.pathname === basePath.slice(0, -1)
      : location.pathname.includes(n.to)
  );

  return (
    <div className="admin-layout">
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <div className="mobile-topbar-brand">
          <span>⚡</span>
          <span>VigilNode</span>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentPage?.label || ''}
        </span>
      </div>

      {/* Overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <MotionDiv
        className={`sidebar${sidebarOpen ? ' open' : ''}`}
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
              <span>{label}</span>
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
