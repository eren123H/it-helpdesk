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
