import { useState, useEffect } from 'react';
import { Users, ClipboardList, BarChart2, Settings, Plus, Star, Clock, CheckCircle2, AlertTriangle, Zap, Minus, UserCircle, CalendarDays } from 'lucide-react';
import api from '../../api/client';

export default function AdminPanel() {
  const [tab, setTab]           = useState('users');
  const [users, setUsers]       = useState([]);
  const [sla, setSla]           = useState(null);
  const [report, setReport]     = useState(null);
  const [logs, setLogs]         = useState([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logAction, setLogAction] = useState('');
  const [loading, setLoading]   = useState(true);
  const [showCreate, setCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [toast, setToast]       = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function loadUsers() {
    const { data } = await api.get('/users');
    setUsers(data.users);
  }
  async function loadSla() {
    const { data } = await api.get('/admin/sla');
    setSla(data.sla);
  }
  async function loadReport() {
    const { data } = await api.get('/admin/report');
    setReport(data);
  }
  async function loadLogs(action = '') {
    const { data } = await api.get('/admin/logs', { params: action ? { action } : {} });
    setLogs(data.logs);
    setLogTotal(data.total);
  }

  useEffect(() => {
    Promise.all([loadUsers(), loadSla(), loadReport(), loadLogs()])
      .finally(() => setLoading(false));
  }, []);

  async function toggleUser(u) {
    await api.patch(`/users/${u.id}`, { active: !u.active });
    await loadUsers();
    showToast(u.active ? `${u.name} pasif edildi` : `${u.name} aktif edildi`);
  }

  if (loading) return <div style={s.center}>Yükleniyor...</div>;

  const tabs = [
    { key:'users',  label: <span style={{display:'flex', gap:6, alignItems:'center'}}><Users size={16}/> Kullanıcılar</span> },
    { key:'sla',    label: <span style={{display:'flex', gap:6, alignItems:'center'}}><ClipboardList size={16}/> SLA</span> },
    { key:'report', label: <span style={{display:'flex', gap:6, alignItems:'center'}}><BarChart2 size={16}/> Raporlar</span> },
  ];

  return (
    <div>
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:'1.1rem', fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
          <Settings size={20} color="#8b949e" /> Yönetim Paneli
        </h2>
        <span style={s.adminBadge}>IT Admin</span>
      </div>

      {/* Tab bar */}
      <div style={s.tabBar}>
        {tabs.map(t => (
          <button key={t.key}
            style={{ ...s.tabBtn, ...(tab === t.key ? s.tabActive : {}) }}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── USERS ── */}
      {tab === 'users' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <button style={{ ...s.primaryBtn, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setCreate(true)}>
              <Plus size={16} /> Yeni Kullanıcı
            </button>
          </div>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  {['Ad Soyad','E-posta','Rol','Departman','Durum','İşlem'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ ...s.avatar, background: u.role === 'admin' ? '#7c5af5' : u.role === 'staff' ? '#4f8ef7' : '#3fb950' }}>
                          {u.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td style={s.td}>{u.email}</td>
                    <td style={s.td}>
                      <span style={{ ...s.roleBadge, ...roleStyle(u.role) }}>
                        {u.role === 'admin' ? 'Admin' : u.role === 'staff' ? 'IT Personeli' : 'Kullanıcı'}
                      </span>
                    </td>
                    <td style={s.td}>{u.department || '—'}</td>
                    <td style={s.td}>
                      <span style={{ color: u.active ? '#3fb950' : '#8b949e', fontSize:'.82rem', fontWeight:600 }}>
                        {u.active ? '● Aktif' : '○ Pasif'}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button style={{ ...s.smallBtn, borderColor:'#4f8ef7', color:'#4f8ef7' }}
                          onClick={() => setEditUser(u)}>
                          Düzenle
                        </button>
                        <button style={{ ...s.smallBtn, borderColor: u.active ? '#f85149' : '#3fb950', color: u.active ? '#f85149' : '#3fb950' }}
                          onClick={() => toggleUser(u)}>
                          {u.active ? 'Pasif Et' : 'Aktif Et'}
                        </button>
                        <button style={{ ...s.smallBtn, borderColor:'#f85149', color:'#f85149' }}
                          onClick={async () => {
                            const first = window.confirm(`"${u.name}" kullanıcısını kalıcı olarak silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`);
                            if (!first) return;
                            const second = window.confirm(`SON UYARI: "${u.name}" kullanıcısına ait tüm talepler, yorumlar ve loglar da silinecektir.\n\nDevam etmek istiyor musunuz?`);
                            if (!second) return;
                            try {
                              await api.delete(`/users/${u.id}`);
                              showToast(`${u.name} başarıyla silindi`);
                              await loadUsers();
                            } catch (e) {
                              showToast('Hata: ' + (e.response?.data?.error || 'Bilinmeyen hata'));
                            }
                          }}>
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {showCreate && <CreateUserModal onClose={() => setCreate(false)} onCreated={async () => { await loadUsers(); setCreate(false); showToast('Kullanıcı başarıyla oluşturuldu'); }} />}
          {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onUpdated={async () => { await loadUsers(); setEditUser(null); showToast('Kullanıcı başarıyla güncellendi'); }} />}
        </div>
      )}

      {/* ── SLA ── */}
      {tab === 'sla' && sla && (
        <div style={s.grid2}>
          {Object.entries(sla).map(([priority, data]) => {
            const pct = data.total ? Math.round((data.withinSla / data.total) * 100) : 100;
            const color = pct >= 90 ? '#3fb950' : pct >= 70 ? '#e3b341' : '#f85149';
            const icons = { 'Kritik': <AlertTriangle size={24} color={color} />, 'Yüksek': <Zap size={24} color={color} />, 'Orta': <Minus size={24} color={color} />, 'Düşük': <CheckCircle2 size={24} color={color} /> };
            return (
              <div key={priority} style={{ ...s.card, display:'flex', alignItems:'center', gap: 20, padding: '20px' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: `${color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {icons[priority]}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'1.05rem', color:'#c9d1d9' }}>{priority} Öncelikli Talepler</div>
                      <div style={{ fontSize:'.75rem', color:'#8b949e', marginTop: 2 }}>Çözüm Hedefi: {data.targetHours} Saat</div>
                    </div>
                    <div style={{ fontSize:'1.5rem', fontWeight:800, color }}>%{pct}</div>
                  </div>
                  
                  <div style={{ height: 6, width: '100%', background:'#30363d', borderRadius: 3, overflow:'hidden', marginBottom: 12 }}>
                    <div style={{ width: pct + '%', background: color, height:'100%' }} />
                  </div>
                  
                  <div style={{ display:'flex', gap: 24, fontSize:'.8rem' }}>
                    <div style={{ display:'flex', flexDirection:'column' }}>
                      <span style={{ color:'#8b949e', fontSize:'.7rem' }}>Toplam Talep</span>
                      <strong style={{ color:'#c9d1d9' }}>{data.total}</strong>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column' }}>
                      <span style={{ color:'#8b949e', fontSize:'.7rem' }}>SLA İçinde</span>
                      <strong style={{ color:'#3fb950' }}>{data.withinSla}</strong>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column' }}>
                      <span style={{ color:'#8b949e', fontSize:'.7rem' }}>İhlal Riski</span>
                      <strong style={{ color:'#f85149' }}>{data.breached}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── REPORT ── */}
      {tab === 'report' && report && (
        <div style={s.grid2}>
          {/* Staff workload */}
          <div style={s.card}>
            <h3 style={{ ...s.cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}><UserCircle size={18} color="#8b949e"/> Personel İş Yükü</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {report.staff_workload.map(st => {
                const totalWork = st.total || 1;
                const progressPct = ((st.progress + st.open) / totalWork) * 100;
                const resolvedPct = (st.resolved / totalWork) * 100;
                return (
                  <div key={st.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid #30363d' }}>
                    <div style={{ ...s.avatar, background:'linear-gradient(135deg, #4f8ef7, #7c5af5)', flexShrink:0, boxShadow:'0 4px 10px rgba(79,142,247,0.3)' }}>
                      {st.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ fontSize:'.9rem', fontWeight:600 }}>{st.name}</div>
                        <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#c9d1d9' }}>{st.total}</div>
                      </div>
                      
                      {/* Mini Progress Bar */}
                      <div style={{ height: 4, width: '100%', background:'#30363d', borderRadius: 2, display:'flex', overflow:'hidden', marginTop: 6, marginBottom: 4 }}>
                        <div style={{ width: `${progressPct}%`, background:'#e3b341' }} />
                        <div style={{ width: `${resolvedPct}%`, background:'#3fb950' }} />
                      </div>

                      <div style={{ fontSize:'.7rem', color:'#8b949e', display:'flex', justifyContent:'space-between' }}>
                        <span>Açık/İşlemde: <strong style={{color:'#e3b341'}}>{st.open + st.progress}</strong> · Çözüldü: <strong style={{color:'#3fb950'}}>{st.resolved}</strong></span>
                        <span style={{ color: st.avg_rating ? '#e3b341' : '#8b949e', fontWeight:600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {st.avg_rating ? <>{st.avg_rating} <Star size={12} fill="#e3b341" /></> : 'Değerlendirme Yok'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!report.staff_workload.length && <p style={{ color:'#8b949e', fontSize:'.85rem' }}>Veri yok</p>}
            </div>
          </div>

          {/* Avg resolution */}
          <div style={s.card}>
            <h3 style={{ ...s.cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={18} color="#8b949e"/> Ortalama Çözüm Süresi</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {report.avg_resolution_hours.map(r => (
                <div key={r.priority} style={{ padding:'16px', background:'rgba(255,255,255,0.03)', borderRadius:8, textAlign:'center', border:'1px solid #30363d' }}>
                  <div style={{ fontSize:'.8rem', color:'#8b949e', marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>{r.priority}</div>
                  <div style={{ fontSize:'1.6rem', fontWeight:800, color: r.avg_hours < 24 ? '#3fb950' : r.avg_hours < 48 ? '#e3b341' : '#f85149' }}>
                    {r.avg_hours} <span style={{fontSize:'.9rem', fontWeight:400}}>saat</span>
                  </div>
                </div>
              ))}
              {!report.avg_resolution_hours.length && <p style={{ color:'#8b949e', fontSize:'.85rem', gridColumn:'1/-1' }}>Henüz çözümlenen talep yok</p>}
            </div>
          </div>

          {/* CSAT Rating */}
          <div style={{ ...s.card, gridColumn:'1/-1', display:'flex', alignItems:'center', gap:30, flexWrap:'wrap' }}>
            <div style={{ flexShrink:0, textAlign:'center', minWidth: 200 }}>
              <h3 style={{ ...s.cardTitle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Star size={18} fill="#e3b341" color="#e3b341" /> Personel Memnuniyeti</h3>
              <div style={{ fontSize:'3.5rem', fontWeight:800, color:'#e3b341', lineHeight:1 }}>
                {report.csat.average_rating || '0.0'}
              </div>
              <div style={{ fontSize:'.8rem', color:'#8b949e', marginTop:6 }}>5 Üzerinden Ortalama Puan</div>
            </div>
            <div style={{ flex:1, borderLeft:'1px solid #30363d', paddingLeft:30, display:'flex', gap:40 }}>
              <div style={{ display:'flex', flexDirection:'column' }}>
                <span style={{ fontSize:'.75rem', color:'#8b949e' }}>Toplam Değerlendirme</span>
                <span style={{ fontSize:'1.6rem', fontWeight:600 }}>{report.csat.total_ratings || 0}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column' }}>
                <span style={{ fontSize:'.75rem', color:'#8b949e' }}>Olumlu (4 ve 5 Yıldız)</span>
                <span style={{ fontSize:'1.6rem', fontWeight:600, color:'#3fb950' }}>{report.csat.positive_ratings || 0}</span>
              </div>
            </div>
          </div>

          {/* Last 30 days chart */}
          <div style={{ ...s.card, gridColumn:'1/-1' }}>
            <h3 style={{ ...s.cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}><CalendarDays size={18} color="#8b949e"/> Son 30 Gün Talep Trendi</h3>
            {report.tickets_last_30.length ? (
              <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:130, marginTop:24, overflowX:'auto', paddingBottom:8 }}>
                {(() => {
                  const max = Math.max(...report.tickets_last_30.map(d => d.c), 1);
                  return report.tickets_last_30.map(d => (
                    <div key={d.day} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, minWidth: 45 }}>
                      <span style={{ fontSize:'.85rem', fontWeight:700, color:'#c9d1d9' }}>{d.c}</span>
                      <div style={{ width:'32px', borderRadius:'3px 3px 0 0', background:'#4f8ef7',
                        height: Math.max((d.c / max) * 80, 4) }} title={`${d.day}: ${d.c} talep`} />
                      <span style={{ fontSize:'.75rem', color:'#8b949e' }}>{d.day?.slice(5)}</span>
                    </div>
                  ));
                })()}
              </div>
            ) : <p style={{ color:'#8b949e', fontSize:'.85rem' }}>Veri yok</p>}
          </div>
        </div>
      )}

      {/* ── LOGS ── */}
      {tab === 'logs' && (
        <LogsTab
          logs={logs}
          total={logTotal}
          logAction={logAction}
          onFilterChange={(a) => { setLogAction(a); loadLogs(a); }}
        />
      )}
    </div>
  );
}

function roleStyle(role) {
  if (role === 'admin') return { background:'rgba(124,90,245,.15)', color:'#7c5af5' };
  if (role === 'staff') return { background:'rgba(79,142,247,.15)', color:'#4f8ef7' };
  return { background:'rgba(63,185,80,.10)', color:'#3fb950' };
}

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'user', department:'' });
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!form.name || !form.email || !form.password) { setErr('Ad, email ve şifre zorunlu'); return; }
    setBusy(true);
    try {
      await api.post('/users', form);
      onCreated();
    } catch(e) {
      setErr(e.response?.data?.error || 'Oluşturulamadı');
    } finally { setBusy(false); }
  }

  function f(k, v) { setForm(p => ({ ...p, [k]: v })); setErr(''); }

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <h3 style={{ fontSize:'1.1rem', fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}><Plus size={18}/> Yeni Kullanıcı</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[['Ad Soyad','name','text'],['E-posta','email','email'],['Şifre','password','password']].map(([lbl,key,type]) => (
            <div key={key} style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={s.smallLabel}>{lbl}</label>
              <input style={s.modalInput} type={type} value={form[key]} onChange={e => f(key, e.target.value)} />
            </div>
          ))}
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={s.smallLabel}>Rol</label>
            <select style={s.modalInput} value={form.role} onChange={e => f('role', e.target.value)}>
              <option value="user">Kullanıcı</option>
              <option value="staff">IT Personeli</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={s.smallLabel}>Departman</label>
            <input style={s.modalInput} value={form.department} onChange={e => f('department', e.target.value)} placeholder="Muhasebe, Satış..." />
          </div>
          {err && <div style={{ color:'#f85149', fontSize:'.8rem' }}>{err}</div>}
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
          <button style={s.ghostBtn} onClick={onClose}>İptal</button>
          <button style={{ ...s.primaryBtn, opacity: busy ? 0.7 : 1 }} onClick={create} disabled={busy}>
            {busy ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onUpdated }) {
  const [form, setForm] = useState({ name: user.name, role: user.role, department: user.department || '', password: '' });
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);

  async function update() {
    if (!form.name) { setErr('Ad soyad zorunlu'); return; }
    setBusy(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await api.patch(`/users/${user.id}`, payload);
      onUpdated();
    } catch(e) {
      setErr(e.response?.data?.error || 'Güncellenemedi');
    } finally { setBusy(false); }
  }

  function f(k, v) { setForm(p => ({ ...p, [k]: v })); setErr(''); }

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <h3 style={{ fontSize:'1rem', fontWeight:700, marginBottom:20 }}>✏️ Kullanıcı Düzenle</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={s.smallLabel}>Ad Soyad</label>
            <input style={s.modalInput} type="text" value={form.name} onChange={e => f('name', e.target.value)} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={s.smallLabel}>E-posta <span style={{fontSize:'0.65rem', color:'#8b949e'}}>(Değiştirilemez)</span></label>
            <input style={{...s.modalInput, opacity: 0.6, cursor: 'not-allowed'}} type="email" value={user.email} disabled />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={s.smallLabel}>Yeni Şifre <span style={{fontSize:'0.65rem', color:'#8b949e'}}>(Değiştirmek istemiyorsan boş bırak)</span></label>
            <input style={s.modalInput} type="password" value={form.password} onChange={e => f('password', e.target.value)} placeholder="••••••••" />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={s.smallLabel}>Rol</label>
            <select style={s.modalInput} value={form.role} onChange={e => f('role', e.target.value)}>
              <option value="user">Kullanıcı</option>
              <option value="staff">IT Personeli</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={s.smallLabel}>Departman</label>
            <input style={s.modalInput} value={form.department} onChange={e => f('department', e.target.value)} placeholder="Muhasebe, Satış..." />
          </div>
          {err && <div style={{ color:'#f85149', fontSize:'.8rem' }}>{err}</div>}
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
          <button style={s.ghostBtn} onClick={onClose}>İptal</button>
          <button style={{ ...s.primaryBtn, opacity: busy ? 0.7 : 1 }} onClick={update} disabled={busy}>
            {busy ? 'Güncelleniyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

function actionLabel(action) {
  const map = {
    login:           { label: 'Giriş',              color: '#3fb950' },
    login_failed:    { label: 'Başarısız Giriş',    color: '#f85149' },
    create_user:     { label: 'Kullanıcı Oluşturuldu', color: '#4f8ef7' },
    update_user:     { label: 'Kullanıcı Güncellendi', color: '#e3b341' },
    activate_user:   { label: 'Kullanıcı Aktif Edildi', color: '#3fb950' },
    deactivate_user: { label: 'Kullanıcı Pasif Edildi', color: '#f85149' },
  };
  return map[action] || { label: action, color: '#8b949e' };
}

function LogsTab({ logs, total, logAction, onFilterChange }) {
  const actionTypes = [
    '', 'login', 'login_failed', 'create_user', 'update_user', 'activate_user', 'deactivate_user',
  ];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontSize:'.85rem', color:'#8b949e' }}>Toplam <strong style={{ color:'#e6edf3' }}>{total}</strong> kayıt</span>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {actionTypes.map(a => {
            const { label, color } = actionLabel(a || '__all');
            const isActive = logAction === a;
            return (
              <button key={a}
                style={{
                  background: isActive ? 'rgba(79,142,247,.15)' : 'transparent',
                  border: `1px solid ${isActive ? '#4f8ef7' : '#30363d'}`,
                  color: isActive ? '#4f8ef7' : '#8b949e',
                  borderRadius:20, padding:'4px 12px', fontSize:'.73rem', cursor:'pointer',
                }}
                onClick={() => onFilterChange(a)}>
                {a ? actionLabel(a).label : 'Tümü'}
              </button>
            );
          })}
        </div>
      </div>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              {['Tarih / Saat','Kullanıcı','Olay','Hedef','Detay','IP'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={6} style={{ ...s.td, textAlign:'center', color:'#8b949e', padding:40 }}>Henüz log kaydı yok.</td></tr>
            )}
            {logs.map(l => {
              const { label, color } = actionLabel(l.action);
              return (
                <tr key={l.id} style={s.tr}>
                  <td style={{ ...s.td, fontFamily:'monospace', fontSize:'.75rem', color:'#8b949e', whiteSpace:'nowrap' }}>
                    {l.created_at?.slice(0,16).replace('T',' ')}
                  </td>
                  <td style={s.td}>{l.actor_name || <span style={{ color:'#8b949e' }}>—</span>}</td>
                  <td style={s.td}>
                    <span style={{ background:`${color}22`, color, borderRadius:20, padding:'2px 10px', fontSize:'.72rem', fontWeight:600, whiteSpace:'nowrap' }}>
                      {label}
                    </span>
                  </td>
                  <td style={{ ...s.td, fontSize:'.8rem', color:'#8b949e' }}>{l.target || '—'}</td>
                  <td style={{ ...s.td, fontSize:'.8rem' }}>{l.detail || '—'}</td>
                  <td style={{ ...s.td, fontFamily:'monospace', fontSize:'.73rem', color:'#8b949e' }}>{l.ip || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const s = {
  center: { padding:60, textAlign:'center', color:'#8b949e' },
  adminBadge: { background:'rgba(79,142,247,.15)', color:'#4f8ef7', borderRadius:20, padding:'4px 12px', fontSize:'.78rem', fontWeight:600 },
  tabBar: { display:'flex', gap:4, marginBottom:20, background:'#161b22', border:'1px solid #30363d', borderRadius:12, padding:4 },
  tabBtn: { background:'transparent', border:'none', color:'#8b949e', padding:'7px 18px', borderRadius:9, fontSize:'.85rem', fontWeight:500, cursor:'pointer', transition:'all .2s' },
  tabActive: { background:'#1e2531', color:'#e6edf3' },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  card: { background:'#161b22', border:'1px solid #30363d', borderRadius:14, padding:'20px 22px' },
  cardTitle: { fontSize:'.82rem', fontWeight:600, color:'#8b949e', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:14 },
  tableWrap: { background:'#161b22', border:'1px solid #30363d', borderRadius:14, overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse' },
  thead: { background:'#1e2531' },
  th: { padding:'10px 16px', textAlign:'left', fontSize:'.75rem', color:'#8b949e', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' },
  tr: { borderBottom:'1px solid #30363d', transition:'background .15s' },
  td: { padding:'12px 16px', fontSize:'.87rem' },
  avatar: { width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'.75rem', color:'#fff', flexShrink:0 },
  roleBadge: { display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:'.72rem', fontWeight:600 },
  smallBtn: { background:'transparent', border:'1px solid', borderRadius:6, padding:'4px 10px', fontSize:'.75rem', cursor:'pointer' },
  slaBarBg: { height:8, background:'#30363d', borderRadius:4, overflow:'hidden', marginBottom:10 },
  slaBarFill: { height:'100%', borderRadius:4, transition:'width .5s' },
  slaStats: { display:'flex', gap:16, fontSize:'.78rem', color:'#8b949e' },
  primaryBtn: { background:'linear-gradient(135deg,#4f8ef7,#7c5af5)', color:'#fff', border:'none', borderRadius:9, padding:'8px 16px', fontSize:'.83rem', fontWeight:600, cursor:'pointer' },
  ghostBtn: { background:'#1e2531', border:'1px solid #30363d', borderRadius:9, color:'#e6edf3', padding:'8px 16px', fontSize:'.83rem', cursor:'pointer' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 },
  modal: { background:'#161b22', border:'1px solid #30363d', borderRadius:16, padding:28, width:'100%', maxWidth:440 },
  modalInput: { background:'#1e2531', border:'1px solid #30363d', borderRadius:8, padding:'9px 12px', color:'#e6edf3', fontSize:'.88rem', fontFamily:'inherit', outline:'none', width:'100%', boxSizing:'border-box' },
  smallLabel: { fontSize:'.78rem', fontWeight:600, color:'#8b949e', textTransform:'uppercase', letterSpacing:'.04em' },
  toast: { position:'fixed', bottom:24, right:24, zIndex:999, background:'#1e2531', border:'1px solid #30363d', borderRadius:12, padding:'12px 20px', fontSize:'.85rem', boxShadow:'0 8px 32px rgba(0,0,0,.4)' },
};
