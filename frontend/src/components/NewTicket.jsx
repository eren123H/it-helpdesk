import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Plus, ArrowLeft, Paperclip, Send, Folder, Laptop, Globe, Mail, ShieldCheck, Printer, HelpCircle } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'Donanım', label: 'Donanım', icon: <Laptop size={18} /> },
  { id: 'Yazılım', label: 'Yazılım', icon: <Folder size={18} /> },
  { id: 'Ağ / İnternet', label: 'Ağ / İnternet', icon: <Globe size={18} /> },
  { id: 'E-posta', label: 'E-posta', icon: <Mail size={18} /> },
  { id: 'Erişim / Şifre', label: 'Erişim / Şifre', icon: <ShieldCheck size={18} /> },
  { id: 'Yazıcı', label: 'Yazıcı', icon: <Printer size={18} /> },
  { id: 'Diğer', label: 'Diğer', icon: <HelpCircle size={18} /> },
];

const IMPACTS = [
  { id: 'Sadece ben etkileniyorum', label: 'Bireysel', sub: 'Sadece benim çalışmamı engelliyor' },
  { id: 'Birkaç kişi etkileniyor', label: 'Grup', sub: 'Ekibimdeki birkaç kişiyi etkiliyor' },
  { id: 'Tüm departman etkileniyor', label: 'Departman', sub: 'Tüm departman iş yapamaz durumda' },
  { id: 'Tüm şirket etkileniyor', label: 'Genel', sub: 'Şirket genelinde kritik bir kesinti' },
];

const IMPACT_TO_PRIORITY = {
  'Sadece ben etkileniyorum': 'Düşük',
  'Birkaç kişi etkileniyor': 'Orta',
  'Tüm departman etkileniyor': 'Yüksek',
  'Tüm şirket etkileniyor': 'Kritik',
};

const PRIORITY_INFO = {
  Kritik: { color: '#f85149', icon: <AlertTriangle size={24} />, label: 'Kritik', desc: 'Acil müdahale gerektiren, iş durdurucu sorun.' },
  Yüksek: { color: '#ff7b72', icon: <AlertCircle size={24} />, label: 'Yüksek', desc: 'İş süreçlerini önemli ölçüde aksatan sorun.' },
  Orta: { color: '#e3b341', icon: <Info size={24} />, label: 'Orta', desc: 'Çalışmayı kısıtlayan ancak engel olmayan durum.' },
  Düşük: { color: '#3fb950', icon: <CheckCircle2 size={24} />, label: 'Düşük', desc: 'Küçük aksaklık veya rutin talepler.' },
};

