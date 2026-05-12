import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Plus, ArrowLeft, Paperclip, Send, Folder, Laptop, Globe, Mail, ShieldCheck, Printer, HelpCircle } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

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

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function NewTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', category: '', impact: IMPACTS[0].id, description: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [files, setFiles] = useState([]); // Çoklu dosya desteği
  const [dragActive, setDragActive] = useState(false);

  const autoPriority = IMPACT_TO_PRIORITY[form.impact] || 'Orta';
  const p = PRIORITY_INFO[autoPriority];

  const set = (fld, val) => {
    setForm(prev => ({ ...prev, [fld]: val }));
    if (errors[fld]) setErrors(prev => ({ ...prev, [fld]: '' }));
  };

  const handleFiles = (newFiles) => {
    const arr = Array.from(newFiles);
    // Maksimum 5 dosya sınırı
    if (files.length + arr.length > 5) {
      setToast('En fazla 5 dosya ekleyebilirsiniz');
      return;
    }
    const invalidType = arr.find(f => !ALLOWED_MIME.has(f.type));
    if (invalidType) {
      setToast(`Desteklenmeyen dosya türü: ${invalidType.name}`);
      return;
    }
    const oversized = arr.find(f => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setToast(`Dosya çok büyük (maks 10MB): ${oversized.name}`);
      return;
    }
    // Her dosya için önizleme URL'si oluştur
    const updated = arr.map(f => Object.assign(f, { preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null }));
    setFiles(prev => [...prev, ...updated]);
  };

  const removeFile = (index) => {
    const f = files[index];
    if (f.preview) URL.revokeObjectURL(f.preview); // Belleği temizle
    setFiles(prev => prev.filter((_, i) => i !== index));
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
    let createdTicketId = null;

    try {
      const { data } = await api.post('/tickets', { ...form, priority: autoPriority });
      createdTicketId = data.ticket.id;

      if (files.length > 0) {
        const fd = new FormData();
        files.forEach(f => fd.append('files', f)); // Backend 'files' bekliyor
        try {
          await api.post(`/tickets/${createdTicketId}/attachments`, fd);
        } catch (uploadErr) {
          setToast(
            'Talep oluşturuldu ancak ek dosyalar yüklenemedi: ' +
            (uploadErr.response?.data?.error || 'Dosya yükleme hatası')
          );
          setTimeout(() => navigate(`/tickets/${createdTicketId}`), 1800);
          return;
        }
      }

      setToast('Talep başarıyla oluşturuldu!');
      setTimeout(() => navigate(`/tickets/${createdTicketId}`), 1500);
    } catch (err) {
      setToast('Hata: ' + (err.response?.data?.error || 'İşlem başarısız'));
    } finally { setSubmitting(false); }
  };

  // Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
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
            <label style={s.label}>Ek Dosyalar (Maks 5)</label>
            <div 
              style={{ 
                ...s.dropZone, 
                ...(dragActive ? s.dropZoneActive : {}),
                ...(files.length > 0 ? { paddingBottom: 10 } : {})
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                id="f" 
                multiple 
                style={{ display: 'none' }} 
                onChange={e => handleFiles(e.target.files)} 
              />
              
              <div style={s.dropZoneContent}>
                <div style={s.dropIcon}><Paperclip size={24} /></div>
                <div>
                  <div style={{ fontWeight: 600, color: '#e6edf3' }}>Dosyaları buraya sürükleyin</div>
                  <div style={{ fontSize: '.8rem', color: '#8b949e' }}>veya <button style={s.browseBtn} onClick={() => document.getElementById('f').click()}>bilgisayarınızdan seçin</button></div>
                </div>
              </div>

              {files.length > 0 && (
                <div style={s.previewList}>
                  {files.map((f, i) => (
                    <div key={i} style={s.previewItem}>
                      {f.preview ? (
                        <img src={f.preview} style={s.previewImg} alt="preview" />
                      ) : (
                        <div style={s.fileIcon}><Folder size={20} /></div>
                      )}
                      <div style={s.fileInfo}>
                        <div style={s.fileName}>{f.name}</div>
                        <div style={s.fileSize}>{(f.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <button style={s.removeBtn} onClick={() => removeFile(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
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
  backBtn: { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.8)', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem', backdropFilter: 'blur(10px)' },
  pageTitle: { fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', margin: 0 },
  layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' },
  formSection: { background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  sideSection: { display: 'flex', flexDirection: 'column', gap: 16 },
  sideCard: { background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 20, padding: 24, backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  field: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: '.75rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '.05em' },
  input: { background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: '14px 18px', color: '#ffffff', fontSize: '.95rem', outline: 'none', transition: 'all .2s' },
  textarea: { minHeight: 120, resize: 'vertical' },
  inputErr: { borderColor: '#ff6b6b' },
  err: { fontSize: '.75rem', color: '#ff6b6b' },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 },
  catItem: { background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: '12px', color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all .2s' },
  catActive: { borderColor: '#0dcaf0', background: 'rgba(13, 202, 240, 0.15)', color: '#0dcaf0', boxShadow: '0 0 15px rgba(13,202,240,0.2)' },
  impactList: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 },
  impactBtn: { background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all .2s' },
  impactActive: { borderColor: '#0dcaf0', background: 'rgba(13, 202, 240, 0.15)' },
  impactLabel: { fontSize: '.9rem', fontWeight: 700, color: '#ffffff' },
  impactSub: { fontSize: '.7rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 },
  uploadArea: { display: 'flex', gap: 10 },
  dropZone: { background: 'rgba(0, 0, 0, 0.1)', border: '2px dashed rgba(255, 255, 255, 0.2)', borderRadius: 16, padding: 32, textAlign: 'center', transition: 'all .2s', position: 'relative' },
  dropZoneActive: { borderColor: '#0dcaf0', background: 'rgba(13, 202, 240, 0.05)' },
  dropZoneContent: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'rgba(255, 255, 255, 0.6)' },
  dropIcon: { width: 48, height: 48, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0dcaf0' },
  browseBtn: { background: 'none', border: 'none', color: '#0dcaf0', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 'inherit', textDecoration: 'underline' },
  previewList: { marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 },
  previewItem: { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: 10, display: 'flex', alignItems: 'center', gap: 12, position: 'relative' },
  previewImg: { width: 40, height: 40, borderRadius: 8, objectFit: 'cover' },
  fileIcon: { width: 40, height: 40, background: 'rgba(0, 0, 0, 0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.6)' },
  fileInfo: { flex: 1, minWidth: 0, textAlign: 'left' },
  fileName: { fontSize: '.85rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  fileSize: { fontSize: '.7rem', color: 'rgba(255, 255, 255, 0.5)' },
  removeBtn: { width: 24, height: 24, background: 'rgba(255, 107, 107, 0.15)', border: 'none', borderRadius: '50%', color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', lineHeight: 1 },
  submitBtn: { background: 'linear-gradient(135deg, #0dcaf0, #048a9f)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 24px rgba(13, 202, 240, 0.3)', transition: 'all 0.3s' },
  toast: { position: 'fixed', top: 24, right: 24, background: 'rgba(20, 30, 50, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: '16px 24px', color: '#ffffff', fontSize: '.9rem', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 1000 },
};
