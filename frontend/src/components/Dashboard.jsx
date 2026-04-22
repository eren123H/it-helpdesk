import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const S = {
  open: { label: 'Açık', bg: 'rgba(79,142,247,.15)', color: '#4f8ef7' },
  progress: { label: 'İşlemde', bg: 'rgba(227,179,65,.15)', color: '#e3b341' },
  resolved: { label: 'Çözüldü', bg: 'rgba(63,185,80,.15)', color: '#3fb950' },
  closed:   { label: 'Kapalı', bg: 'rgba(139,148,158,.15)', color: '#8b949e' },
};
const P = {
  Kritik: { bg: 'rgba(248,81,73,.15)', color: '#f85149' },
  Yüksek: { bg: 'rgba(248,81,73,.10)', color: '#ff7b72' },
  Orta:   { bg: 'rgba(227,179,65,.15)', color: '#e3b341' },
  Düşük:  { bg: 'rgba(63,185,80,.10)', color: '#3fb950' },
};
const DOT = { Kritik: '#f85149', Yüksek: '#ff7b72', Orta: '#e3b341', Düşük: '#3fb950' };

export function Badge({ type, value }) {
  const m = type === 'status' ? S[value] : P[value];
  if (!m) return null;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:20,
      fontSize:'.72rem', fontWeight:600, background: m.bg, color: m.color, whiteSpace:'nowrap' }}>
      {type === 'status' ? m.label : value}
    </span>
  );
}

export function PriorityDot({ priority }) {
  return <span style={{ width:8, height:8, borderRadius:'50%', background: DOT[priority] || '#8b949e',
    display:'inline-block', flexShrink:0, boxShadow: priority === 'Kritik' ? '0 0 6px #f85149' : 'none' }} />;
}

