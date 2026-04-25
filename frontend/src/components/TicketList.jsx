import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Badge, PriorityDot } from './Dashboard';
import { useAuth } from '../context/AuthContext';

export default function TicketList() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(user.role === 'user' ? 'all' : 'active');
  const [sort, setSort] = useState('priority');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'critical') params.priority = 'Kritik';
      else if (filter === 'active') params.exclude_status = 'resolved,closed';
      else if (filter !== 'all') params.status = filter;
      if (search) params.q = search;
      params.sort = sort;
      const { data } = await api.get('/tickets', { params });
      setTickets(data.tickets);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [filter, search, sort]);

  useEffect(() => { load(); }, [load]);

  const filters = [
    { key: 'active', label: 'Aktif Talepler', adminOnly: true },
    { key: 'all', label: 'Tümü' },
    { key: 'open', label: 'Yeni Açılan' },
    { key: 'progress', label: 'İşlemde' },
    { key: 'resolved', label: 'Çözüldü' },
    { key: 'closed', label: 'Kapalı' },
    { key: 'critical', label: '🔥 Kritik' },
  ].filter(f => !f.adminOnly || user.role !== 'user');

  const getHoursOpen = (createdAt) => {
    const diff = new Date() - new Date(createdAt);
    return Math.floor(diff / (1000 * 60 * 60));
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>🎫 Tüm Talepler <span style={{ color: '#8b949e', fontWeight: 400 }}>({total})</span></h2>
        <button style={s.primaryBtn} onClick={() => navigate('/tickets/new')}>➕ Yeni Talep</button>
      </div>

      <div style={s.filters}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', flex:1 }}>
          <input
            style={s.searchBar} type="text"
            placeholder="🔍  Talep ara..." value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {filters.map(f => (
            <button key={f.key}
              style={{ ...s.filterBtn, ...(filter === f.key ? s.filterActive : {}) }}
              onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <select 
          style={{ ...s.filterBtn, background:'#1c2128', color:'#c9d1d9', cursor:'pointer' }}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="priority">🔥 Önceliğe Göre</option>
          <option value="time_desc">🕒 En Yeniler</option>
          <option value="time_asc">⏳ En Eskiler</option>
        </select>
      </div>

      {loading ? (
        <div style={s.center}>Yükleniyor...</div>
      ) : tickets.length === 0 ? (
        <div style={s.center}>Sonuç bulunamadı 🎉</div>
      ) : (
        <div style={s.list}>
          {tickets.map(t => (
            <div key={t.id} style={s.card} onClick={() => navigate(`/tickets/${t.id}`)}>
              <PriorityDot priority={t.priority} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '.93rem', marginBottom: 2 }}>
                  {t.title}
                  {(t.status === 'open' || t.status === 'progress') && (
                    <span style={{ fontSize: '.7rem', color: '#e3b341', marginLeft: 8, fontWeight: 500, background:'rgba(227,179,65,0.1)', padding:'2px 6px', borderRadius:10 }}>
                      ⏳ {getHoursOpen(t.created_at)} saattir açık
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '.78rem', color: '#8b949e' }}>
                  {t.creator_name} · {t.creator_department} · {t.category}
                  <span style={{ marginLeft: 8 }}>{t.created_at?.slice(0, 16).replace('T', ' ')}</span>
                </div>
              </div>
              {t.assignee_name
                ? <div style={s.assignee}>{t.assignee_name.split(' ')[0]}</div>
                : <div style={{ ...s.assignee, color: '#8b949e' }}>Atanmadı</div>}
              <div style={{ fontSize: '.72rem', color: '#8b949e', fontFamily: 'monospace' }}>#{t.ticket_no}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <Badge type="status" value={t.status} />
                <Badge type="priority" value={t.priority} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  filters: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  searchBar: {
    flex: 1, minWidth: 200, background: '#1e2531', border: '1px solid #30363d',
    borderRadius: 20, padding: '7px 16px', color: '#e6edf3', fontSize: '.85rem',
    fontFamily: 'inherit', outline: 'none',
  },
  filterBtn: {
    background: '#1e2531', border: '1px solid #30363d', color: '#8b949e',
    borderRadius: 20, padding: '5px 14px', fontSize: '.78rem', fontWeight: 500,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  filterActive: { background: '#4f8ef7', borderColor: '#4f8ef7', color: '#fff' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  card: {
    background: '#161b22', border: '1px solid #30363d', borderRadius: 12,
    padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
    cursor: 'pointer', transition: 'all .2s',
  },
  assignee: { fontSize: '.78rem', fontWeight: 500, whiteSpace: 'nowrap', color: '#4f8ef7' },
  center: { padding: 60, textAlign: 'center', color: '#8b949e' },
  primaryBtn: {
    background: 'linear-gradient(135deg,#4f8ef7,#7c5af5)', color: '#fff',
    border: 'none', borderRadius: 9, padding: '8px 16px',
    fontSize: '.85rem', fontWeight: 600, cursor: 'pointer',
  },
};
