const S = {
  open: { label: 'Yeni', bg: 'rgba(13, 202, 240, 0.15)', color: '#0dcaf0' },
  resolved: { label: 'Çözüldü', bg: 'rgba(63,185,80,0.15)', color: '#3fb950' },
};
const P = {
  Kritik: { bg: 'rgba(248,81,73,0.15)', color: '#f85149' },
  Yüksek: { bg: 'rgba(255,123,114,0.10)', color: '#ff7b72' },
  Orta:   { bg: 'rgba(227,179,65,0.15)', color: '#e3b341' },
  Düşük:  { bg: 'rgba(63,185,80,0.10)', color: '#3fb950' },
};

export function Badge({ type, value }) {
  const m = type === 'status' ? S[value] : P[value];
  if (!m) return null;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'4px 12px', borderRadius:20,
      fontSize:'.72rem', fontWeight:600, background: m.bg, color: m.color, whiteSpace:'nowrap',
      border: `1px solid ${m.color}33` }}>
      {type === 'status' ? m.label : value}
    </span>
  );
}

export function PriorityDot({ priority }) {
  return null; 
}