export default function Dashboard() {
  const [stats, setStats]     = useState(null);
  const [recent, setRecent]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/tickets/stats'),
      api.get('/tickets?limit=5'),
    ]).then(([s, t]) => {
      setStats(s.data);
      setRecent(t.data.tickets);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={c.loading}>Yükleniyor...</div>;

  const maxBar = Math.max(...(stats?.daily_last7?.map(d => d.c) || [1]), 1);

  return (
    <div>
      {/* Stats */}
      <div style={c.grid4}>
        {[
          { icon:'🎫', value: stats?.total    || 0, label:'Toplam Talep',  sub:'Tüm zamanlar',          color:'#4f8ef7' },
          { icon:'⏳', value: stats?.open     || 0, label:'Açık Talepler', sub:`${stats?.critical||0} kritik bekliyor`, color:'#e3b341' },
          { icon:'✅', value: stats?.resolved || 0, label:'Çözümlendi',    sub:'Bu ay',                  color:'#3fb950' },
          { icon:'🔥', value: stats?.critical || 0, label:'Kritik',        sub:'SLA takibinde',          color:'#f85149' },
        ].map(({ icon, value, label, sub, color }) => (
          <div key={label} style={c.statCard}>
            <div style={{ fontSize:'1.4rem', marginBottom:6 }}>{icon}</div>
            <div style={{ fontSize:'2rem', fontWeight:800, color }}>{value}</div>
            <div style={{ fontSize:'.75rem', color:'#8b949e', textTransform:'uppercase', letterSpacing:'.05em', marginTop:2 }}>{label}</div>
            <div style={{ fontSize:'.75rem', color, marginTop:6 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={c.chartRow}>
        {/* Bar chart */}
        <div style={c.chartCard}>
          <div style={c.chartTitle}>📅 Son 7 Gün</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80, marginTop:8 }}>
            {(stats?.daily_last7 || []).map((d) => (
              <div key={d.day} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flex:1 }}>
                <div style={{ width:'100%', borderRadius:'3px 3px 0 0',
                  background:'linear-gradient(180deg,#4f8ef7,#7c5af5)',
                  height: Math.max((d.c / maxBar) * 70, 4) }} title={`${d.c} talep`} />
                <span style={{ fontSize:'.62rem', color:'#8b949e' }}>{d.day?.slice(5)}</span>
              </div>
            ))}
            {!stats?.daily_last7?.length && <span style={{ color:'#8b949e', fontSize:'.85rem' }}>Veri yok</span>}
          </div>
        </div>

        {/* Donut */}
        <div style={c.chartCard}>
          <div style={c.chartTitle}>🗂️ Durum Dağılımı</div>
          <div style={{ display:'flex', gap:16, alignItems:'center', marginTop:8 }}>
            <div style={{
              width:80, height:80, borderRadius:'50%', flexShrink:0,
              background: `conic-gradient(
                #4f8ef7 0% ${Math.round((stats?.open||0)/Math.max(stats?.total,1)*100)}%,
                #e3b341 ${Math.round((stats?.open||0)/Math.max(stats?.total,1)*100)}%
                  ${Math.round(((stats?.open||0)+(stats?.progress||0))/Math.max(stats?.total,1)*100)}%,
                #3fb950 ${Math.round(((stats?.open||0)+(stats?.progress||0))/Math.max(stats?.total,1)*100)}% 100%)`,
              position:'relative',
            }}>
              <div style={{ position:'absolute', top:18, left:18, right:18, bottom:18, borderRadius:'50%', background:'#161b22' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[['#4f8ef7','Açık',stats?.open],['#e3b341','İşlemde',stats?.progress],['#3fb950','Çözüldü',stats?.resolved],['#8b949e','Kapalı',stats?.closed]].map(([col,lbl,val]) => (
                <div key={lbl} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.78rem' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:col, flexShrink:0 }} />
                  {lbl} ({val || 0})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <h2 style={{ fontSize:'1.05rem', fontWeight:600 }}>🕐 Son Talepler</h2>
        <button style={c.ghostBtn} onClick={() => navigate('/tickets')}>Tümünü Gör →</button>
      </div>
      <div style={c.ticketList}>
        {recent.map(t => <TicketRow key={t.id} ticket={t} onClick={() => navigate(`/tickets/${t.id}`)} />)}
        {!recent.length && <div style={c.empty}>Henüz talep yok</div>}
      </div>
    </div>
  );
}

export function TicketRow({ ticket: t, onClick }) {
  return (
    <div style={c.ticketCard} onClick={onClick}>
      <PriorityDot priority={t.priority} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:'.93rem', marginBottom:2 }}>{t.title}</div>
        <div style={{ fontSize:'.78rem', color:'#8b949e' }}>
          {t.creator_name} · {t.creator_department} · {t.category}
        </div>
      </div>
      <div style={{ fontSize:'.72rem', color:'#8b949e', whiteSpace:'nowrap', fontFamily:'monospace' }}>#{t.ticket_no}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
        <Badge type="status" value={t.status} />
        <Badge type="priority" value={t.priority} />
      </div>
    </div>
  );
}

const c = {
  loading: { padding:60, textAlign:'center', color:'#8b949e' },
  grid4: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 },
  statCard: {
    background:'#161b22', border:'1px solid #30363d', borderRadius:14,
    padding:'18px 20px', transition:'transform .2s',
  },
  chartRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 },
  chartCard: { background:'#161b22', border:'1px solid #30363d', borderRadius:14, padding:20 },
  chartTitle: { fontSize:'.85rem', fontWeight:600, color:'#8b949e' },
  ticketList: { display:'flex', flexDirection:'column', gap:8 },
  ticketCard: {
    background:'#161b22', border:'1px solid #30363d', borderRadius:12,
    padding:'14px 18px', display:'flex', alignItems:'center', gap:14,
    cursor:'pointer', transition:'all .2s',
  },
  ghostBtn: {
    background:'#1e2531', border:'1px solid #30363d', borderRadius:8,
    color:'#e6edf3', padding:'6px 14px', fontSize:'.8rem', cursor:'pointer',
  },
  empty: { textAlign:'center', padding:40, color:'#8b949e' },
};
