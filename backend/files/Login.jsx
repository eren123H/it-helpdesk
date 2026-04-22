import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'user' ? '/tickets' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🛡️</span>
          <span style={styles.logoText}>IT HelpDesk</span>
        </div>
        <p style={styles.subtitle}>Şirket içi destek sistemi</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>E-posta</label>
            <input
              style={styles.input}
              type="email" value={email} autoComplete="email"
              placeholder="kullanici@sirket.local"
              onChange={e => setEmail(e.target.value)} required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Şifre</label>
            <input
              style={styles.input}
              type="password" value={password} autoComplete="current-password"
              placeholder="••••••••"
              onChange={e => setPassword(e.target.value)} required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', background: '#0d1117',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  card: {
    background: '#161b22', border: '1px solid #30363d', borderRadius: 18,
    padding: '40px 36px', width: '100%', maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,.5)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  logoIcon: { fontSize: 32 },
  logoText: { fontSize: '1.5rem', fontWeight: 700, color: '#e6edf3' },
  subtitle: { color: '#8b949e', fontSize: '.9rem', marginBottom: 32 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '.8rem', fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '.05em' },
  input: {
    background: '#1e2531', border: '1px solid #30363d', borderRadius: 9,
    padding: '11px 14px', color: '#e6edf3', fontSize: '.9rem',
    fontFamily: 'inherit', outline: 'none',
  },
  btn: {
    background: 'linear-gradient(135deg,#4f8ef7,#7c5af5)',
    color: '#fff', border: 'none', borderRadius: 9,
    padding: '12px', fontSize: '.95rem', fontWeight: 600,
    cursor: 'pointer', marginTop: 4,
  },
  error: {
    background: 'rgba(248,81,73,.15)', border: '1px solid rgba(248,81,73,.4)',
    borderRadius: 8, padding: '10px 14px', color: '#f85149', fontSize: '.85rem',
  },
  hint: {
    marginTop: 24, padding: '12px 16px', background: '#1e2531',
    border: '1px solid #30363d', borderRadius: 9,
    fontSize: '.78rem', color: '#8b949e', lineHeight: 1.8,
  },
};
