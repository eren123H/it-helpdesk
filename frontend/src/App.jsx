import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './api/client';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import TicketList from './components/tickets/TicketList';
import TicketDetail from './components/tickets/TicketDetail';
import NewTicket from './components/tickets/NewTicket';
import AdminPanel from './components/admin/AdminPanel';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#8b949e' }}>Yükleniyor...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/tickets" replace />;
  return children;
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!user) return;

    // İlk yüklemede mevcut okunmamış bildirimleri getir
    api.get('/users/notifications')
      .then(res => setNotifications(res.data.notifications))
      .catch(console.error);

    let ws;
    let reconnectTimeout;
    let pingInterval;

    const connectWS = () => {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WS] Sunucuya bağlanıldı, kimlik doğrulanıyor...');
        const token = localStorage.getItem('token');
        ws.send(JSON.stringify({ type: 'auth', token }));

        // 15 saniyede bir ping atıp bağlantıyı canlı tut
        pingInterval = setInterval(() => {
          if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'ping' }));
        }, 15000);
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type !== 'pong') console.log('[WS] Mesaj alındı:', msg);

        if (msg.type === 'auth_ok') {
          console.log('[WS] Kimlik doğrulama başarılı! Gerçek zamanlı bildirimler aktif.');
        }
        if (msg.type === 'new_notification') {
          setNotifications(prev => [{
            id: Date.now(),
            ticket_id: msg.ticket_id,
            message: msg.message,
            created_at: new Date().toLocaleString('tr-TR'),
            is_read: 0,
          }, ...prev]);
        }
      };

      ws.onerror = (err) => console.error('[WS] Bağlantı hatası:', err);
      ws.onclose = () => {
        console.log('[WS] Bağlantı kapandı. 5 saniye sonra yeniden bağlanılıyor...');
        clearInterval(pingInterval);
        reconnectTimeout = setTimeout(connectWS, 5000);
      };
    };

    connectWS();

    return () => {
      clearTimeout(reconnectTimeout);
      clearInterval(pingInterval);
      if (ws) {
        ws.onclose = null; // Component unmount olurken sonsuz döngüyü engelle
        ws.close();
      }
    };
  }, [user]);

  async function markAsRead(id, ticketId) {
    try {
      await api.patch(`/users/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setShowNotifs(false);
      navigate(`/tickets/${ticketId}`);
    } catch (e) { console.error(e); }
  }

  async function markAllAsRead() {
    try {
      await api.patch('/users/notifications/read-all');
      setNotifications([]);
      setShowNotifs(false);
    } catch (e) { console.error(e); }
  }
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', roles: ['staff', 'admin'] },
    { to: '/tickets', label: 'Talepler', roles: ['user', 'staff', 'admin'] },
    { to: '/tickets/new', label: 'Yeni Talep', roles: ['user', 'staff', 'admin'] },
    { to: '/admin', label: 'Yönetim', roles: ['admin'] },
  ].filter(n => n.roles.includes(user?.role));

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={l.root}>
      <aside style={l.sidebar}>
        <div style={l.logo}>
          <div style={l.logoIcon}>🛡️</div>
          <span style={l.logoText}>IT HelpDesk</span>
        </div>

        <nav style={l.nav}>
          <div style={l.navSection}>MENÜ</div>
          {navItems.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to !== '/tickets'}
              style={({ isActive }) => ({ ...l.navBtn, ...(isActive ? l.navActive : {}) })}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div style={l.sidebarFooter}>
          <div style={l.userInfo}>
            <div style={l.userAvatar}>{user?.name?.substring(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={l.userName}>{user?.name}</div>
              <div style={l.userRole}>{user?.role}</div>
            </div>
          </div>
          <button style={l.logoutBtn} onClick={handleLogout}>Çıkış Yap</button>
        </div>
      </aside>

      <div style={l.contentWrapper}>
        <header style={l.header}>
          <div style={l.headerTitle}>Sistem Portalı</div>
          <div style={l.right}>
            <div style={l.liveDot} title="Canlı" />
            <span style={{ fontSize: '.75rem', color: '#8b949e', marginRight: 10 }}>Sistem Aktif</span>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                style={l.bellBtn}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                {notifications.length > 0 && (
                  <div style={l.bellBadge}>
                    {notifications.length}
                  </div>
                )}
              </button>
              {showNotifs && (
                <div style={l.notifPop}>
                  <div style={l.notifHead}>
                    <span style={{ fontWeight: 600 }}>Bildirimler</span>
                    {notifications.length > 0 && (
                      <button onClick={markAllAsRead} style={l.notifMarkAll}>Tümünü Okundu İşaretle</button>
                    )}
                  </div>
                  <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: '#8b949e', fontSize: '.85rem' }}>
                        Yeni bildirim yok.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} style={l.notifItem} onClick={() => markAsRead(n.id, n.ticket_id)}>
                          <div style={{ fontSize: '.85rem', color: '#e6edf3', marginBottom: 4, lineHeight: 1.4 }}>{n.message}</div>
                          <div style={{ fontSize: '.7rem', color: '#8b949e' }}>{n.created_at}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main style={l.main}>
          {children}
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />

      <Route path="/dashboard" element={
        <ProtectedRoute roles={['staff', 'admin']}>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/tickets" element={
        <ProtectedRoute>
          <Layout><TicketList /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/tickets/new" element={
        <ProtectedRoute>
          <Layout><NewTicket /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/tickets/:id" element={
        <ProtectedRoute>
          <Layout><TicketDetail /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <Layout><AdminPanel /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to={user ? (user.role === 'user' ? '/tickets' : '/dashboard') : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

const l = {
  root: { minHeight: '100vh', display: 'flex', color: '#e6edf3', fontFamily: 'Inter, sans-serif' },
  sidebar: {
    width: 260,
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.2)'
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  logoIcon: { fontSize: '1.4rem', textShadow: '0 0 10px rgba(255,255,255,0.5)' },
  logoText: { fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' },

  nav: { display: 'flex', flexDirection: 'column', padding: '24px 16px', gap: 6, flex: 1 },
  navSection: {
    fontSize: '.7rem',
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 8,
    paddingLeft: 12
  },
  navBtn: {
    padding: '10px 16px', borderRadius: '12px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '.95rem',
    fontWeight: 500, transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', display: 'flex', alignItems: 'center', gap: 12
  },
  navActive: { 
    background: 'rgba(255, 255, 255, 0.15)', 
    color: '#ffffff', 
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.1)'
  },

  sidebarFooter: {
    padding: '24px 16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
    padding: '0 8px'
  },
  userAvatar: {
    width: 36, height: 36, borderRadius: '50%', 
    background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.05))',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '.9rem', fontWeight: 700, color: '#ffffff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  },
  userName: { fontSize: '.9rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: '.75rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' },

  logoutBtn: {
    width: '100%', padding: '10px', borderRadius: '12px', 
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', cursor: 'pointer',
    fontSize: '.85rem', fontWeight: 500, transition: 'all 0.3s',
    backdropFilter: 'blur(10px)'
  },

  contentWrapper: {
    flex: 1,
    marginLeft: 260,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    position: 'relative',
    zIndex: 1
  },

  header: {
    position: 'sticky', top: 0, zIndex: 90,
    background: 'rgba(255, 255, 255, 0.03)', 
    backdropFilter: 'blur(30px) saturate(200%)',
    WebkitBackdropFilter: 'blur(30px) saturate(200%)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 32px', height: 72,
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
  },
  headerTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    color: '#ffffff',
    textShadow: '0 2px 10px rgba(0,0,0,0.2)'
  },
  right: { display: 'flex', alignItems: 'center' },
  liveDot: { width: 8, height: 8, borderRadius: '50%', background: '#00ff88', marginRight: 8, boxShadow: '0 0 10px #00ff88' },

  bellBtn: {
    background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#ffffff',
    cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center',
    padding: '8px', borderRadius: '50%',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  bellBadge: {
    position: 'absolute', top: -2, right: -2, background: '#ff3366', color: 'white',
    fontSize: '.6rem', fontWeight: 800, padding: '2px 5px', borderRadius: 10,
    border: '2px solid rgba(255,255,255,0.2)',
    boxShadow: '0 0 10px #ff3366'
  },
  notifPop: {
    position: 'absolute', top: '100%', right: 0, marginTop: 16, width: 340,
    background: 'rgba(20, 20, 30, 0.6)', 
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,0.1)', 
    overflow: 'hidden', zIndex: 200
  },
  notifHead: { padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.9rem' },
  notifMarkAll: { background: 'transparent', border: 'none', color: '#0dcaf0', fontSize: '.75rem', cursor: 'pointer', textShadow: '0 0 5px rgba(13,202,240,0.5)' },
  notifItem: { padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background .2s' },

  main: { flex: 1, padding: 40, maxWidth: 1200, margin: '0 auto', width: '100%' },
};
