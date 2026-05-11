import { useState, useEffect } from 'react';
import { Building2, PieChart, Clock, TrendingUp } from 'lucide-react';
import api from '../../api/client';

export default function DepartmentReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tickets/departments_report')
      .then(res => setReport(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={s.loading}>Raporlar Yükleniyor...</div>;
  if (!report) return <div style={s.loading}>Veri bulunamadı.</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Departman Analizi & Raporlar</h2>
        <div style={s.subtitle}>Şirket içi departmanların destek talep performansları</div>
      </div>

      <div style={s.grid3}>
        <div style={s.statCard}>
          <div style={s.iconWrapper}><Building2 size={24} color="#4f8ef7" /></div>
          <div style={s.statValue}>{report.by_department.length}</div>
          <div style={s.statLabel}>Aktif Departman</div>
        </div>
        <div style={s.statCard}>
          <div style={s.iconWrapper}><TrendingUp size={24} color="#3fb950" /></div>
          <div style={s.statValue}>{report.by_department.reduce((sum, d) => sum + d.resolved_tickets, 0)}</div>
          <div style={s.statLabel}>Toplam Çözülen</div>
        </div>
        <div style={s.statCard}>
          <div style={s.iconWrapper}><Clock size={24} color="#a371f7" /></div>
          <div style={s.statValue}>{report.avg_resolution} sa</div>
          <div style={s.statLabel}>Şirket Ort. Çözüm Süresi</div>
        </div>
      </div>

      <div style={s.layout}>
        {/* Departman Listesi */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Departman Performansları</h3>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Departman</th>
                  <th style={s.th}>Toplam Talep</th>
                  <th style={s.th}>Açık</th>
                  <th style={s.th}>Çözülen</th>
                  <th style={s.th}>Ort. Çözüm (sa)</th>
                </tr>
              </thead>
              <tbody>
                {report.by_department.map(d => (
                  <tr key={d.department} style={s.tr}>
                    <td style={s.td}><span style={s.deptName}>{d.department}</span></td>
                    <td style={s.td}>{d.total_tickets}</td>
                    <td style={s.td}><span style={{ color: '#e3b341', fontWeight: 600 }}>{d.open_tickets}</span></td>
                    <td style={s.td}><span style={{ color: '#3fb950', fontWeight: 600 }}>{d.resolved_tickets}</span></td>
                    <td style={s.td}>{d.avg_res_hours > 0 ? d.avg_res_hours : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kategori Dağılımı */}
        <div style={s.card}>
          <h3 style={s.cardTitle}><PieChart size={18} /> En Çok Açılan Kategoriler</h3>
          <div style={s.catList}>
            {report.by_category.map((c, i) => {
              const total = report.by_category.reduce((sum, item) => sum + item.c, 0);
              const percent = Math.round((c.c / total) * 100);
              return (
                <div key={c.category} style={s.catItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '.85rem', color: '#c9d1d9' }}>{i + 1}. {c.category}</span>
                    <span style={{ fontSize: '.8rem', color: '#8b949e', fontWeight: 600 }}>{c.c} talep (%{percent})</span>
                  </div>
                  <div style={s.barBg}>
                    <div style={{ ...s.barFill, width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  loading: { padding: 60, textAlign: 'center', color: '#8b949e' },
  header: { marginBottom: 24 },
  title: { fontSize: '1.45rem', fontWeight: 700, color: '#ffffff', margin: 0 },
  subtitle: { fontSize: '.85rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: 4 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 },
  statCard: { 
    background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px) saturate(180%)', 
    border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 20, padding: '24px', 
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },
  iconWrapper: { marginBottom: 12, padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 12 },
  statValue: { fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 },
  statLabel: { fontSize: '.8rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '.05em' },
  layout: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' },
  card: { 
    background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px) saturate(180%)', 
    border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 20, padding: 24,
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },
  cardTitle: { fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', marginTop: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: '.75rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
  tr: { borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' },
  td: { padding: '16px', fontSize: '.85rem', color: '#eaf6f7' },
  deptName: { fontWeight: 600, color: '#0dcaf0', background: 'rgba(13, 202, 240, 0.1)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(13, 202, 240, 0.2)' },
  catList: { display: 'flex', flexDirection: 'column', gap: 16 },
  catItem: { display: 'flex', flexDirection: 'column' },
  barBg: { height: 6, background: 'rgba(0, 0, 0, 0.2)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', background: 'linear-gradient(90deg, #0dcaf0, #048a9f)', borderRadius: 3 },
};
