import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login       from './components/Login';
import Dashboard   from './components/Dashboard';
import TicketList  from './components/TicketList';
import TicketDetail from './components/TicketDetail';
import NewTicket   from './components/NewTicket';
import AdminPanel  from './components/AdminPanel';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#8b949e' }}>Yükleniyor...</div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/tickets" replace />;
  return children;
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to:'/dashboard', label:'📊 Dashboard', roles:['staff','admin'] },
    { to:'/tickets',   label:'🎫 Talepler',  roles:['user','staff','admin'] },
    { to:'/tickets/new', label:'➕ Yeni Talep', roles:['user','staff','admin'] },
    { to:'/admin',     label:'⚙️ Yönetim',   roles:['admin'] },
  ].filter(n => n.roles.includes(user?.role));

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={l.root}>
      <header style={l.header}>
        <div style={l.logo}>
          <div style={l.logoIcon}>🛡️</div>
          <span style={l.logoText}>IT HelpDesk</span>
        </div>
        <nav style={l.nav}>
          {navItems.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to !== '/tickets'}
              style={({ isActive }) => ({ ...l.navBtn, ...(isActive ? l.navActive : {}) })}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div style={l.right}>
          <div style={l.liveDot} title="Canlı" />
          <span style={{ fontSize:'.75rem', color:'#8b949e' }}>Canlı</span>
          <div style={{ ...l.avatar, cursor:'default' }} title={`${user?.name} (${user?.role})`}>
            {user?.name?.split(' ').map(w => w[0]).join('').slice(0,2)}
          </div>
          <span style={{ fontSize:'.82rem', color:'#8b949e', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user?.name}
          </span>
          <button style={l.logoutBtn} onClick={handleLogout}>Çıkış</button>
        </div>
      </header>
      <main style={l.main}>{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'user' ? '/tickets' : '/dashboard'} /> : <Login />} />

      <Route path="/dashboard" element={
        <ProtectedRoute roles={['staff','admin']}>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      }/>
      <Route path="/tickets" element={
        <ProtectedRoute>
          <Layout><TicketList /></Layout>
        </ProtectedRoute>
      }/>
      <Route path="/tickets/new" element={
        <ProtectedRoute>
          <Layout><NewTicket /></Layout>
        </ProtectedRoute>
      }/>
      <Route path="/tickets/:id" element={
        <ProtectedRoute>
          <Layout><TicketDetail /></Layout>
        </ProtectedRoute>
      }/>
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <Layout><AdminPanel /></Layout>
        </ProtectedRoute>
      }/>

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
  root: { minHeight:'100vh', display:'flex', flexDirection:'column', background:'#0d1117', color:'#e6edf3', fontFamily:'Inter, sans-serif' },
  header: {
    position:'sticky', top:0, zIndex:100,
    background:'rgba(13,17,23,.88)', backdropFilter:'blur(16px)',
    borderBottom:'1px solid #30363d',
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'0 32px', height:64, gap:16,
  },
  logo: { display:'flex', alignItems:'center', gap:10, flexShrink:0 },
  logoIcon: { fontSize:'1.3rem' },
  logoText: { fontSize:'1.1rem', fontWeight:700, whiteSpace:'nowrap' },
  nav: { display:'flex', gap:4, flex:1, justifyContent:'center' },
  navBtn: {
    background:'transparent', border:'none',
    color:'#8b949e', padding:'7px 14px', borderRadius:8,
    fontSize:'.875rem', fontWeight:500, cursor:'pointer',
    textDecoration:'none', transition:'all .2s', display:'inline-flex', alignItems:'center',
  },
  navActive: { color:'#e6edf3', background:'#1e2531' },
  right: { display:'flex', alignItems:'center', gap:10, flexShrink:0 },
  liveDot: { width:7, height:7, borderRadius:'50%', background:'#3fb950', animation:'pulse 2s infinite' },
  avatar: {
    width:32, height:32, borderRadius:'50%',
    background:'linear-gradient(135deg,#f85149,#e3b341)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:700, fontSize:'.75rem',
  },
  logoutBtn: {
    background:'transparent', border:'1px solid #30363d', borderRadius:7,
    color:'#8b949e', padding:'5px 12px', fontSize:'.78rem', cursor:'pointer',
  },
  main: { flex:1, padding:'32px', maxWidth:1280, width:'100%', margin:'0 auto' },
};
