import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield } from 'lucide-react';

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
          <Shield size={32} color="#4f8ef7" />
          <span style={styles.logoText}>IT HelpDesk</span>
        </div>
        <p style={styles.subtitle}>**EREN UÇAR**
        </p>

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
    minHeight: '100vh', background: 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  card: {
    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 24,
    padding: '40px 36px', width: '100%', maxWidth: 420,
    backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)',
    boxShadow: '0 20px 60px rgba(0,0,0,.4), inset 0 1px 1px rgba(255,255,255,0.2)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  logoIcon: { fontSize: 32 },
  logoText: { fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' },
  subtitle: { color: 'rgba(255, 255, 255, 0.7)', fontSize: '.9rem', marginBottom: 32 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '.05em' },
  input: {
    background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 12,
    padding: '12px 16px', color: '#ffffff', fontSize: '.95rem',
    fontFamily: 'inherit', outline: 'none', transition: 'all 0.3s',
    backdropFilter: 'blur(10px)',
  },
  btn: {
    background: 'linear-gradient(135deg, #0dcaf0, #048a9f)',
    color: '#fff', border: 'none', borderRadius: 12,
    padding: '14px', fontSize: '.95rem', fontWeight: 700,
    cursor: 'pointer', marginTop: 8, transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(13, 202, 240, 0.3)',
  },
  error: {
    background: 'rgba(248,81,73,.15)', border: '1px solid rgba(248,81,73,.4)',
    borderRadius: 8, padding: '10px 14px', color: '#ff6b6b', fontSize: '.85rem',
  },
  hint: {
    marginTop: 24, padding: '12px 16px', background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12,
    fontSize: '.78rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.8,
  },
};
