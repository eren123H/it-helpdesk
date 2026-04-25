import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Donanım', 'Yazılım', 'Ağ / İnternet', 'E-posta', 'Erişim / Şifre', 'Yazıcı', 'Diğer'];

const IMPACTS = [
  'Sadece ben etkileniyorum',
  'Birkaç kişi etkileniyor',
  'Tüm departman etkileniyor',
  'Tüm şirket etkileniyor',
];

// Etki alanına göre otomatik öncelik
const IMPACT_TO_PRIORITY = {
  'Sadece ben etkileniyorum': 'Düşük',
  'Birkaç kişi etkileniyor': 'Orta',
  'Tüm departman etkileniyor': 'Yüksek',
  'Tüm şirket etkileniyor': 'Yüksek',
};

const PRIORITY_INFO = {
  Kritik: { color: '#f85149', icon: '🔥', desc: 'Tüm şirket durdu — acil müdahale gerekiyor' },
  Yüksek: { color: '#ff7b72', icon: '⚠️', desc: 'Önemli iş süreçleri sekteye uğruyor' },
  Orta: { color: '#e3b341', icon: '📋', desc: 'İş yapılabilir ama kısıtlı' },
  Düşük: { color: '#3fb950', icon: '🟢', desc: 'Küçük sorun, acil değil' },
};

