import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import AppleSpinner from './components/AppleSpinner';
import PublicStatus from './pages/PublicStatus';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminProjects from './pages/AdminProjects';
import AdminEndpoints from './pages/AdminEndpoints';
import AdminSMTP from './pages/AdminSMTP';
import AdminSubscribers from './pages/AdminSubscribers';
import AdminLogs from './pages/AdminLogs';
import type { Session } from '@supabase/supabase-js';
import './App.css';

function ProtectedRoute({ session, children }: { session: Session | null; children: React.ReactNode }) {
  const isAdminDomain = window.location.hostname.startsWith('admin.');
  if (!session) return <Navigate to={isAdminDomain ? "/login" : "/admin/login"} replace />;
  return <>{children}</>;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f5f5f7',
        animation: 'fadeIn 0.4s ease',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #0071e3, #5856d6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: '#fff', fontWeight: 700,
            boxShadow: '0 8px 24px rgba(0,113,227,0.25)',
            animation: 'breathe 2s ease-in-out infinite',
          }}>⚡</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.02em', marginBottom: 4 }}>VigilNode</div>
            <div style={{ fontSize: 13, color: '#86868b', fontWeight: 400, letterSpacing: '-0.01em' }}>Loading your dashboard...</div>
          </div>
          <AppleSpinner size={24} />
        </div>
      </div>
    );
  }

  const hostname = window.location.hostname;
  const isAdminDomain = hostname.startsWith('admin.');

  return (
    <BrowserRouter>
      {isAdminDomain ? (
        <Routes>
          <Route path="/login" element={session ? <Navigate to="/" replace /> : <AdminLogin />} />
          <Route
            path="/"
            element={
              <ProtectedRoute session={session}>
                <AdminLayout session={session} />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="endpoints" element={<AdminEndpoints />} />
            <Route path="smtp" element={<AdminSMTP />} />
            <Route path="subscribers" element={<AdminSubscribers />} />
            <Route path="logs" element={<AdminLogs />} />
          </Route>
          <Route path="*" element={<Navigate to={session ? "/" : "/login"} replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<PublicStatus />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
