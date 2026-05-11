import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Filter, ArrowUpDown } from 'lucide-react';
import api from '../../api/client';
import { Badge, PriorityDot } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

export default function TicketList() {
  const { user } = useAuth();

  // Rol bazlı varsayılan filtre
  const defaultFilter = user.role === 'admin' ? 'all' : 'active';

  // sessionStorage'dan oku, yoksa role göre varsayılan kullan
  const [filter, setFilter] = useState(() => sessionStorage.getItem('ticketFilter') ?? defaultFilter);
  const [sort,   setSort]   = useState(() => sessionStorage.getItem('ticketSort')   ?? 'time_desc');
  const [search, setSearch] = useState(() => sessionStorage.getItem('ticketSearch') ?? '');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen,   setIsSortOpen]   = useState(false);
  const [tickets,      setTickets]      = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);

  const navigate = useNavigate();

  // Filtre değişince sessionStorage'a kaydet ve sayfayı sıfırla
  useEffect(() => { 
    sessionStorage.setItem('ticketFilter', filter); 
    setPage(1);
  }, [filter]);
  
  useEffect(() => { 
    sessionStorage.setItem('ticketSort', sort); 
    setPage(1);
  }, [sort]);
  
  useEffect(() => { 
    sessionStorage.setItem('ticketSearch', search); 
    setPage(1);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter === 'critical') params.priority = 'Kritik';
      else if (filter === 'active') params.exclude_status = 'resolved,closed';
      else if (filter !== 'all') params.status = filter;
      if (search) params.q = search;
      params.sort = sort;
      
      const { data } = await api.get('/tickets', { params });
      
      if (page === 1) {
        setTickets(data.tickets);
      } else {
        setTickets(prev => [...prev, ...data.tickets]);
      }
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [filter, search, sort, page]);

  useEffect(() => { load(); }, [load]);

  const filters = [
    { key: 'active', label: 'Aktif Talepler', adminOnly: true },
    { key: 'all', label: 'Tümü' },
    { key: 'open', label: 'Yeni Açılan' },
    { key: 'progress', label: 'İşlemde' },
    { key: 'resolved', label: 'Çözüldü' },
    { key: 'closed', label: 'Kapalı' },
    { key: 'critical', label: 'Kritik Bekleyen' },
  ].filter(f => !f.adminOnly || user.role !== 'user');

  const sorts = [
    { key: 'priority', label: 'Önceliğe Göre' },
    { key: 'time_desc', label: 'En Yeniler' },
    { key: 'time_asc', label: 'En Eskiler' },
  ];

  const getHoursOpen = (createdAt) => {
    const diff = new Date() - new Date(createdAt);
    return Math.floor(diff / (1000 * 60 * 60));
  };

  const getSlaBadge = (t) => {
    if (t.status === 'resolved' || t.status === 'closed') return null;
    const limits = { 'Kritik': 4, 'Yüksek': 8, 'Orta': 24, 'Düşük': 48 };
    const limitH = limits[t.priority] || 24;
    const diff = new Date() - new Date(t.created_at);
    const diffH = diff / (1000 * 60 * 60);
    const remaining = limitH - diffH;
    
    if (remaining < 0) return <span style={{...s.hoursBadge, color:'#f85149', background:'rgba(248,81,73,0.1)'}}>SLA İhlali! ({Math.abs(Math.floor(remaining))} sa gecikti)</span>;
    if (remaining < limitH * 0.25) return <span style={{...s.hoursBadge, color:'#e3b341', background:'rgba(227,179,65,0.1)'}}>SLA Yaklaşıyor ({Math.floor(remaining)} sa kaldı)</span>;
    return <span style={{...s.hoursBadge, color:'#8b949e', background:'rgba(139,148,158,0.1)'}}>SLA: {Math.floor(remaining)} sa</span>;
  };

  const activeFilterLabel = filters.find(f => f.key === filter)?.label || 'Filtrele';
  const activeSortLabel = sorts.find(s => s.key === sort)?.label || 'Sırala';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #30363d' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color:'#e6edf3', margin:0 }}>Tüm Talepler</h2>
          <div style={{ fontSize: '.8rem', color: '#8b949e', marginTop: 4 }}>Toplam {total} kayıt listeleniyor</div>
        </div>
        <button style={s.primaryBtn} onClick={() => navigate('/tickets/new')}>Yeni Talep Oluştur</button>
      </div>

      <div style={s.controlsContainer}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={16} color="#8b949e" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            style={{ ...s.searchBar, paddingLeft: 36, width: '100%', boxSizing: 'border-box' }} type="text"
            placeholder="Arama yap..." value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Custom Filter Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              style={s.dropdownBtn} 
              onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
            >
              <Filter size={14} color="#8b949e" />
              <span>{activeFilterLabel}</span>
              <ChevronDown size={14} color="#8b949e" />
            </button>
            {isFilterOpen && (
              <>
                <div style={s.overlay} onClick={() => setIsFilterOpen(false)} />
                <div style={s.dropdownMenu}>
                  {filters.map(f => (
                    <div 
                      key={f.key}
                      style={{ ...s.dropdownItem, ...(filter === f.key ? s.dropdownActive : {}) }}
                      onClick={() => { setFilter(f.key); setIsFilterOpen(false); }}
                    >
                      {f.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Custom Sort Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              style={s.dropdownBtn} 
              onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
            >
              <ArrowUpDown size={14} color="#8b949e" />
              <span>{activeSortLabel}</span>
              <ChevronDown size={14} color="#8b949e" />
            </button>
            {isSortOpen && (
              <>
                <div style={s.overlay} onClick={() => setIsSortOpen(false)} />
                <div style={s.dropdownMenu}>
                  {sorts.map(ss => (
                    <div 
                      key={ss.key}
                      style={{ ...s.dropdownItem, ...(sort === ss.key ? s.dropdownActive : {}) }}
                      onClick={() => { setSort(ss.key); setIsSortOpen(false); }}
                    >
                      {ss.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={s.center}>Yükleniyor...</div>
      ) : tickets.length === 0 ? (
        <div style={s.center}>Kayıt bulunamadı.</div>
      ) : (
        <div style={s.list}>
          {tickets.map(t => (
            <div key={t.id} style={s.card} onClick={() => navigate(`/tickets/${t.id}`)}>
              <PriorityDot priority={t.priority} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '.93rem', marginBottom: 2 }}>
                  {t.title}
                  {(t.status === 'open' || t.status === 'progress') && (
                    getSlaBadge(t)
                  )}
                  {(t.status === 'resolved' || t.status === 'closed') && (
                    <span style={{...s.hoursBadge, color: '#3fb950', background: 'rgba(63,185,80,0.1)'}}>
                      Çözüm: {t.resolved_at ? Math.floor((new Date(t.resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60)) : Math.floor((new Date(t.updated_at) - new Date(t.created_at)) / (1000 * 60 * 60))} sa.
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

      {tickets.length > 0 && tickets.length < total && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button style={s.ghostBtn} onClick={() => setPage(p => p + 1)}>
            {loading ? 'Yükleniyor...' : 'Daha Fazla Göster'}
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  controlsContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  searchBar: {
    minWidth: 240, background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    borderRadius: 10, padding: '10px 16px', color: '#ffffff', fontSize: '.85rem',
    fontFamily: 'inherit', outline: 'none', transition: 'all 0.3s',
  },
  dropdownBtn: {
    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    borderRadius: 10, padding: '10px 16px', fontSize: '.8rem', fontWeight: 500,
    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.3s',
    display: 'flex', alignItems: 'center', gap: 8, minWidth: 140, justifyContent: 'space-between'
  },
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90
  },
  dropdownMenu: {
    position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 200,
    background: 'rgba(15, 25, 40, 0.85)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 16,
    backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden',
    padding: '6px 0'
  },
  dropdownItem: {
    padding: '12px 18px', fontSize: '.8rem', color: 'rgba(255, 255, 255, 0.6)', cursor: 'pointer',
    transition: 'all 0.2s', fontWeight: 500
  },
  dropdownActive: {
    background: 'rgba(13, 202, 240, 0.15)', color: '#0dcaf0', fontWeight: 600
  },
  hoursBadge: { fontSize: '.7rem', color: '#e3b341', marginLeft: 12, fontWeight: 500, background: 'rgba(227, 179, 65, 0.1)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(227, 179, 65, 0.2)' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 20,
    padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16,
    cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },
  assignee: { fontSize: '.8rem', fontWeight: 600, whiteSpace: 'nowrap', color: '#0dcaf0', background: 'rgba(13, 202, 240, 0.1)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(13, 202, 240, 0.2)' },
  center: { padding: 60, textAlign: 'center', color: '#8b949e', fontSize: '.9rem' },
  primaryBtn: {
    background: 'linear-gradient(135deg, #0dcaf0, #048a9f)', color: '#fff',
    border: 'none', borderRadius: 10, padding: '10px 20px', boxShadow: '0 8px 20px rgba(13, 202, 240, 0.3)',
    fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s',
  },
  ghostBtn: {
    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 10,
    color: '#ffffff', padding: '10px 20px', fontSize: '.85rem', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.3s'
  },
};