export default function NewTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const defaultImpact = IMPACTS[0];

  const [form, setForm] = useState({
    title: '', category: '', impact: defaultImpact, description: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [file, setFile] = useState(null);
  const [fileErr, setFileErr] = useState('');

  // Öncelik otomatik hesaplanır — kullanıcı seçemez
  const autoPriority = IMPACT_TO_PRIORITY[form.impact] || 'Orta';
  const priorityInfo = PRIORITY_INFO[autoPriority];

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500); }

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Başlık gerekli';
    if (!form.category) e.category = 'Kategori seçin';
    if (!form.description.trim()) e.description = 'Açıklama gerekli';
    if (form.description.trim().length < 20) e.description = 'En az 20 karakter girin';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'text/plain', 'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) { setFile(null); setFileErr(''); return; }
    if (f.size > 1 * 1024 * 1024) { setFileErr('Dosya 1 MB\'yı aşamaz'); setFile(null); return; }
    if (!ALLOWED_TYPES.includes(f.type)) { setFileErr('Desteklenmeyen tür. İzin verilenler: Görsel, PDF, TXT, DOCX'); setFile(null); return; }
    setFile(f); setFileErr('');
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = { ...form, priority: autoPriority };
      const { data } = await api.post('/tickets', payload);

      // Dosya seçildiyse sonra yükle
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        await api.post(`/tickets/${data.ticket.id}/attachments`, fd).catch(err => {
          console.error("Dosya yükleme hatası:", err.message);
        });
      }

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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>➕ Yeni Destek Talebi</h2>
        <button style={s.backBtn} onClick={() => navigate('/tickets')}>← Geri</button>
      </div>

      <div style={s.card}>
        <div style={s.grid}>
          {/* Başlık */}
          <div style={{ ...s.field, gridColumn: '1/-1' }}>
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
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <span style={s.errMsg}>{errors.category}</span>}
          </div>

          {/* Etki Alanı → Önceligi belirler */}
          <div style={s.field}>
            <label style={s.label}>Kaç Kişi Etkileniyor? <span style={s.req}>*</span></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {IMPACTS.map(imp => {
                const selected = form.impact === imp;
                const p = IMPACT_TO_PRIORITY[imp];
                const c = PRIORITY_INFO[p].color;
                return (
                  <div
                    key={imp}
                    style={{
                      ...s.impactCard,
                      ...(selected ? { borderColor: c, background: `${c}11` } : {}),
                    }}
                    onClick={() => set('impact', imp)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '.87rem', fontWeight: selected ? 600 : 400 }}>{imp}</span>
                      <span style={{
                        fontSize: '.7rem', fontWeight: 600, color: c,
                        background: `${c}22`, borderRadius: 20, padding: '2px 8px'
                      }}>
                        {PRIORITY_INFO[p].icon} {p}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Otomatik belirlenen öncelik — bilgi kutusu */}
          <div style={s.field}>
            <label style={s.label}>Belirlenen Öncelik</label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: `${priorityInfo.color}11`,
              border: `1px solid ${priorityInfo.color}44`,
              borderRadius: 9, padding: '12px 16px',
            }}>
              <span style={{ fontSize: '1.4rem' }}>{priorityInfo.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: priorityInfo.color, fontSize: '.9rem' }}>{autoPriority}</div>
                <div style={{ fontSize: '.75rem', color: '#8b949e', marginTop: 2 }}>{priorityInfo.desc}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '.7rem', color: '#8b949e', textAlign: 'right' }}>
                Etki alanınıza göre<br />otomatik belirlendi
              </span>
            </div>
          </div>

          {/* Açıklama */}
          <div style={{ ...s.field, gridColumn: '1/-1' }}>
            <label style={s.label}>Açıklama <span style={s.req}>*</span></label>
            <textarea
              style={{ ...s.input, ...(errors.description ? s.inputErr : {}), minHeight: 140, resize: 'vertical' }}
              placeholder="Probleminizi detaylıca açıklayın. Ne zaman başladı? Hangi hata mesajı alıyorsunuz? Daha önce çalışıyor muydu?"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {errors.description && <span style={s.errMsg}>{errors.description}</span>}
              <span style={{ ...s.errMsg, color: '#8b949e', marginLeft: 'auto' }}>{form.description.length} karakter</span>
            </div>
          </div>

          {/* Kullanıcı bilgisi (readonly) */}
          <div style={s.field}>
            <label style={s.label}>Talep Eden</label>
            <input style={{ ...s.input, opacity: .6 }} value={user.name} readOnly />
          </div>
          <div style={s.field}>
            <label style={s.label}>Departman</label>
            <input style={{ ...s.input, opacity: .6 }} value={user.department || '—'} readOnly />
          </div>

          {/* Dosya ekleme */}
          <div style={{ ...s.field, gridColumn: '1/-1' }}>
            <label style={s.label}>Dosya Ekle <span style={{ color: '#8b949e', fontWeight: 400, textTransform: 'none', fontSize: '.72rem' }}>(isteğe bağlı, max 1 MB)</span></label>
            <div
              style={{
                background: '#1e2531', border: `2px dashed ${fileErr ? '#f85149' : file ? '#4f8ef7' : '#30363d'}`,
                borderRadius: 9, padding: '16px', display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', transition: 'border-color .2s',
              }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <span style={{ fontSize: '1.4rem' }}>{file ? '📎' : '📂'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {file ? (
                  <>
                    <div style={{ fontSize: '.88rem', fontWeight: 600, color: '#4f8ef7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                    <div style={{ fontSize: '.73rem', color: '#8b949e', marginTop: 2 }}>{(file.size / 1024).toFixed(1)} KB</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '.88rem', color: '#8b949e' }}>Tıklayarak dosya seçin</div>
                    <div style={{ fontSize: '.72rem', color: '#8b949e', marginTop: 2 }}>Görsel (JPG, PNG, GIF) · PDF · TXT · DOCX</div>
                  </>
                )}
              </div>
              {file && (
                <button
                  onClick={e => { e.stopPropagation(); setFile(null); setFileErr(''); }}
                  style={{ background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer', fontSize: '1.1rem', padding: 4 }}
                >✕</button>
              )}
            </div>
            <input
              id="file-input" type="file" style={{ display: 'none' }}
              accept="image/*,.pdf,.txt,.doc,.docx"
              onChange={handleFile}
            />
            {fileErr && <span style={s.errMsg}>{fileErr}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
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
  wrapper: { maxWidth: 860, margin: '0 auto' },
  card: { background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: '28px 32px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '.8rem', fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '.05em' },
  req: { color: '#f85149' },
  input: {
    background: '#1e2531', border: '1px solid #30363d', borderRadius: 9,
    padding: '10px 14px', color: '#e6edf3', fontSize: '.9rem',
    fontFamily: 'inherit', outline: 'none', transition: 'border-color .2s',
  },
  inputErr: { borderColor: '#f85149' },
  errMsg: { fontSize: '.75rem', color: '#f85149', marginTop: 2 },
  impactCard: {
    background: '#1e2531', border: '1px solid #30363d', borderRadius: 8,
    padding: '10px 14px', cursor: 'pointer', transition: 'all .15s',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg,#4f8ef7,#7c5af5)', color: '#fff',
    border: 'none', borderRadius: 9, padding: '11px 24px', fontSize: '.9rem', fontWeight: 600, cursor: 'pointer',
  },
  ghostBtn: {
    background: '#1e2531', border: '1px solid #30363d', borderRadius: 9,
    color: '#e6edf3', padding: '11px 20px', fontSize: '.9rem', cursor: 'pointer',
  },
  backBtn: {
    background: '#1e2531', border: '1px solid #30363d', borderRadius: 8,
    color: '#8b949e', padding: '6px 14px', fontSize: '.82rem', cursor: 'pointer',
  },
  toast: {
    position: 'fixed', bottom: 24, right: 24, zIndex: 999,
    background: '#1e2531', border: '1px solid #30363d', borderRadius: 12,
    padding: '12px 20px', fontSize: '.85rem', boxShadow: '0 8px 32px rgba(0,0,0,.4)',
  },
};
