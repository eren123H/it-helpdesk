import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Clock, CheckCircle2, AlertTriangle, Calendar, PieChart, History } from 'lucide-react';
import api from '../../api/client';

import { Badge, PriorityDot } from '../ui/Badge';

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
          { icon: <Ticket size={24} color="#4f8ef7" />, value: stats?.total    || 0, label:'Toplam Talep',  sub:'Tüm zamanlar',          color:'#4f8ef7' },
          { icon: <Clock size={24} color="#e3b341" />, value: stats?.open     || 0, label:'Açık Talepler', sub:`${stats?.critical||0} kritik bekliyor`, color:'#e3b341' },
          { icon: <CheckCircle2 size={24} color="#3fb950" />, value: stats?.resolved || 0, label:'Çözümlendi',    sub:'Bu ay',                  color:'#3fb950' },
          { icon: <AlertTriangle size={24} color="#f85149" />, value: stats?.critical || 0, label:'Kritik',        sub:'SLA takibinde',          color:'#f85149' },
        ].map(({ icon, value, label, sub, color }) => (
          <div key={label} style={c.statCard}>
            <div style={{ marginBottom:12 }}>{icon}</div>
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
          <div style={c.chartTitle}>
            <Calendar size={16} />
            Son 7 Gün Trendi
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:130, marginTop:24, overflowX:'auto', paddingBottom:8 }}>
            {stats?.daily_last7?.length ? (
              (() => {
                const max = Math.max(...stats.daily_last7.map(d => d.c), 1);
                return stats.daily_last7.map((d) => (
                  <div key={d.day} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flex:1, minWidth: 45 }}>
                    <span style={{ fontSize:'.85rem', fontWeight:700, color:'#c9d1d9' }}>{d.c}</span>
                    <div style={{ width:'32px', borderRadius:'3px 3px 0 0',
                      background:'linear-gradient(180deg,#4f8ef7,#7c5af5)',
                      height: Math.max((d.c / max) * 80, 4) }} title={`${d.c} talep`} />
                    <span style={{ fontSize:'.75rem', color:'#8b949e' }}>{d.day?.slice(5)}</span>
                  </div>
                ));
              })()
            ) : (
              <span style={{ color:'#8b949e', fontSize:'.85rem' }}>Veri yok</span>
            )}
          </div>
        </div>

        {/* Donut */}
        <div style={c.chartCard}>
          <div style={c.chartTitle}>
            <PieChart size={16} />
            Durum Dağılımı
          </div>
          <div style={{ display:'flex', gap:16, alignItems:'center', marginTop:16 }}>
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
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, marginTop:8 }}>
        <h2 style={{ fontSize:'1.05rem', fontWeight:600, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <History size={18} color="#8b949e" />
          Son Talepler
        </h2>
        <button style={c.ghostBtn} onClick={() => navigate('/tickets')}>Tümünü Gör</button>
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
  chartTitle: { fontSize:'.85rem', fontWeight:600, color:'#8b949e', display: 'flex', alignItems: 'center', gap: 6 },
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
