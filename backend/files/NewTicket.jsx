import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Donanım', 'Yazılım', 'Ağ / İnternet', 'E-posta', 'Erişim / Şifre', 'Yazıcı', 'Diğer'];
const PRIORITIES = ['Kritik', 'Yüksek', 'Orta', 'Düşük'];
const IMPACTS    = ['Sadece ben etkileniyorum', 'Birkaç kişi etkileniyor', 'Tüm departman etkileniyor', 'Tüm şirket etkileniyor'];

const PRIORITY_INFO = {
  Kritik: { color:'#f85149', desc:'Üretimi durduran, tüm şirket etkili' },
  Yüksek: { color:'#ff7b72', desc:'Önemli iş süreçleri sekteye uğruyor' },
  Orta:   { color:'#e3b341', desc:'İş yapılabilir ama kısıtlı' },
  Düşük:  { color:'#3fb950', desc:'Küçük sorun, acil değil' },
};

export default function NewTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', category: '', priority: '', impact: IMPACTS[0], description: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500); }

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.title.trim())       e.title       = 'Başlık gerekli';
    if (!form.category)           e.category    = 'Kategori seçin';
    if (!form.priority)           e.priority    = 'Öncelik seçin';
    if (!form.description.trim()) e.description = 'Açıklama gerekli';
    if (form.description.trim().length < 20) e.description = 'En az 20 karakter girin';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/tickets', form);
      showToast(`✅ Talep oluşturuldu! #${data.ticket.ticket_no}`);
      setTimeout(() => navigate(`/tickets/${data.ticket.id}`), 1200);
    } catch (e) {
      showToast('Hata: ' + (e.response?.data?.error || 'Talep oluşturulamadı'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={s.wrapper}>
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h2 style={{ fontSize:'1.1rem', fontWeight:600 }}>➕ Yeni Destek Talebi</h2>
        <button style={s.backBtn} onClick={() => navigate('/tickets')}>← Geri</button>
      </div>

      <div style={s.card}>
        <div style={s.grid}>
          {/* Başlık */}
          <div style={{ ...s.field, gridColumn:'1/-1' }}>
            <label style={s.label}>Başlık <span style={s.req}>*</span></label>
            <input
              style={{ ...s.input, ...(errors.title ? s.inputErr : {}) }}
              placeholder="Probleminizi kısaca özetleyin..."
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
            {errors.title && <span style={s.errMsg}>{errors.title}</span>}
          </div>

          {/* Kategori */}
          <div style={s.field}>
            <label style={s.label}>Kategori <span style={s.req}>*</span></label>
            <select
              style={{ ...s.input, ...(errors.category ? s.inputErr : {}) }}
              value={form.category}
              onChange={e => set('category', e.target.value)}
            >
              <option value="">Seçiniz...</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            {errors.category && <span style={s.errMsg}>{errors.category}</span>}
          </div>

          {/* Öncelik */}
          <div style={s.field}>
            <label style={s.label}>Öncelik <span style={s.req}>*</span></label>
            <div style={s.priorityGrid}>
              {PRIORITIES.map(p => {
                const info = PRIORITY_INFO[p];
                const selected = form.priority === p;
                return (
                  <div
                    key={p}
                    style={{ ...s.priorityCard, ...(selected ? { borderColor: info.color, background:'rgba(79,142,247,.06)' } : {}) }}
                    onClick={() => set('priority', p)}
                  >
                    <span style={{ ...s.priorityLabel, color: info.color }}>{p}</span>
                    <span style={s.priorityDesc}>{info.desc}</span>
                  </div>
                );
              })}
            </div>
            {errors.priority && <span style={s.errMsg}>{errors.priority}</span>}
          </div>

          {/* Etki */}
          <div style={s.field}>
            <label style={s.label}>Etki Alanı</label>
            <select style={s.input} value={form.impact} onChange={e => set('impact', e.target.value)}>
              {IMPACTS.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>

          {/* Açıklama */}
          <div style={{ ...s.field, gridColumn:'1/-1' }}>
            <label style={s.label}>Açıklama <span style={s.req}>*</span></label>
            <textarea
              style={{ ...s.input, ...(errors.description ? s.inputErr : {}), minHeight:140, resize:'vertical' }}
              placeholder="Probleminizi detaylıca açıklayın. Ne zaman başladı? Hangi hata mesajı alıyorsunuz? Daha önce çalışıyor muydu?"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              {errors.description && <span style={s.errMsg}>{errors.description}</span>}
              <span style={{ ...s.errMsg, color:'#8b949e', marginLeft:'auto' }}>{form.description.length} karakter</span>
            </div>
          </div>

          {/* Kullanıcı bilgisi (readonly) */}
          <div style={s.field}>
            <label style={s.label}>Talep Eden</label>
            <input style={{ ...s.input, opacity:.6 }} value={user.name} readOnly />
          </div>
          <div style={s.field}>
            <label style={s.label}>Departman</label>
            <input style={{ ...s.input, opacity:.6 }} value={user.department || '—'} readOnly />
          </div>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:28 }}>
          <button
            style={{ ...s.primaryBtn, opacity: submitting ? 0.7 : 1 }}
            onClick={submit} disabled={submitting}>
            {submitting ? '⏳ Gönderiliyor...' : '🚀 Talebi Gönder'}
          </button>
          <button style={s.ghostBtn} onClick={() => navigate('/tickets')}>İptal</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrapper: { maxWidth:860, margin:'0 auto' },
  card: { background:'#161b22', border:'1px solid #30363d', borderRadius:14, padding:'28px 32px' },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  field: { display:'flex', flexDirection:'column', gap:6 },
  label: { fontSize:'.8rem', fontWeight:600, color:'#8b949e', textTransform:'uppercase', letterSpacing:'.05em' },
  req: { color:'#f85149' },
  input: {
    background:'#1e2531', border:'1px solid #30363d', borderRadius:9,
    padding:'10px 14px', color:'#e6edf3', fontSize:'.9rem',
    fontFamily:'inherit', outline:'none', transition:'border-color .2s',
  },
  inputErr: { borderColor:'#f85149' },
  errMsg: { fontSize:'.75rem', color:'#f85149', marginTop:2 },
  priorityGrid: { display:'flex', flexDirection:'column', gap:6 },
  priorityCard: {
    background:'#1e2531', border:'1px solid #30363d', borderRadius:8,
    padding:'8px 12px', cursor:'pointer', transition:'all .15s',
  },
  priorityLabel: { fontSize:'.82rem', fontWeight:700, display:'block' },
  priorityDesc: { fontSize:'.72rem', color:'#8b949e' },
  primaryBtn: {
    background:'linear-gradient(135deg,#4f8ef7,#7c5af5)', color:'#fff',
    border:'none', borderRadius:9, padding:'11px 24px', fontSize:'.9rem', fontWeight:600, cursor:'pointer',
  },
  ghostBtn: {
    background:'#1e2531', border:'1px solid #30363d', borderRadius:9,
    color:'#e6edf3', padding:'11px 20px', fontSize:'.9rem', cursor:'pointer',
  },
  backBtn: {
    background:'#1e2531', border:'1px solid #30363d', borderRadius:8,
    color:'#8b949e', padding:'6px 14px', fontSize:'.82rem', cursor:'pointer',
  },
  toast: {
    position:'fixed', bottom:24, right:24, zIndex:999,
    background:'#1e2531', border:'1px solid #30363d', borderRadius:12,
    padding:'12px 20px', fontSize:'.85rem', boxShadow:'0 8px 32px rgba(0,0,0,.4)',
  },
};
