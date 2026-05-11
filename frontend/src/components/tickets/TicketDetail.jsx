import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Badge, PriorityDot } from '../ui/Badge';
import { CheckCircle2, Star, MessageSquare, Save, Zap, Lock, Unlock, FileText, Paperclip, Image, File, History, Info, User, AlertTriangle, AlertCircle } from 'lucide-react';

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket]     = useState(null);
  const [logs, setLogs]         = useState([]);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [staff, setStaff]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [comment, setComment]   = useState('');
  const [internal, setInternal] = useState(false);
  const [posting, setPosting]   = useState(false);
  const [toast, setToast]       = useState('');
  const [rating, setRating]     = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function load() {
    try {
      const { data } = await api.get(`/tickets/${id}`);
      setTicket(data.ticket);
      setLogs(data.logs);
      setComments(data.comments);
      setAttachments(data.attachments || []);
    } catch {
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    if (user.role !== 'user') {
      api.get('/users?role=staff').then(r => setStaff(r.data.users));
    }
  }, [id]);

  async function updateStatus(status) {
    try {
      await api.patch(`/tickets/${id}/status`, { status });
      await load();
      const l = { progress: 'İşleme alındı', resolved: 'Çözümlendi', closed: 'Kapatıldı', open: 'Yeniden açıldı' };
      showToast(l[status] || 'Durum güncellendi');
    } catch (e) {
      showToast('Hata: ' + (e.response?.data?.error || 'Güncelleme başarısız'));
    }
  }

  async function assignTicket(userId) {
    try {
      await api.patch(`/tickets/${id}/assign`, { user_id: userId || null });
      await load();
      showToast('Atama güncellendi');
    } catch (e) {
      showToast('Hata: ' + (e.response?.data?.error || 'Atama başarısız'));
    }
  }

  async function submitRating() {
    if (!rating) return;
    try {
      await api.patch(`/tickets/${id}/rate`, { rating, comment: ratingComment });
      await load();
      showToast('Değerlendirme kaydedildi');
    } catch (e) {
      showToast('Hata: ' + (e.response?.data?.error || 'Değerlendirme yapılamadı'));
    }
  }

  async function updatePriority(priority) {
    try {
      await api.patch(`/tickets/${id}/priority`, { priority });
      await load();
      showToast(`Öncelik güncellendi: ${priority}`);
    } catch (e) {
      showToast('Hata: ' + (e.response?.data?.error || 'Öncelik güncellenemedi'));
    }
  }

  async function postComment() {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await api.post(`/tickets/${id}/comments`, { body: comment, internal });
      setComment('');
      setInternal(false);
      await load();
      showToast('Yorum eklendi');
    } catch (e) {
      showToast('Hata: ' + (e.response?.data?.error || 'Yorum eklenemedi'));
    } finally {
      setPosting(false);
    }
  }

  if (loading) return <div style={s.center}>Yükleniyor...</div>;
  if (!ticket) return null;

  const isStaffOrAdmin = user.role !== 'user';

  return (
    <div style={s.wrapper}>
      {/* Toast */}
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Back */}
      <button style={s.backBtn} onClick={() => navigate('/tickets')}>← Geri</button>

      <div style={s.layout}>
        {/* ── Left: main content ── */}
        <div style={s.main}>
          {/* Header */}
          <div style={s.headerCard}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
              <div>
                <div style={s.ticketNo}>#{ticket.ticket_no}</div>
                <h1 style={s.title}>{ticket.title}</h1>
                <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                  <Badge type="status" value={ticket.status} />
                  <Badge type="priority" value={ticket.priority} />
                  <span style={s.cat}>{ticket.category}</span>
                </div>
              </div>
              {isStaffOrAdmin && (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {ticket.status !== 'progress' && ticket.status !== 'resolved' && ticket.status !== 'closed' &&
                    <button style={{...s.actionBtn('#e3b341'), display:'flex', alignItems:'center', gap:6}} onClick={() => updateStatus('progress')}><Zap size={16}/> İşleme Al</button>}
                  {ticket.status !== 'resolved' && ticket.status !== 'closed' &&
                    <button style={{...s.actionBtn('#3fb950'), display:'flex', alignItems:'center', gap:6}} onClick={() => {
                      if (user.role !== 'admin' && !ticket.assigned_to) {
                        alert('Öncelikle bileti üzerinize almalısınız (Atama yapılmadan bilet çözümlenemez)!');
                      } else {
                        updateStatus('resolved');
                      }
                    }}>Çözümlendi</button>}
                  {ticket.status !== 'closed' && user.role === 'admin' &&
                    <button style={{...s.actionBtn('#8b949e'), display:'flex', alignItems:'center', gap:6}} onClick={() => updateStatus('closed')}><Lock size={16}/> Kapat</button>}
                  {ticket.status === 'closed' &&
                    <button style={{...s.actionBtn('#4f8ef7'), display:'flex', alignItems:'center', gap:6}} onClick={() => updateStatus('open')}><Unlock size={16}/> Yeniden Aç</button>}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div style={s.card}>
            <h3 style={{...s.cardTitle, display:'flex', alignItems:'center', gap:6}}><FileText size={16}/> Açıklama</h3>
            <p style={s.desc}>{ticket.description}</p>
          </div>

          {/* Rating Section */}
          {(ticket.status === 'resolved' || ticket.status === 'closed') && (
            (user.role === 'admin' && ticket.rating) || 
            (user.role === 'user' && ticket.created_by === user.id)
          ) && (
            <div style={{ ...s.card, background: 'linear-gradient(145deg, #161b22, #1c2128)' }}>
              <h3 style={{...s.cardTitle, display:'flex', alignItems:'center', gap:6}}><Star size={16}/> Hizmet Değerlendirmesi</h3>
              {ticket.rating ? (
                <div>
                  <div style={{ display:'flex', gap:4, fontSize:'1.5rem', marginBottom:8 }}>
                    {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= ticket.rating ? '#e3b341' : '#30363d' }}>★</span>)}
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize:'.85rem', color:'#8b949e', marginBottom:12 }}>Bu talep çözümlendi. Aldığınız destekten ne kadar memnun kaldınız?</p>
                  <div style={{ display:'flex', gap:8, fontSize:'1.8rem', marginBottom:16, cursor:'pointer' }}>
                    {[1,2,3,4,5].map(i => (
                      <span key={i} onClick={() => setRating(i)} style={{ color: i <= rating ? '#e3b341' : '#30363d', transition:'color 0.2s' }}>★</span>
                    ))}
                  </div>
                  <button
                    style={{ ...s.primaryBtn, marginTop: 4, opacity: rating ? 1 : 0.5 }}
                    onClick={submitRating} disabled={!rating}>
                    Değerlendirmeyi Gönder
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div style={s.card}>
            <h3 style={{...s.cardTitle, display:'flex', alignItems:'center', gap:6}}><MessageSquare size={16}/> Yorumlar ({comments.length})</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
              {comments.map(c => (
                <div key={c.id} style={{ ...s.comment, ...(c.internal ? s.commentInternal : {}) }}>
                  <div style={s.commentHeader}>
                    <span style={{ fontWeight:600, fontSize:'.85rem' }}>{c.user_name}</span>
                    <span style={s.commentRole}>{c.user_role === 'staff' ? 'IT Personeli' : c.user_role === 'admin' ? 'Admin' : 'Kullanıcı'}</span>
                    {c.internal === 1 && <span style={{...s.internalBadge, display:'flex', alignItems:'center', gap:4}}><Lock size={12}/> İç Not</span>}
                    <span style={{ color:'#8b949e', fontSize:'.75rem', marginLeft:'auto' }}>{c.created_at?.slice(0,16).replace('T',' ')}</span>
                  </div>
                  <p style={{ margin:0, fontSize:'.88rem', lineHeight:1.6, color: c.internal ? '#c9b84a' : '#c9d1d9' }}>{c.body}</p>
                </div>
              ))}
              {!comments.length && <p style={{ color:'#8b949e', fontSize:'.85rem' }}>Henüz yorum yok.</p>}
            </div>

            {/* Add comment */}
            <div style={s.commentBox}>
              <textarea
                style={s.textarea}
                placeholder="Yorum veya güncelleme ekle..."
                value={comment}
                rows={3}
                onChange={e => setComment(e.target.value)}
              />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                {isStaffOrAdmin && (
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.82rem', color:'#8b949e', cursor:'pointer' }}>
                    <input type="checkbox" checked={internal} onChange={e => setInternal(e.target.checked)} />
                    <Lock size={14}/> İç not (kullanıcı göremez)
                  </label>
                )}
                <button
                  style={{ ...s.primaryBtn, marginLeft:'auto', opacity: posting ? 0.7 : 1 }}
                  onClick={postComment} disabled={posting || !comment.trim()}>
                  {posting ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div style={s.card}>
              <h3 style={{...s.cardTitle, display:'flex', alignItems:'center', gap:6}}><Paperclip size={16}/> Ek Dosyalar ({attachments.length})</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {attachments.map(a => {
                  const isImage = a.mimetype.startsWith('image/');
                  const url = `http://${window.location.hostname}:3001/uploads/${a.stored_name}`;
                  const ext = a.original_name.split('.').pop().toUpperCase();
                  const icon = isImage ? <Image size={18}/> : a.mimetype === 'application/pdf' ? <FileText size={18}/> : <File size={18}/>;
                  return (
                    <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'#1e2531', border:'1px solid #30363d', borderRadius:9 }}>
                      {isImage ? (
                        <a href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt={a.original_name}
                            style={{ width:48, height:48, objectFit:'cover', borderRadius:6, border:'1px solid #30363d' }} />
                        </a>
                      ) : (
                        <span style={{ fontSize:'1.6rem' }}>{icon}</span>
                      )}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'.88rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {a.original_name}
                        </div>
                        <div style={{ fontSize:'.72rem', color:'#8b949e', marginTop:2 }}>
                          {ext} · {(a.size / 1024).toFixed(1)} KB · {a.uploader_name} · {a.created_at?.slice(0,16).replace('T',' ')}
                        </div>
                      </div>
                      <a href={url} download={a.original_name}
                        style={{ fontSize:'.78rem', color:'#4f8ef7', textDecoration:'none', padding:'5px 10px',
                          border:'1px solid #4f8ef7', borderRadius:6, whiteSpace:'nowrap' }}>
                        İndir
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div style={s.card}>
            <h3 style={{...s.cardTitle, display:'flex', alignItems:'center', gap:6}}><History size={16}/> Aktivite Geçmişi</h3>
            <div style={s.timeline}>
              {logs.map((l, i) => (
                <div key={l.id} style={s.timelineItem}>
                  <div style={s.timelineDot} />
                  {i < logs.length - 1 && <div style={s.timelineLine} />}
                  <div>
                    <div style={{ fontSize:'.87rem' }}>{l.detail}</div>
                    <div style={{ fontSize:'.73rem', color:'#8b949e', marginTop:2 }}>
                      {l.user_name || 'Sistem'} · {l.created_at?.slice(0,16).replace('T',' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <div style={s.sidebar}>
          {/* Info */}
          <div style={s.card}>
            <h3 style={{...s.cardTitle, display:'flex', alignItems:'center', gap:6}}><Info size={16}/> Bilgiler</h3>
            <div style={s.infoGrid}>
              {[
                ['Talep Eden', ticket.creator_name],
                ['Departman', ticket.creator_department],
                ['Kategori', ticket.category],
                ['Öncelik', ticket.priority],
                ['Etki', ticket.impact || '—'],
                ['Oluşturulma', ticket.created_at?.slice(0,16).replace('T',' ')],
                ['Güncelleme', ticket.updated_at?.slice(0,16).replace('T',' ')],
                ['Çözüm', ticket.resolved_at?.slice(0,16).replace('T',' ') || '—'],
              ].map(([k, v]) => (
                <div key={k} style={s.infoRow}>
                  <span style={{ fontSize:'.73rem', color:'#8b949e' }}>{k}</span>
                  <span style={{ fontSize:'.85rem', fontWeight:500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assign */}
          {isStaffOrAdmin && (
            <div style={s.card}>
              <h3 style={{...s.cardTitle, display:'flex', alignItems:'center', gap:6}}><User size={16}/> Atama</h3>
              <p style={{ fontSize:'.8rem', color:'#8b949e', marginBottom:10 }}>
                Şu an: <strong style={{ color:'#e6edf3' }}>{ticket.assignee_name || 'Atanmadı'}</strong>
              </p>
              <select
                style={s.select}
                value={ticket.assigned_to || ''}
                onChange={e => assignTicket(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Atanmadı —</option>
                {staff
                  .filter(st => user.role === 'admin' || st.id === user.id || st.id === ticket.assigned_to)
                  .map(st => (
                    <option key={st.id} value={st.id}>{st.name} ({st.role})</option>
                  ))}
              </select>
            </div>
          )}

          {/* Öncelik geçersiz kıl (staff/admin) */}
          {isStaffOrAdmin && (
            <div style={s.card}>
              <h3 style={{...s.cardTitle, display:'flex', alignItems:'center', gap:6}}><AlertTriangle size={16}/> Öncelik</h3>
              <p style={{ fontSize:'.8rem', color:'#8b949e', marginBottom:10 }}>
                Mevcut: <strong style={{ color:'#e6edf3' }}>{ticket.priority}</strong>
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[['Kritik','#f85149'],['Yüksek','#ff7b72'],['Orta','#e3b341'],['Düşük','#3fb950']].map(([p, col]) => (
                  <button
                    key={p}
                    onClick={() => updatePriority(p)}
                    style={{
                      display:'flex', alignItems:'center', gap:8,
                      background: ticket.priority === p ? `${col}22` : 'transparent',
                      border: `1px solid ${ticket.priority === p ? col : '#30363d'}`,
                      borderRadius:7, padding:'7px 12px', cursor: ticket.priority === p ? 'default' : 'pointer',
                      color: ticket.priority === p ? col : '#8b949e', fontSize:'.82rem', fontWeight:600,
                      transition:'all .15s',
                    }}
                    disabled={ticket.priority === p}
                  >
                    {p}
                    {ticket.priority === p && <span style={{ marginLeft:'auto', fontSize:'.7rem' }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  wrapper: { maxWidth: 1100, margin: '0 auto' },
  center: { padding: 60, textAlign: 'center', color: '#8b949e' },
  backBtn: {
    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 10,
    color: '#8b949e', padding: '8px 16px', fontSize: '.82rem', cursor: 'pointer', marginBottom: 20,
    backdropFilter: 'blur(10px)', transition: 'all 0.3s'
  },
  layout: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' },
  main: { display: 'flex', flexDirection: 'column', gap: 16 },
  sidebar: { display: 'flex', flexDirection: 'column', gap: 16 },
  headerCard: { 
    background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', 
    borderRadius: 20, padding: '22px 24px', backdropFilter: 'blur(20px) saturate(180%)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },
  card: { 
    background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', 
    borderRadius: 20, padding: '20px 22px', backdropFilter: 'blur(20px) saturate(180%)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },
  cardTitle: { fontSize: '.85rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 14 },
  ticketNo: { fontSize: '.75rem', color: '#8b949e', fontFamily: 'monospace', marginBottom: 4 },
  title: { fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#ffffff' },
  cat: { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 20, padding: '4px 12px', fontSize: '.72rem', color: '#8b949e' },
  desc: { fontSize: '.95rem', lineHeight: 1.7, color: '#eaf6f7', margin: 0 },
  comment: { background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: '12px 16px' },
  commentInternal: { background: 'rgba(227, 179, 65, 0.05)', border: '1px solid rgba(227, 179, 65, 0.3)' },
  commentHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  commentRole: { background: 'rgba(255, 255, 255, 0.05)', borderRadius: 20, padding: '2px 8px', fontSize: '.68rem', color: 'rgba(255, 255, 255, 0.6)' },
  internalBadge: { background: 'rgba(227, 179, 65, 0.15)', borderRadius: 20, padding: '2px 8px', fontSize: '.68rem', color: '#e3b341' },
  commentBox: { borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 16 },
  textarea: {
    width: '100%', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12,
    padding: '12px 16px', color: '#ffffff', fontSize: '.9rem', fontFamily: 'inherit',
    resize: 'vertical', outline: 'none', boxSizing: 'border-box', transition: 'all 0.3s'
  },
  timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
  timelineItem: { display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 16, position: 'relative' },
  timelineDot: { width: 10, height: 10, borderRadius: '50%', background: '#0dcaf0', marginTop: 3, flexShrink:0, boxShadow: '0 0 8px #0dcaf0', zIndex: 1 },
  timelineLine: { position: 'absolute', left: 4, top: 13, bottom: 0, width: 2, background: 'rgba(255, 255, 255, 0.1)' },
  infoGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
  infoRow: { display: 'flex', flexDirection: 'column', gap: 2 },
  select: {
    width: '100%', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 10,
    padding: '10px 14px', color: '#ffffff', fontSize: '.85rem', fontFamily: 'inherit', outline: 'none',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #0dcaf0, #048a9f)', color: '#fff',
    border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(13, 202, 240, 0.3)', transition: 'all 0.3s'
  },
  actionBtn: (col) => ({
    background: 'transparent', border: `1px solid ${col}`, borderRadius: 10,
    color: col, padding: '8px 16px', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.3s', backdropFilter: 'blur(10px)'
  }),
  toast: {
    position: 'fixed', bottom: 24, right: 24, zIndex: 999,
    background: 'rgba(15, 25, 40, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 16, padding: '14px 24px', fontSize: '.85rem', color: '#ffffff', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
  },
};

// ... inside the component, where priority buttons are rendered ...
// Find and replace the priority buttons map:
// From: {[['Kritik','#f85149',<AlertTriangle size={14}/>],['Yüksek','#ff7b72',<AlertCircle size={14}/>],['Orta','#e3b341',<Info size={14}/>],['Düşük','#3fb950',<CheckCircle2 size={14}/>]].map(([p, col, icon]) => (
// To: {[['Kritik','#f85149'],['Yüksek','#ff7b72'],['Orta','#e3b341'],['Düşük','#3fb950']].map(([p, col]) => (
// and remove {icon} from the content.

// I will do this in the same multi-replace or separate replace. 
// Let's use multi_replace for accuracy.