export default function NewTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', category: '', impact: IMPACTS[0].id, description: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [file, setFile] = useState(null);

  const autoPriority = IMPACT_TO_PRIORITY[form.impact] || 'Orta';
  const p = PRIORITY_INFO[autoPriority];

  const set = (fld, val) => {
    setForm(prev => ({ ...prev, [fld]: val }));
    if (errors[fld]) setErrors(prev => ({ ...prev, [fld]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Başlık zorunludur';
    if (!form.category) e.category = 'Kategori seçilmelidir';
    if (!form.description.trim()) e.description = 'Açıklama zorunludur';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/tickets', { ...form, priority: autoPriority });
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        await api.post(`/tickets/${data.ticket.id}/attachments`, fd);
      }
      setToast('Talep başarıyla oluşturuldu!');
      setTimeout(() => navigate(`/tickets/${data.ticket.id}`), 1500);
    } catch (err) {
      setToast('Hata: ' + (err.response?.data?.error || 'İşlem başarısız'));
    } finally { setSubmitting(false); }
  };

  return (
    <div style={s.wrapper}>
      {toast && <div style={s.toast}>{toast}</div>}
      
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/tickets')}>
          <ArrowLeft size={16} /> Geri Dön
        </button>
        <h2 style={s.pageTitle}>Yeni Destek Talebi</h2>
      </div>

      <div style={s.layout}>
        {/* Form Column */}
        <div style={s.formSection}>
          <div style={s.field}>
            <label style={s.label}>Konu Başlığı</label>
            <input 
              style={{ ...s.input, ...(errors.title ? s.inputErr : {}) }} 
              placeholder="Sorunu kısaca özetleyin..." 
              value={form.title} 
              onChange={e => set('title', e.target.value)}
            />
            {errors.title && <span style={s.err}>{errors.title}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>Kategori</label>
            <div style={s.catGrid}>
              {CATEGORIES.map(c => (
                <button 
                  key={c.id} 
                  style={{ ...s.catItem, ...(form.category === c.id ? s.catActive : {}) }}
                  onClick={() => set('category', c.id)}
                >
                  {c.icon}
                  <span style={{ fontSize: '.75rem' }}>{c.label}</span>
                </button>
              ))}
            </div>
            {errors.category && <span style={s.err}>{errors.category}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>Açıklama</label>
            <textarea 
              style={{ ...s.input, ...s.textarea, ...(errors.description ? s.inputErr : {}) }} 
              placeholder="Detaylı bilgi verin..." 
              value={form.description} 
              onChange={e => set('description', e.target.value)}
            />
            {errors.description && <span style={s.err}>{errors.description}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>Dosya Ekle</label>
            <div style={s.uploadArea}>
              <input type="file" id="f" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
              <button style={s.uploadBtn} onClick={() => document.getElementById('f').click()}>
                <Paperclip size={18} /> {file ? file.name : 'Dosya Seç (Görsel, PDF...)'}
              </button>
              {file && <button style={s.clearBtn} onClick={() => setFile(null)}>Kaldır</button>}
            </div>
          </div>
        </div>

        {/* Impact & Priority Column */}
        <div style={s.sideSection}>
          <div style={s.sideCard}>
            <label style={s.label}>Etki Seviyesi</label>
            <div style={s.impactList}>
              {IMPACTS.map(im => (
                <button 
                  key={im.id} 
                  style={{ ...s.impactBtn, ...(form.impact === im.id ? s.impactActive : {}) }}
                  onClick={() => set('impact', im.id)}
                >
                  <div style={s.impactLabel}>{im.label}</div>
                  <div style={s.impactSub}>{im.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...s.sideCard, border: `1px solid ${p.color}33`, background: `${p.color}08` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ color: p.color }}>{p.icon}</div>
              <div>
                <div style={s.label}>Tahmini Öncelik</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: p.color }}>{p.label}</div>
              </div>
            </div>
            <p style={{ fontSize: '.8rem', color: '#8b949e', margin: 0, lineHeight: 1.5 }}>{p.desc}</p>
          </div>

          <button style={{ ...s.submitBtn, opacity: submitting ? 0.7 : 1 }} onClick={submit} disabled={submitting}>
            <Send size={18} /> {submitting ? 'Gönderiliyor...' : 'Talebi Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrapper: { maxWidth: 1000, margin: '0 auto', paddingBottom: 40 },
  header: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 },
  backBtn: { background: '#1e2531', border: '1px solid #30363d', color: '#8b949e', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem' },
  pageTitle: { fontSize: '1.5rem', fontWeight: 700, color: '#e6edf3', margin: 0 },
  layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' },
  formSection: { background: '#161b22', border: '1px solid #30363d', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 },
  sideSection: { display: 'flex', flexDirection: 'column', gap: 16 },
  sideCard: { background: '#161b22', border: '1px solid #30363d', borderRadius: 16, padding: 24 },
  field: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: '.75rem', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '.05em' },
  input: { background: '#0d1117', border: '1px solid #30363d', borderRadius: 12, padding: '14px 18px', color: '#e6edf3', fontSize: '.95rem', outline: 'none', transition: 'all .2s' },
  textarea: { minHeight: 120, resize: 'vertical' },
  inputErr: { borderColor: '#f85149' },
  err: { fontSize: '.75rem', color: '#f85149' },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 },
  catItem: { background: '#0d1117', border: '1px solid #30363d', borderRadius: 12, padding: '12px', color: '#8b949e', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all .2s' },
  catActive: { borderColor: '#4f8ef7', background: 'rgba(79,142,247,0.1)', color: '#4f8ef7' },
  impactList: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 },
  impactBtn: { background: '#0d1117', border: '1px solid #30363d', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all .2s' },
  impactActive: { borderColor: '#4f8ef7', background: 'rgba(79,142,247,0.1)' },
  impactLabel: { fontSize: '.9rem', fontWeight: 700, color: '#e6edf3' },
  impactSub: { fontSize: '.7rem', color: '#8b949e', marginTop: 2 },
  uploadArea: { display: 'flex', gap: 10 },
  uploadBtn: { flex: 1, background: '#0d1117', border: '1px dashed #30363d', borderRadius: 12, padding: '12px', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: '.9rem' },
  clearBtn: { background: 'transparent', border: 'none', color: '#f85149', fontSize: '.85rem', cursor: 'pointer' },
  submitBtn: { background: 'linear-gradient(135deg,#4f8ef7,#7c5af5)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 24px rgba(79,142,247,0.2)' },
  toast: { position: 'fixed', top: 24, right: 24, background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 24px', color: '#e6edf3', fontSize: '.9rem', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 1000 },
};
